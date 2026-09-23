from datetime import datetime
from typing import Any

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from tortoise.expressions import Q

from app.models import (
    DailyExpense,
    DailyExpenseCreate,
    DailyExpenseWithExpenseType,
    ExpenseType,
    UserInfo,
)


def _validate_money(unit_price: float, amount: float, quantity: int = 1) -> tuple[float, float]:
    unit_price = float(unit_price or 0)
    amount = float(amount or 0)
    has_unit_price = unit_price > 0
    has_amount = amount > 0
    if has_unit_price and has_amount:
        raise HTTPException(status_code=422, detail="Enter either unit price or amount, not both")
    if not has_unit_price and not has_amount:
        raise HTTPException(status_code=422, detail="Enter either unit price or amount")
    if has_unit_price:
        amount = unit_price * quantity
    return unit_price, amount


async def serialize_expense(expense: DailyExpense) -> dict[str, Any]:
    data = await DailyExpenseWithExpenseType.from_tortoise_orm(expense)
    result = jsonable_encoder(data)
    result["user_id"] = expense.user_id
    return result


async def list_expenses(user: UserInfo, month: int | None = None, year: int | None = None) -> list[dict[str, Any]]:
    query = DailyExpense.filter(user_id=user.id).prefetch_related("expense_type")
    expenses = await DailyExpenseWithExpenseType.from_queryset(query)
    result = jsonable_encoder(expenses)
    if month and year:
        result = [
            item for item in result
            if item.get("date")
            and datetime.fromisoformat(item["date"].replace("Z", "")).month == month
            and datetime.fromisoformat(item["date"].replace("Z", "")).year == year
        ]
    for item in result:
        item["user_id"] = user.id
    return result


async def get_expense(user: UserInfo, expense_id: int) -> dict[str, Any]:
    expense = await DailyExpense.get_or_none(id=expense_id, user_id=user.id).select_related("expense_type")
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return await serialize_expense(expense)


async def search_expenses(user: UserInfo, name: str) -> list[dict[str, Any]]:
    expenses = await DailyExpense.filter(
        Q(user_id=user.id) & (
            Q(name__icontains=name) |
            Q(date__startswith=name)
        )
    ).select_related("expense_type")
    return [await serialize_expense(expense) for expense in expenses]


async def expense_report(user: UserInfo, year: int, month: int | None = None) -> dict[str, Any]:
    expenses = await list_expenses(user, month=month, year=year)
    total = sum(float(item.get("amount") or 0) for item in expenses)
    non_essential = sum(
        float(item.get("amount") or 0)
        for item in expenses
        if not item.get("really_needed", False)
    )
    return {
        "year": year,
        "month": month,
        "expense_count": len(expenses),
        "total": total,
        "essential_total": total - non_essential,
        "non_essential_total": non_essential,
        "expenses": expenses,
    }


async def create_expense(user: UserInfo, data: DailyExpenseCreate, expense_type_id: int) -> dict[str, Any]:
    expense_type = await ExpenseType.get_or_none(id=expense_type_id)
    if not expense_type:
        raise HTTPException(status_code=404, detail="Expense type not found")
    unit_price, amount = _validate_money(data.unit_price, data.amount, data.quantity_purchased)
    expense = await DailyExpense.create(
        date=data.date,
        name=data.name,
        quantity_purchased=data.quantity_purchased,
        unit_price=unit_price,
        amount=amount,
        really_needed=data.really_needed,
        currency=data.currency,
        expense_type=expense_type,
        user=user,
        createdby=user.email,
    )
    return await serialize_expense(expense)


async def update_expense(user: UserInfo, expense_id: int, data: dict[str, Any]) -> dict[str, Any]:
    expense = await DailyExpense.get_or_none(id=expense_id, user_id=user.id).select_related("expense_type")
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if "unit_price" not in data:
        data["unit_price"] = expense.unit_price
    if "amount" not in data:
        data["amount"] = expense.amount
    unit_price, amount = _validate_money(
        data["unit_price"],
        data["amount"],
        data.get("quantity_purchased", expense.quantity_purchased),
    )
    data["unit_price"] = unit_price
    data["amount"] = amount
    expense_type_id = data.pop("expense_type_id", None)
    if expense_type_id is not None:
        expense_type = await ExpenseType.get_or_none(id=expense_type_id)
        if not expense_type:
            raise HTTPException(status_code=404, detail="Expense type not found")
        expense.expense_type = expense_type
    for key in ("date", "name", "quantity_purchased", "unit_price", "amount", "really_needed", "currency"):
        if key in data:
            setattr(expense, key, data[key])
    expense.updatedon = datetime.utcnow()
    expense.updatedby = user.email
    await expense.save()
    return await serialize_expense(expense)


async def delete_expense(user: UserInfo, expense_id: int) -> None:
    expense = await DailyExpense.get_or_none(id=expense_id, user_id=user.id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    await expense.delete()
