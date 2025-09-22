import React from 'react';
import { TrendingUp, Clock, DollarSign } from 'lucide-react';

interface OverpaymentScenario {
  extraPayment: number;
  monthsSaved: number;
  interestSaved: number;
  newPayoffTime: number;
}

interface OverpaymentScenariosProps {
  baseScenario: {
    totalInterest: number;
    payoffMonths: number;
  };
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  currentAge: number;
  currentBalance: number;
  monthsSincePurchase: number;
  extraPaymentStartsNow: boolean;
  currency: string;
  extraPaymentAmounts?: number[];
}

export const OverpaymentScenarios: React.FC<OverpaymentScenariosProps> = ({
  baseScenario,
  loanAmount,
  interestRate,
  loanTerm,
  currentAge,
  currentBalance,
  monthsSincePurchase,
  extraPaymentStartsNow,
  currency,
  extraPaymentAmounts = [50, 100, 200, 500]
}) => {
  const calculateScenario = (extraPayment: number): OverpaymentScenario => {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    // Always start from the beginning for scenario calculations
    let balance = loanAmount;
    let month = 0;
    let totalInterest = 0;

    while (balance > 0.01 && month < numberOfPayments + 120) {
      month++;
      const interestPayment = balance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;
      
      // Add extra payment logic:
      // - If "start from today" is checked AND we're past the purchase date: add extra payment
      // - If "start from today" is NOT checked: add extra payment from beginning
      if (extraPaymentStartsNow && month > monthsSincePurchase && monthsSincePurchase > 0) {
        principalPayment += extraPayment;
      } else if (!extraPaymentStartsNow) {
        principalPayment += extraPayment;
      }
      
      if (principalPayment > balance) {
        principalPayment = balance;
      }

      balance -= principalPayment;
      totalInterest += interestPayment;
    }

    // Calculate standard loan without extra payments for comparison (always from beginning)
    let baseBalance = loanAmount;
    let baseTotalInterest = 0;
    let baseMonth = 0;

    while (baseBalance > 0.01 && baseMonth < numberOfPayments + 120) {
      baseMonth++;
      const baseInterestPayment = baseBalance * monthlyRate;
      let basePrincipalPayment = monthlyPayment - baseInterestPayment;
      
      if (basePrincipalPayment > baseBalance) {
        basePrincipalPayment = baseBalance;
      }

      baseBalance -= basePrincipalPayment;
      baseTotalInterest += baseInterestPayment;
    }
    
    return {
      extraPayment,
      monthsSaved: baseMonth - month,
      interestSaved: baseTotalInterest - totalInterest,
      newPayoffTime: month
    };
  };

  const scenarios = extraPaymentAmounts.map(calculateScenario);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const yearsMonthsFromMonths = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths}mo`;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}mo`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-emerald-600" />
        <h3 className="text-xl font-bold text-gray-900">Extra Payment Impact</h3>
      </div>
      <p className="text-gray-600 mb-6">
        See how extra monthly payments can reduce your loan term and interest costs
        {extraPaymentStartsNow && monthsSincePurchase > 0 && (
          <span className="block text-sm text-emerald-600 font-medium mt-1">
            ✓ Calculations show extra payments starting from today
          </span>
        )}
        {!extraPaymentStartsNow && (
          <span className="block text-sm text-blue-600 font-medium mt-1">
            ℹ️ Calculations show extra payments from the beginning of the loan
          </span>
        )}
      </p>
      
      <div className="space-y-4">
        {scenarios.map((scenario, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-100 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  +{formatCurrency(scenario.extraPayment).replace('$', '$')}
                </div>
                <span className="font-semibold text-gray-900">
                  Extra {formatCurrency(scenario.extraPayment)}/month
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Time Saved</span>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {yearsMonthsFromMonths(scenario.monthsSaved)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Age {currentAge + Math.floor(scenario.newPayoffTime / 12)} at payoff
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">Interest Saved</span>
                </div>
                <div className="text-lg font-bold text-emerald-600">
                  {formatCurrency(scenario.interestSaved)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">New Payoff</span>
                </div>
                <div className="text-lg font-bold text-purple-600">
                  {yearsMonthsFromMonths(scenario.newPayoffTime)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {scenario.monthsSaved > 12 ? `${Math.floor(scenario.monthsSaved / 12)} years ` : ''}
                  {scenario.monthsSaved % 12 > 0 ? `${scenario.monthsSaved % 12} months ` : ''}earlier
                </div>
              </div>
            </div>
            
            {/* Progress Bar for Interest Savings */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Interest Savings</span>
                <span>{scenario.interestSaved > 0 ? ((scenario.interestSaved / (scenario.interestSaved + baseScenario.totalInterest)) * 100).toFixed(1) : '0'}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(scenario.interestSaved > 0 ? (scenario.interestSaved / (scenario.interestSaved + baseScenario.totalInterest)) * 100 : 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="bg-amber-500 rounded-full p-1">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">Pro Tip</h4>
            <p className="text-sm text-amber-800">
              Starting extra payments now (even small amounts) can still lead to significant savings. 
              Consider rounding up your payment or applying windfalls like tax refunds to your principal balance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};