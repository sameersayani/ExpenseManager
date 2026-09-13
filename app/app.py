from collections import defaultdict
from datetime import datetime
import io
import json
from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, Response, requests, status
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from starlette.staticfiles import StaticFiles
from fastapi.encoders import jsonable_encoder
from fastapi.templating import Jinja2Templates
from tortoise.contrib.fastapi import register_tortoise
from app.models import (
    DailyExpenseUpdate,
    DailyExpenseCreate,
    expensetpye_pydantic, expensetpye_pydantic_in, ExpenseType, ExpenseTypeUpdate,
    daily_expense_pydantic, daily_expense_pydantic_in,
    DailyExpense, DailyExpenseWithExpenseType, UserInfo
)
from app.ai_service import run_chat
from app.schemas_ai import ChatRequest, DeleteConfirmationRequest
from app.services.daily_expenses import delete_expense as delete_expense_service
from starlette.requests import Request

from dotenv import dotenv_values
from typing import List, Optional
from authlib.integrations.starlette_client import OAuth, OAuthError
from app.config import API_BASE_URL, DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REACT_BASE_URL
import os
import openpyxl
from tortoise.expressions import Q
from fastapi.openapi.docs import get_swagger_ui_html
from pathlib import Path

static_dir = os.path.join(os.path.dirname(__file__), "static")
# Initialize FastAPI app
app = FastAPI()

db_url = os.getenv("DATABASE_URL")
register_tortoise(
    app,
    db_url=os.getenv("DATABASE_URL"),  # Update with your DB credentials
    modules={"models": ["app.models"]},  # Replace "models" with your actual model module
    generate_schemas=True,  # Automatically generate tables
    add_exception_handlers=True,
)

app.mount("/static", StaticFiles(directory=static_dir), name="static")
# Middleware for sessions
##app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "default_secret_key"), same_site="lax")
# ✅ Add SessionMiddleware FIRST
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", GOOGLE_CLIENT_SECRET),
    session_cookie="session_id",  # ✅ Add a session cookie name
    same_site="lax",
    https_only=False  # Set to True in production
)

# # CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("REACT_BASE_URL", REACT_BASE_URL)],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

##app.mount("/static", StaticFiles(directory="static"), name="static")

oauth = OAuth()
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    client_kwargs={
        'scope': 'email openid profile',
        # 'redirect_url': 'http://localhost:8000/auth'
    }
)

templates = templates = Jinja2Templates(directory=Path(__file__).parent / "templates")
# async def get_current_user(request: Request):
#     if "session" not in request.scope:
#         raise HTTPException(
#             status_code=500,
#             detail="SessionMiddleware is not properly configured. Restart the server."
#         )

#     user = request.session.get("user")
#     if not user:
#         raise HTTPException(status_code=401, detail="Unauthorized. Please log in.")

#     return user

async def get_current_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def get_or_create_user_info(user: dict) -> UserInfo:
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="User authentication failed")

    user_info = await UserInfo.get_or_none(email=email)
    if user_info:
        return user_info

    return await UserInfo.create(email=email, createdby=email)

@app.get("/")
def index(request: Request):
    user = request.session.get('user')
    if user:
        return RedirectResponse('welcome')

    return templates.TemplateResponse(
        name="home.html",
        context={"request": request}
    )

@app.get('/welcome')
def welcome(request: Request):
    user = request.session.get('user')
    if not user:
        return RedirectResponse('/')
    return templates.TemplateResponse(
        name='welcome.html',
        context={'request': request, 'user': user}
    )

@app.get("/login")
async def login(request: Request):
    print("DEBUG CLIENT_ID:", GOOGLE_CLIENT_ID)
    print("DEBUG CLIENT_SECRET:", GOOGLE_CLIENT_SECRET)

    url = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, url)

@app.get('/auth')
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        return templates.TemplateResponse(
            name='error.html',
            context={'request': request, 'error': e.error}
        )
    
    user = token.get('userinfo')
    if user:
        user = dict(user)
        await get_or_create_user_info(user)
        request.session['user'] = user

    return RedirectResponse(REACT_BASE_URL+"/")

@app.get("/user")
def get_user(request: Request, user: dict = Depends(get_current_user)):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return JSONResponse(content={"user": user})

@app.get('/logout')
def logout(request: Request, user: dict = Depends(get_current_user)):
    request.session.pop('user')
    request.session.clear()
    return RedirectResponse('/')

# Health Check
@app.get("/api/health")
def health_check():
    return {"status": "API is working!"}

@app.post("/api/ai/chat")
async def ai_chat(chat_request: ChatRequest, user: dict = Depends(get_current_user)):
    user_info = await get_or_create_user_info(user)
    try:
        result = await run_chat(
            [message.model_dump() for message in chat_request.messages],
            user_info,
        )
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    return JSONResponse(content=jsonable_encoder(result))

@app.post("/api/ai/confirm-delete")
async def confirm_ai_delete(
    confirmation: DeleteConfirmationRequest,
    user: dict = Depends(get_current_user),
):
    user_info = await get_or_create_user_info(user)
    await delete_expense_service(user_info, confirmation.expense_id)
    return {"status": "OK", "message": f"Expense #{confirmation.expense_id} deleted"}

# Expense Type Endpoints
@app.get("/expensetype")
async def get_expensetype(user: dict = Depends(get_current_user)):
    query = ExpenseType.all().order_by("name")  # Don't await here
    response = await expensetpye_pydantic.from_queryset(query)  # Await here instead
    return response

@app.get("/expensetype/{expensetype_id}")
async def get_expensetype_by_id(expensetype_id: int, user: dict = Depends(get_current_user)):
    response = await ExpenseType.get_or_none(id=expensetype_id)
    if not response:
        raise HTTPException(status_code=404, detail="Expense type not found")
    return JSONResponse(content=jsonable_encoder(await expensetpye_pydantic.from_tortoise_orm(response)))

@app.post('/expensetype')
async def add_expensetype(expensetype_info: expensetpye_pydantic_in, 
                          user: dict = Depends(get_current_user)):
    expensetype_obj = await ExpenseType.create(**expensetype_info.dict(exclude_unset=True))
    return JSONResponse(content=jsonable_encoder(await expensetpye_pydantic.from_tortoise_orm(expensetype_obj)))

@app.put("/expensetype/{expensetype_id}")
async def update_expensetype(expensetype_id: int, update_data: ExpenseTypeUpdate, user: dict = Depends(get_current_user)):
    update_count = await ExpenseType.filter(id=expensetype_id).update(name=update_data.name)
    
    if update_count == 0:
        raise HTTPException(status_code=404, detail="Expense type not found")

    updated_expense_type = await ExpenseType.get(id=expensetype_id)  # Fetch updated data
    return {"status": "OK", "data": jsonable_encoder(updated_expense_type)}

@app.delete("/expensetype/{expensetype_id}")
async def delete_expensetype(expensetype_id: int, user: dict = Depends(get_current_user)):
    deleted_count = await ExpenseType.filter(id=expensetype_id).delete()
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense type not found")
    return {"status": "OK"}

# Daily Expense Endpoints
@app.get('/dailyexpense')
async def all_expenses(month: Optional[int] = None, year: Optional[int] = None, 
                       user: dict = Depends(get_current_user)):
    user_info = await get_or_create_user_info(user)

    query = DailyExpense.filter(user_id=user_info.id).prefetch_related('expense_type')
    response = await DailyExpenseWithExpenseType.from_queryset(query)
    response_list = jsonable_encoder(response)
    for expense in response_list:
        expense["user_id"] = user_info.id

    if month and year:
        filtered_expenses = [
            expense for expense in response_list
            if expense.get("date") and
               datetime.fromisoformat(expense["date"].replace("Z", "")).month == month and
               datetime.fromisoformat(expense["date"].replace("Z", "")).year == year
        ]
    else:
        filtered_expenses = response_list

    # Ensure amount is always a float
    total_expenditure = sum(float(expense.get("amount") or 0) for expense in filtered_expenses)

    # Filter and sum non-essential expenses
    non_essential_expenditure = sum(
        float(expense.get("amount") or 0) for expense in filtered_expenses if not expense.get("really_needed", False)
    )

    # Essential expenditure = total - non-essential
    essential_expenditure = total_expenditure - non_essential_expenditure

    return JSONResponse(content={
        "status": "OK",
        "actual_total_expenditure": format_indian_currency(total_expenditure),  # Ensure this function handles numbers
        "non_essential_expenditure": format_indian_currency(non_essential_expenditure),
        "essential_expenditure": format_indian_currency(essential_expenditure),
        "data": filtered_expenses
    })

@app.get('/dailyexpense/{id}')
async def specific_expense(id: int, user: dict = Depends(get_current_user)):
    user_info = await get_or_create_user_info(user)

    expense = await DailyExpense.get_or_none(Q(id=id) & Q(user_id=user_info.id)).select_related('expense_type')
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    expense_data = await DailyExpenseWithExpenseType.from_tortoise_orm(expense)
    expense_data = jsonable_encoder(expense_data)
    expense_data["user_id"] = user_info.id

    # ✅ Convert Pydantic model to JSON-safe format
    return JSONResponse(content={"status": "OK", "data": expense_data})

@app.get("/search-expense/{name}")
async def search_expense_by_product(name: str, user: dict = Depends(get_current_user)):
    user_info = await get_or_create_user_info(user)

    if len(name) < 3:
        raise HTTPException(status_code=400, detail="Search must contain at least 3 characters")

    expenses = await DailyExpense.filter(
        Q(user_id=user_info.id) & (
            Q(name__icontains=name) |
            Q(date__startswith=name)
        )
    ).select_related("expense_type")

    if not expenses:
        raise HTTPException(status_code=404, detail="No matching expenses found")

    expense_data = [await DailyExpenseWithExpenseType.from_tortoise_orm(expense) for expense in expenses]
    expense_data = jsonable_encoder(expense_data)
    for expense in expense_data:
        expense["user_id"] = user_info.id

    total_expenditure = sum(float(expense.get("amount") or 0) for expense in expense_data)
    non_essential_expenditure = sum(
        float(expense.get("amount") or 0)
        for expense in expense_data
        if not expense.get("really_needed", False)
    )
    return JSONResponse(content={
        "status": "OK",
        "actual_total_expenditure": format_indian_currency(total_expenditure),
        "non_essential_expenditure": format_indian_currency(non_essential_expenditure),
        "essential_expenditure": format_indian_currency(total_expenditure - non_essential_expenditure),
        "data": expense_data,
    })

@app.post('/dailyexpense/{expensetype_id}')
async def add_expense(
    expensetype_id: int, 
    expense_details: DailyExpenseCreate,
    user: dict = Depends(get_current_user)
):
    user_info = await get_or_create_user_info(user)

    expense_type = await ExpenseType.get(id=expensetype_id)

    expense_data = expense_details.dict(exclude_unset=True)
    expense_data.pop("expense_type_id", None)

    # ✅ Business logic for amount calculation
    if expense_data.get("unit_price", 0) > 0 and expense_data.get("amount", 0) == 0: 
        expense_data["amount"] = expense_data["quantity_purchased"] * expense_data["unit_price"]

    expense_obj = await DailyExpense.create(
        **expense_data,
        expense_type=expense_type,
        user=user_info,
        createdby=user_info.email,
    )

    response = await DailyExpenseWithExpenseType.from_tortoise_orm(expense_obj)
    response_data = jsonable_encoder(response)
    response_data["user_id"] = user_info.id
    return {"status": "OK", "data": response_data}

@app.delete("/dailyexpense/{dailyexpense_id}")
async def delete_expense(dailyexpense_id: int, user: dict = Depends(get_current_user)):
    user_info = await get_or_create_user_info(user)
    expense = await DailyExpense.get_or_none(id=dailyexpense_id, user_id=user_info.id)
    if not expense:
        raise HTTPException(status_code=403, detail="Unauthorized or Expense not found")
    await expense.delete()
    return {"status": "OK", "message": "Expense deleted", "data": None}

@app.put("/dailyexpense/{expense_id}")
async def update_daily_expense(
    expense_id: int, 
    expense: DailyExpenseUpdate, 
    user: dict = Depends(get_current_user)
):
    user_info = await get_or_create_user_info(user)

    db_expense = await DailyExpense.get_or_none(
        id=expense_id,
        user_id=user_info.id,
    ).select_related("expense_type")
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    update_data = expense.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")

    for key, value in update_data.items():
        setattr(db_expense, key, value)

    db_expense.updatedon = datetime.utcnow()
    db_expense.updatedby = user_info.email
    await db_expense.save()
    updated_expense = await DailyExpenseWithExpenseType.from_tortoise_orm(db_expense)
    updated_expense = jsonable_encoder(updated_expense)
    updated_expense["user_id"] = user_info.id

    return JSONResponse(content={"status": "OK", "data": updated_expense})

## charts
@app.get("/chart-data")
async def get_chart_data(month: Optional[int] = None, year: Optional[int] = None, user: dict = Depends(get_current_user)):
    user_info = await get_or_create_user_info(user)
    query = DailyExpense.filter(user_id=user_info.id).prefetch_related('expense_type')
    response = await DailyExpenseWithExpenseType.from_queryset(query)
    response_list = jsonable_encoder(response)

    if month and year:
        filtered_expenses = [
            expense for expense in response_list
            if expense.get("date") and
               datetime.fromisoformat(expense["date"].replace("Z", "")).month == month and
               datetime.fromisoformat(expense["date"].replace("Z", "")).year == year
        ]
     # Group data
    grouped_data = defaultdict(lambda: defaultdict(list))
    for expense in filtered_expenses:
        # Convert object to dictionary
        expense_dict = dict(expense)

        # Convert date to ISO format string if needed
        raw_date = expense_dict['date']
        if isinstance(raw_date, datetime):
            raw_date = raw_date.isoformat()
        expense_dict['date'] = raw_date

        # Extract Year/Month and Expense Type
        date = datetime.fromisoformat(raw_date).date()
        year_month = date.strftime("%B %Y")  # Format as "Month Year" #f"{date.year}-{date.month:02d}"
        expense_type = expense_dict['expense_type']['name']

        ## Append expense to grouped structure
        #grouped_data[year_month][expense_type].append(expense_dict)

        filtered_expense = {
            "name": expense_dict['name'],
            "amount": expense_dict['amount'],
            "really_needed": expense_dict['really_needed'],
        }
        grouped_data[year_month][expense_type].append(filtered_expense)
       

     # Transform defaultdict to regular dict for JSON serialization
    grouped_dict = {
          year_month: {
               expense_type: expenses
               for expense_type, expenses in types.items()
          }
          for year_month, types in grouped_data.items()
     }

    return JSONResponse(content={"data": grouped_dict}) 

    # Example data
#     data = {
#         "labels": ["January", "February", "March", "April"],
#         "barValues": [500, 700, 800, 600],
#         "pieValues": [200, 300, 500],
#         "lineValues": [400, 500, 450, 600],
#     }

@app.get('/download-report', response_class=Response)
async def download_expense_report(
    month: Optional[int] = Query(None), 
    year: Optional[int] = Query(...),
    user: dict = Depends(get_current_user)
):
    """
    Generates an Excel (XLSX) report of expenses for the given month and year.
    - If month is provided, it generates a **monthly report**.
    - If month is omitted, it generates a **yearly report**.
    """

    # Fetch all expenses
    user_info = await get_or_create_user_info(user)
    query = DailyExpense.filter(user_id=user_info.id).prefetch_related("expense_type")
    response = await DailyExpenseWithExpenseType.from_queryset(query)
    response_list = jsonable_encoder(response)

    # Filter based on month & year 
    filtered_expenses = [
        expense for expense in response_list
        if expense.get("date") and
           datetime.fromisoformat(expense["date"].replace("Z", "")).year == year and
           (month is None or datetime.fromisoformat(expense["date"].replace("Z", "")).month == month)
    ]

    if not filtered_expenses:
        return JSONResponse(content={"status": "ERROR", "message": "No expenses found for the given period"})

    # Create an Excel workbook and worksheet
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"Expenses_{year}_{month if month else 'FullYear'}"

    # Add headers
    headers = ["Date", "Category", "Amount"]
    ws.append(headers)

    # Ensure that amount is never None, defaulting to 0
    total_expenditure = sum(expense.get("amount") or 0 for expense in filtered_expenses)

    # Ensure that expenses without "really_needed" default to False
    non_essential_expenditure = sum(
        (expense.get("amount") or 0) for expense in filtered_expenses if not expense.get("really_needed", False)
    )

    # Essential expenditure (all expenses - non-essential expenses)
    essential_expenditure = total_expenditure - non_essential_expenditure

    # Add data to worksheet
    for expense in filtered_expenses:
        ws.append([
            expense["date"].replace("T00:00:00Z",""),
            expense["expense_type"]["name"],  # Assuming expense_type has a "name" field
            expense["amount"]
        ])

    # Insert empty row before totals
    ws.append([])

    # Add totals
    ws.append(["", "Actual Total Expenditure", total_expenditure])
    ws.append(["", "Non-Essential Expenditure", non_essential_expenditure])
    ws.append(["", "Desired Essential Expenditure", essential_expenditure])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    # Prepare response with Excel data
    filename = f"expenses_{year}_{month if month else 'full_year'}.xlsx"
    response = Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"

    return response

@app.delete('/delete-expenses')
async def delete_expenses(
    month: Optional[int] = Query(None), 
    year: Optional[int] = Query(...),
    user: dict = Depends(get_current_user)
):
    """
    Deletes expenses for the given month and year.
    - If month is provided, it deletes the **monthly records**.
    - If month is omitted, it deletes the **entire year's records**.
    """
    
    if year is None:
        return JSONResponse(content={"status": "ERROR", "message": "Year is required"}, status_code=400)
    user_info = await get_or_create_user_info(user)
    # Create a filter condition for the year (and optionally for the month)
    query_filter = Q(user_id=user_info.id) & Q(date__startswith=f"{year}")
    if month:
        # ✅ Ensure proper formatting for month filtering (YYYY-MM)
        month_str = f"{year}-{str(month).zfill(2)}"
        query_filter &= Q(date__startswith=month_str)

    # Count the number of records before deletion
    count = await DailyExpense.filter(query_filter).count()

    if count == 0:
        return JSONResponse(content={"status": "ERROR", "message": "No records found to delete"}, status_code=404)

    # Perform deletion
    await DailyExpense.filter(query_filter).delete()

    return JSONResponse(content={"status": "OK", "message": f"Deleted {count} records successfully"})

def format_indian_currency(amount):
    amount_str = f"{amount:,}"  # Default formatting with commas
    parts = amount_str.split(",")

    # Apply Indian number formatting
    if len(parts) > 1:
        return parts[0] + "," + ",".join(parts[1:]).replace(",", "")

    return amount_str

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui(user: dict = Depends(get_current_user)):
    """Restrict access to Swagger UI"""
    return get_swagger_ui_html(openapi_url="/openapi.json", title="API Docs")

@app.get("/protected-route")
async def protected(user: dict = Depends(get_current_user)):
    return {"message": f"Hello, {user['given_name']}!"}

# # Database Registration
# register_tortoise(
#     app,
#     db_url="sqlite://database.sqlite3",
#     modules={"models": ["models"]},
#     generate_schemas=True,
#     add_exception_handlers=True
# )

