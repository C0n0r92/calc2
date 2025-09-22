from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime


class MortgageCalculationBase(BaseModel):
    loan_amount: float
    interest_rate: float
    loan_term: int
    extra_payment: Optional[float] = 0
    current_age: int
    purchase_date: datetime
    extra_payment_starts_now: Optional[bool] = False
    payment_frequency: Optional[str] = "monthly"
    one_time_payment: Optional[float] = 0
    one_time_payment_date: Optional[datetime] = None
    down_payment: Optional[float] = 0
    home_value: float
    currency: Optional[str] = "USD"
    pmi_rate: Optional[float] = 0.5

    @validator('payment_frequency')
    def validate_payment_frequency(cls, v):
        if v not in ['monthly', 'biweekly']:
            raise ValueError('payment_frequency must be monthly or biweekly')
        return v

    @validator('currency')
    def validate_currency(cls, v):
        if v not in ['USD', 'EUR', 'GBP', 'CAD', 'AUD']:
            raise ValueError('currency must be one of: USD, EUR, GBP, CAD, AUD')
        return v


class MortgageCalculationRequest(MortgageCalculationBase):
    pass


class MortgageCalculationResult(BaseModel):
    monthly_payment: float
    principal: float
    interest: float
    total_payment: float
    total_interest: float
    payoff_months: int
    savings: float
    pmi_months: int
    pmi_amount: float
    amortization: List[dict]
    months_since_purchase: int
    current_balance: float


class ScenarioComparison(BaseModel):
    extra_payment: float
    months_saved: int
    interest_saved: float
    new_payoff_time: int


class ScenarioComparisonRequest(BaseModel):
    inputs: MortgageCalculationBase
    extra_payment_amounts: Optional[List[float]] = [50, 100, 200, 500]


class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
