import json
import os
from typing import Any

import httpx

from app.mcp_server import dispatch_tool
from app.models import UserInfo
from app.expense_classification import classify_expense

SYSTEM_PROMPT = """You are the ExpenseManager assistant.
You may manage only the authenticated user's daily expenses through the available tools.
Never ask for or invent user IDs, expense type IDs, emails, audit fields, or database details.
When the user gives an expense type name, call list_expense_types and select the matching ID. Ask the user only if there is no clear match.
When creating or updating an expense, always include a currency. Supported currencies are INR, USD, EUR, GBP, AED. If the user does not specify a currency, ask them to choose one. Do not invent a currency.
Essential guardrails are enforced by the application. Treat entertainment, games, leisure, luxury, vacations, and hobbies as not really needed by default. Treat housing, utilities, food, medicine, medical tests, education, and transport as really needed. When uncertain, default to not really needed.
For money fields, exactly one of unit_price or amount must be positive.
Deletion and AI essential/non-essential classifications always require explicit confirmation from the user; do not claim a mutation happened when a confirmation is pending.
When creating or updating an expense, infer whether it is really needed and include a short classification_reason.
Keep answers concise and report the result of every tool action.
"""

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "list_user_expenses",
            "description": "List the authenticated user's expenses, optionally filtered by month and year.",
            "parameters": {"type": "object", "properties": {"month": {"type": "integer"}, "year": {"type": "integer"}}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_expense_report",
            "description": "Return a totals report for the authenticated user's expenses for a year, optionally filtered by month.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {"type": "integer", "description": "Four-digit year"},
                    "month": {"type": "integer", "description": "Optional month from 1 to 12"},
                },
                "required": ["year"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_expense",
            "description": "Get one expense by ID for the authenticated user.",
            "parameters": {"type": "object", "properties": {"expense_id": {"type": "integer"}}, "required": ["expense_id"]},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_user_expenses",
            "description": "Search the authenticated user's expenses by name.",
            "parameters": {"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_expense_types",
            "description": "List available expense types and IDs. Use this before creating an expense when the user provides a type name.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
    "type": "function",
    "function": {
        "name": "create_user_expense",
        "description": "Create an expense. Exactly one positive value must be supplied for unit_price or amount. Currency is required.",
        "parameters": {
            "type": "object",
            "properties": {
                "date": {"type": "string", "description": "ISO date or datetime"},
                "name": {"type": "string"},
                "expense_type_id": {"type": "integer"},
                "quantity_purchased": {"type": "integer"},
                "unit_price": {"type": "number"},
                "amount": {"type": "number"},
                "currency": {
                    "type": "string",
                    "enum": ["INR", "USD", "EUR", "GBP", "AED"],
                    "description": "Currency code for this expense"
                },
                "really_needed": {"type": "boolean"},
                "classification_reason": {"type": "string"},
            },
            "required": ["date", "name", "expense_type_id", "currency"],
            },
        },
    },
   {
    "type": "function",
    "function": {
        "name": "update_user_expense",
        "description": "Update an expense belonging to the authenticated user.",
        "parameters": {
        "type": "object",
        "properties": {
            "expense_id": {"type": "integer"},
            "date": {"type": "string"},
            "name": {"type": "string"},
            "expense_type_id": {"type": "integer"},
            "quantity_purchased": {"type": "integer"},
            "unit_price": {"type": "number"},
            "amount": {"type": "number"},
            "currency": {
            "type": "string",
            "enum": ["INR", "USD", "EUR", "GBP", "AED"],
            "description": "Currency code for this expense"
            },
            "really_needed": {"type": "boolean"},
            "classification_reason": {"type": "string"}
            },
            "required": ["expense_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_user_expense",
            "description": "Request deletion of an expense. The application will ask the user for confirmation.",
            "parameters": {"type": "object", "properties": {"expense_id": {"type": "integer"}}, "required": ["expense_id"]},
        },
    },
]


def _chat_completions_url() -> str:
    base_url = os.getenv("AI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    return base_url if base_url.endswith("/chat/completions") else f"{base_url}/chat/completions"


def _requires_api_key() -> bool:
    return not os.getenv("AI_BASE_URL", "").lower().startswith(("http://127.0.0.1", "http://localhost"))


def _assistant_tool_calls(message: dict[str, Any]) -> list[dict[str, Any]]:
    return message.get("tool_calls") or []


async def run_chat(messages: list[dict[str, str]], user: UserInfo) -> dict[str, Any]:
    if os.getenv("AI_ENABLED", "false").lower() != "true":
        return {"message": "AI chat is disabled. Set AI_ENABLED=true on the backend to enable it.", "tool_calls": []}

    api_key = os.getenv("AI_API_KEY")
    if _requires_api_key() and not api_key:
        return {"message": "AI chat is not configured. Set AI_API_KEY on the backend.", "tool_calls": []}

    model_messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    model_messages.extend(messages)
    tool_activity: list[dict[str, Any]] = []

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    request_body = {
        "model": os.getenv("AI_MODEL", "gpt-4o-mini"),
        "messages": model_messages,
        "tools": TOOL_SCHEMAS,
        "tool_choice": "auto",
        "temperature": 0.1,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        for _ in range(int(os.getenv("AI_MAX_TOOL_CALLS", "4"))):
            response = await client.post(_chat_completions_url(), headers=headers, json=request_body)
            if response.is_error:
                detail = response.text[:1000]
                raise RuntimeError(f"AI provider returned HTTP {response.status_code}: {detail}")
            assistant_message = response.json()["choices"][0]["message"]
            calls = _assistant_tool_calls(assistant_message)
            if not calls:
                return {"message": assistant_message.get("content") or "I could not produce a response.", "tool_calls": tool_activity}

            model_messages.append(assistant_message)
            request_body["messages"] = model_messages
            for call in calls:
                name = call["function"]["name"]
                arguments = json.loads(call["function"].get("arguments") or "{}")
                
                # Check validation for expense creation/updates
                if name in {"create_user_expense", "update_user_expense"}:
                    currency = arguments.get("currency")
                    expense_type_id = arguments.get("expense_type_id")
                    
                    # Intercept if currency or expense_type_id is not properly specified
                    if name == "create_user_expense" and (not currency or not expense_type_id):
                        # Fetch the actual system expense types to display
                        type_result = await dispatch_tool("list_expense_types", {}, user)
                        available_types = type_result.get("data", [])
                        types_list_str = ", ".join([f"{t['name']} (ID: {t['id']})" for t in available_types])
                        supported_currencies = ["INR", "USD", "EUR", "GBP", "AED"]
                        
                        missing_elements = []
                        if not expense_type_id:
                            missing_elements.append(
                                f"a valid expense type. Available categories are: [{types_list_str}]"
                            )
                        if not currency:
                            missing_elements.append(
                                f"a valid currency. Supported currencies are: {', '.join(supported_currencies)}"
                            )
                            
                        return {
                            "message": f"To add this expense, please specify: {' AND '.join(missing_elements)}.",
                            "tool_calls": tool_activity
                        }

                if name == "delete_user_expense":
                    expense_id = int(arguments["expense_id"])
                    return {
                        "message": f"Please confirm deletion of expense #{expense_id}.",
                        "tool_calls": tool_activity,
                        "pending_delete": {"expense_id": expense_id},
                    }
                if name in {"create_user_expense", "update_user_expense"}:
                    classification_name = arguments.get("name", "")
                    classification = classify_expense(classification_name)
                    suggested = classification.really_needed
                    operation = "create" if name == "create_user_expense" else "update"
                    reason = classification.reason
                    return {
                        "message": (
                            f"I classified this expense as "
                            f"{'really needed' if suggested else 'not really needed'}. "
                            f"{reason} Please confirm the classification before I save it."
                        ),
                        "tool_calls": tool_activity,
                        "pending_classification": {
                            "operation": operation,
                            "arguments": arguments,
                            "really_needed": suggested,
                            "reason": reason,
                        },
                    }
                result = await dispatch_tool(name, arguments, user)
                tool_activity.append({"name": name, "result": result})
                model_messages.append({"role": "tool", "tool_call_id": call["id"], "content": json.dumps(result)})
                request_body["messages"] = model_messages

    return {"message": "The request reached the tool-call limit. Please try a narrower question.", "tool_calls": tool_activity}
