from contextvars import ContextVar
from datetime import datetime
from typing import Any

try:
    from fastmcp import FastMCP
except ImportError:
    class _FallbackTool:
        def __init__(self, function):
            self.fn = function

    class FastMCP:
        def __init__(self, name):
            self.name = name

        def tool(self, function):
            return _FallbackTool(function)

from app.models import DailyExpenseCreate, ExpenseType, UserInfo
from app.services.daily_expenses import (
    create_expense,
    delete_expense,
    expense_report,
    get_expense,
    list_expenses,
    search_expenses,
    update_expense,
)

_current_user: ContextVar[UserInfo | None] = ContextVar("mcp_current_user", default=None)
mcp = FastMCP("ExpenseManager")


def set_current_user(user: UserInfo):
    return _current_user.set(user)


def reset_current_user(token):
    _current_user.reset(token)


def _user() -> UserInfo:
    user = _current_user.get()
    if not user:
        raise PermissionError("No authenticated user context")
    return user


@mcp.tool
async def list_user_expenses(month: int | None = None, year: int | None = None) -> dict[str, Any]:
    """List the authenticated user's daily expenses, optionally filtered by month and year."""
    return {"data": await list_expenses(_user(), month, year)}


@mcp.tool
async def get_user_expense(expense_id: int) -> dict[str, Any]:
    """Get one daily expense belonging to the authenticated user."""
    return {"data": await get_expense(_user(), expense_id)}


@mcp.tool
async def search_user_expenses(name: str) -> dict[str, Any]:
    """Search the authenticated user's expenses by product or service name."""
    return {"data": await search_expenses(_user(), name)}


@mcp.tool
async def list_expense_types() -> dict[str, Any]:
    """List expense types so an expense can be created using a type name instead of guessing its ID."""
    types = await ExpenseType.all().order_by("name")
    return {"data": [{"id": item.id, "name": item.name} for item in types]}


@mcp.tool
async def get_expense_report(year: int, month: int | None = None) -> dict[str, Any]:
    """Return totals and expense details for the authenticated user's selected year or month."""
    return {"data": await expense_report(_user(), year, month)}


@mcp.tool
async def create_user_expense(
    date: str,
    name: str,
    expense_type_id: int,
    currency: str,
    quantity_purchased: int = 1,
    unit_price: float | None = None,
    amount: float | None = None,
    really_needed: bool = False,
    classification_reason: str | None = None,
) -> dict[str, Any]:
    """Create an expense for the authenticated user. Provide exactly one positive money field. Currency is required."""
    payload = DailyExpenseCreate(
        date=datetime.fromisoformat(date),
        name=name,
        quantity_purchased=quantity_purchased,
        unit_price=unit_price,
        amount=amount,
        really_needed=really_needed,
        currency=currency,
    )
    return {"data": await create_expense(_user(), payload, expense_type_id)}


@mcp.tool
async def update_user_expense(
    expense_id: int,
    date: str | None = None,
    name: str | None = None,
    expense_type_id: int | None = None,
    quantity_purchased: int | None = None,
    unit_price: float | None = None,
    amount: float | None = None,
    currency: str | None = None,
    really_needed: bool | None = None,
    classification_reason: str | None = None,
) -> dict[str, Any]:
    """Update an authenticated user's expense. Provide exactly one positive money field after the update."""
    changes = {
        key: value for key, value in {
            "date": datetime.fromisoformat(date) if date else None,
            "name": name,
            "expense_type_id": expense_type_id,
            "quantity_purchased": quantity_purchased,
            "unit_price": unit_price,
            "amount": amount,
            "currency": currency,
            "really_needed": really_needed,
        }.items() if value is not None
    }
    return {"data": await update_expense(_user(), expense_id, changes)}


@mcp.tool
async def delete_user_expense(expense_id: int) -> dict[str, Any]:
    """Request deletion of an expense. The chat API requires explicit user confirmation before execution."""
    return {"confirmation_required": True, "expense_id": expense_id}


async def dispatch_tool(name: str, arguments: dict[str, Any], user: UserInfo) -> dict[str, Any]:
    token = set_current_user(user)
    try:
        tools = {
            "list_user_expenses": list_user_expenses,
            "get_user_expense": get_user_expense,
            "search_user_expenses": search_user_expenses,
            "list_expense_types": list_expense_types,
            "get_expense_report": get_expense_report,
            "create_user_expense": create_user_expense,
            "update_user_expense": update_user_expense,
            "delete_user_expense": delete_user_expense,
        }
        if name not in tools:
            raise ValueError("Unknown MCP tool")
        return await tools[name].fn(**arguments)
    finally:
        reset_current_user(token)


if __name__ == "__main__":
    mcp.run()
