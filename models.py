from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from passlib.context import CryptContext
from datetime import datetime
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    mortgage_calculations = relationship("MortgageCalculation", back_populates="user", cascade="all, delete-orphan")
    mortgage_scenarios = relationship("MortgageScenario", back_populates="user", cascade="all, delete-orphan")

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class MortgageCalculation(Base):
    __tablename__ = "mortgage_calculations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    loan_amount = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)
    loan_term = Column(Integer, nullable=False)
    extra_payment = Column(Float, default=0)
    current_age = Column(Integer, nullable=False)
    purchase_date = Column(DateTime, nullable=False)
    extra_payment_starts_now = Column(Boolean, default=False)
    payment_frequency = Column(String, default="monthly")  # monthly or biweekly
    one_time_payment = Column(Float, default=0)
    one_time_payment_date = Column(DateTime, nullable=True)
    down_payment = Column(Float, default=0)
    home_value = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    pmi_rate = Column(Float, default=0.5)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="mortgage_calculations")
    mortgage_scenarios = relationship("MortgageScenario", back_populates="mortgage_calculation", cascade="all, delete-orphan")

    def to_frontend_format(self) -> dict:
        return {
            "loan_amount": self.loan_amount,
            "interest_rate": self.interest_rate,
            "loan_term": self.loan_term,
            "extra_payment": self.extra_payment or 0,
            "current_age": self.current_age,
            "purchase_date": self.purchase_date.isoformat() if self.purchase_date else None,
            "extra_payment_starts_now": self.extra_payment_starts_now or False,
            "payment_frequency": self.payment_frequency,
            "one_time_payment": self.one_time_payment or 0,
            "one_time_payment_date": self.one_time_payment_date.isoformat() if self.one_time_payment_date else None,
            "down_payment": self.down_payment or 0,
            "home_value": self.home_value,
            "currency": self.currency,
            "pmi_rate": self.pmi_rate or 0.5
        }


class MortgageScenario(Base):
    __tablename__ = "mortgage_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mortgage_calculation_id = Column(Integer, ForeignKey("mortgage_calculations.id"), nullable=False)
    name = Column(String, nullable=False)
    results = Column(Text, nullable=False)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="mortgage_scenarios")
    mortgage_calculation = relationship("MortgageCalculation", back_populates="mortgage_scenarios")

    @property
    def calculation_inputs(self) -> dict:
        return self.mortgage_calculation.to_frontend_format()
