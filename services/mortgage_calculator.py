from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from typing import Dict, List, Optional
import math


class MortgageCalculatorService:
    def __init__(self, inputs: Dict):
        self.inputs = inputs
        self._amortization_data = None
        self._base_payment = None
        self._current_balance = None
        self._standard_loan = None

    def calculate(self) -> Dict:
        """Main calculation method that returns all mortgage calculation results"""
        return {
            "monthly_payment": self.monthly_payment,
            "principal": self.actual_loan_amount,
            "interest": self.total_interest,
            "total_payment": self.actual_loan_amount + self.total_interest,
            "total_interest": self.total_interest,
            "payoff_months": self.payoff_months,
            "savings": self.savings,
            "pmi_months": self.pmi_months,
            "pmi_amount": self.total_pmi,
            "amortization": self.amortization,
            "months_since_purchase": self.months_since_purchase,
            "current_balance": self.current_balance
        }

    def calculate_scenario_comparison(self, extra_payment_amounts: List[float] = None) -> List[Dict]:
        """Calculate comparison scenarios with different extra payment amounts"""
        if extra_payment_amounts is None:
            extra_payment_amounts = [50, 100, 200, 500]
        
        scenarios = []
        for extra_amount in extra_payment_amounts:
            # Calculate scenario with extra payment
            scenario_inputs = self.inputs.copy()
            scenario_inputs['extra_payment'] = extra_amount
            scenario_calculator = MortgageCalculatorService(scenario_inputs)
            scenario_result = scenario_calculator.calculate()

            # Calculate base scenario without extra payment
            base_inputs = self.inputs.copy()
            base_inputs['extra_payment'] = 0
            base_calculator = MortgageCalculatorService(base_inputs)
            base_result = base_calculator.calculate()

            scenarios.append({
                "extra_payment": extra_amount,
                "months_saved": base_result["payoff_months"] - scenario_result["payoff_months"],
                "interest_saved": base_result["total_interest"] - scenario_result["total_interest"],
                "new_payoff_time": scenario_result["payoff_months"]
            })

        return scenarios

    @property
    def actual_loan_amount(self) -> float:
        return float(self.inputs.get('loan_amount', 0))

    @property
    def monthly_rate(self) -> float:
        return float(self.inputs.get('interest_rate', 0)) / 100 / 12

    @property
    def payments_per_year(self) -> int:
        return 26 if self.inputs.get('payment_frequency') == 'biweekly' else 12

    @property
    def payment_rate(self) -> float:
        return float(self.inputs.get('interest_rate', 0)) / 100 / self.payments_per_year

    @property
    def number_of_payments(self) -> int:
        return int(self.inputs.get('loan_term', 0)) * self.payments_per_year

    @property
    def months_since_purchase(self) -> int:
        if not self.inputs.get('purchase_date'):
            return 0
        
        purchase_date = self.inputs['purchase_date']
        if isinstance(purchase_date, str):
            purchase_date = datetime.fromisoformat(purchase_date.replace('Z', '+00:00')).date()
        elif isinstance(purchase_date, datetime):
            purchase_date = purchase_date.date()
        
        today = date.today()
        months = (today.year - purchase_date.year) * 12 + (today.month - purchase_date.month)
        return max(0, months)

    @property
    def need_pmi(self) -> bool:
        return self.loan_to_value > 0.8

    @property
    def loan_to_value(self) -> float:
        home_value = float(self.inputs.get('home_value', 1))
        return self.actual_loan_amount / home_value if home_value > 0 else 0

    @property
    def pmi_rate(self) -> float:
        return (float(self.inputs.get('pmi_rate', 0.5)) / 100) if self.need_pmi else 0

    @property
    def monthly_pmi(self) -> float:
        return (self.actual_loan_amount * self.pmi_rate) / 12 if self.need_pmi else 0

    @property
    def base_payment(self) -> float:
        if self._base_payment is None:
            if self.inputs.get('payment_frequency') == 'biweekly':
                # Calculate monthly payment first, then divide by 2
                monthly_payment_calc = (
                    self.actual_loan_amount * 
                    (self.monthly_rate * (1 + self.monthly_rate) ** (int(self.inputs.get('loan_term', 0)) * 12)) / 
                    ((1 + self.monthly_rate) ** (int(self.inputs.get('loan_term', 0)) * 12) - 1)
                )
                self._base_payment = monthly_payment_calc / 2
            else:
                self._base_payment = (
                    self.actual_loan_amount * 
                    (self.monthly_rate * (1 + self.monthly_rate) ** self.number_of_payments) / 
                    ((1 + self.monthly_rate) ** self.number_of_payments - 1)
                )
        return self._base_payment

    @property
    def current_balance(self) -> float:
        if self._current_balance is None:
            self._current_balance = self._calculate_current_balance()
        return self._current_balance

    def _calculate_current_balance(self) -> float:
        if self.months_since_purchase <= 0:
            return self.actual_loan_amount

        temp_balance = self.actual_loan_amount
        periods_elapsed = (
            math.floor(self.months_since_purchase * 26 / 12) 
            if self.inputs.get('payment_frequency') == 'biweekly' 
            else self.months_since_purchase
        )

        for _ in range(periods_elapsed):
            if temp_balance <= 0.01:
                break
            
            interest_payment = temp_balance * self.payment_rate
            principal_payment = self.base_payment - interest_payment
            principal_payment = min(principal_payment, temp_balance)
            temp_balance -= principal_payment

        return max(0, temp_balance)

    @property
    def one_time_payment_period(self) -> int:
        if not self.inputs.get('one_time_payment_date') or not self.inputs.get('one_time_payment', 0):
            return -1

        one_time_date = self.inputs['one_time_payment_date']
        purchase_date = self.inputs['purchase_date']
        
        if isinstance(one_time_date, str):
            one_time_date = datetime.fromisoformat(one_time_date.replace('Z', '+00:00')).date()
        elif isinstance(one_time_date, datetime):
            one_time_date = one_time_date.date()
            
        if isinstance(purchase_date, str):
            purchase_date = datetime.fromisoformat(purchase_date.replace('Z', '+00:00')).date()
        elif isinstance(purchase_date, datetime):
            purchase_date = purchase_date.date()

        days_diff = (one_time_date - purchase_date).days
        period_length = 14 if self.inputs.get('payment_frequency') == 'biweekly' else 30.44
        return math.floor(days_diff / period_length)

    def _calculate_amortization_and_totals(self) -> Dict:
        if self._amortization_data is not None:
            return self._amortization_data

        balance = self.actual_loan_amount
        period = 0
        total_interest = 0
        total_pmi = 0
        pmi_months = 0
        amortization = []
        cumulative_interest = 0
        cumulative_principal = 0

        while balance > 0.01 and period < self.number_of_payments + 120:
            period += 1
            interest_payment = balance * self.payment_rate
            principal_payment = self.base_payment - interest_payment

            # Add extra payment logic
            periods_elapsed = (
                math.floor(self.months_since_purchase * 26 / 12) 
                if self.inputs.get('payment_frequency') == 'biweekly' 
                else self.months_since_purchase
            )

            if self.inputs.get('extra_payment_starts_now') and period > periods_elapsed and self.months_since_purchase > 0:
                extra_per_period = (
                    float(self.inputs.get('extra_payment', 0)) / 2 
                    if self.inputs.get('payment_frequency') == 'biweekly' 
                    else float(self.inputs.get('extra_payment', 0))
                )
                principal_payment += extra_per_period
            elif not self.inputs.get('extra_payment_starts_now'):
                extra_per_period = (
                    float(self.inputs.get('extra_payment', 0)) / 2 
                    if self.inputs.get('payment_frequency') == 'biweekly' 
                    else float(self.inputs.get('extra_payment', 0))
                )
                principal_payment += extra_per_period

            # Add one-time payment
            if period == self.one_time_payment_period and float(self.inputs.get('one_time_payment', 0)) > 0:
                principal_payment += float(self.inputs.get('one_time_payment', 0))

            principal_payment = min(principal_payment, balance)

            # Calculate PMI
            current_ltv = balance / float(self.inputs.get('home_value', 1))
            current_pmi = self.monthly_pmi if current_ltv > 0.8 else 0
            if current_pmi > 0:
                pmi_months += 1

            balance -= principal_payment
            total_interest += interest_payment
            total_pmi += current_pmi
            cumulative_interest += interest_payment
            cumulative_principal += principal_payment

            # Convert period to month for display
            display_month = (
                math.ceil(period * 12 / 26.0) 
                if self.inputs.get('payment_frequency') == 'biweekly' 
                else period
            )

            amortization.append({
                "month": display_month,
                "payment": interest_payment + principal_payment,
                "principal": principal_payment,
                "interest": interest_payment,
                "balance": max(0, balance),
                "pmi": current_pmi,
                "cumulative_interest": cumulative_interest,
                "cumulative_principal": cumulative_principal
            })

        self._amortization_data = {
            "amortization": amortization,
            "total_interest": total_interest,
            "total_pmi": total_pmi,
            "payoff_months": (
                math.ceil(period * 12 / 26.0) 
                if self.inputs.get('payment_frequency') == 'biweekly' 
                else period
            ),
            "pmi_months": math.ceil(
                pmi_months * (12 / 26.0 if self.inputs.get('payment_frequency') == 'biweekly' else 1)
            )
        }
        return self._amortization_data

    def _calculate_standard_loan_for_comparison(self) -> float:
        if self._standard_loan is not None:
            return self._standard_loan

        standard_balance = self.actual_loan_amount
        standard_total_interest = 0
        standard_period = 0

        while standard_balance > 0.01 and standard_period < self.number_of_payments:
            standard_period += 1
            standard_interest_payment = standard_balance * self.payment_rate
            standard_principal_payment = self.base_payment - standard_interest_payment
            standard_principal_payment = min(standard_principal_payment, standard_balance)

            standard_balance -= standard_principal_payment
            standard_total_interest += standard_interest_payment

        self._standard_loan = standard_total_interest
        return self._standard_loan

    @property
    def amortization(self) -> List[Dict]:
        return self._calculate_amortization_and_totals()["amortization"]

    @property
    def total_interest(self) -> float:
        return self._calculate_amortization_and_totals()["total_interest"]

    @property
    def total_pmi(self) -> float:
        return self._calculate_amortization_and_totals()["total_pmi"]

    @property
    def payoff_months(self) -> int:
        return self._calculate_amortization_and_totals()["payoff_months"]

    @property
    def pmi_months(self) -> int:
        return self._calculate_amortization_and_totals()["pmi_months"]

    @property
    def savings(self) -> float:
        return self._calculate_standard_loan_for_comparison() - self.total_interest

    @property
    def monthly_payment(self) -> float:
        return (
            self.base_payment * 26 / 12 
            if self.inputs.get('payment_frequency') == 'biweekly' 
            else self.base_payment
        )
