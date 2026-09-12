from pydantic import BaseModel
from datetime import date

class ExpenseSchema(BaseModel):
    id: int
    date: date
    name: str
    quantity_purchased: int
    unit_price: float
    amount: float
    really_needed: bool
    expense_type_id: int

    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy model
