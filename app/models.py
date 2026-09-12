from datetime import datetime
from pydantic import BaseModel
from tortoise.models import Model
from tortoise import fields
from tortoise.contrib.pydantic import pydantic_model_creator
class ExpenseType(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)

class ExpenseTypeUpdate(BaseModel):
    name: str
class DailyExpenseCreate(BaseModel):
    date: datetime
    name: str
    quantity_purchased: int = 1
    unit_price: float = 0.00
    amount: float = 0.00
    really_needed: bool = False
    expense_type_id: int 
    user_email: str

class DailyExpenseUpdate(BaseModel):
    date: datetime  
    name: str
    quantity_purchased: int = 1
    unit_price: float = 0.00
    amount: float = 0.00
    really_needed: bool = False
    expense_type_id: int  # Expecting this in the payload

class DailyExpense(Model):
    id = fields.IntField(pk=True)
    date = fields.DatetimeField(nullable=False)
    name = fields.CharField(max_length=200, nullable=False)
    quantity_purchased = fields.IntField(default = 1)
    unit_price = fields.FloatField(max_digits=8, decimal_places=2, default=0.00)
    amount = fields.FloatField(max_digits=8, decimal_places=2, default=0.00)
    really_needed = fields.BooleanField(default = False)
    expense_type = fields.ForeignKeyField('models.ExpenseType', 
                                         related_name="typeof_expense")
    user_email = fields.CharField(max_length=255)

class UserInfo(BaseModel):
    sub: str
    email: str
    name: str
    picture: str
    
expensetpye_pydantic = pydantic_model_creator(ExpenseType, name="ExpenseType")
expensetpye_pydantic_in = pydantic_model_creator(ExpenseType, name="ExpenseTypeIn", exclude_readonly=True)

# Create Pydantic model for DailyExpense, including expense_type as a nested model
daily_expense_pydantic = pydantic_model_creator(
    DailyExpense, 
    name="DailyExpense",
    include=("id", "date", "name", "quantity_purchased", "unit_price", "amount", "really_needed", "expense_type", "user_email")
)

# Input model for creation or update (exclude readonly fields)
daily_expense_pydantic_in = pydantic_model_creator(
    DailyExpense, 
    name="DailyExpenseIn", 
    exclude_readonly=True
)

class DailyExpenseWithExpenseType(daily_expense_pydantic):
    expense_type: expensetpye_pydantic   
