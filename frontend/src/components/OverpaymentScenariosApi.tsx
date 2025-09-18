import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

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
  // Add the full inputs for API call
  fullInputs: any;
  // Make extra payment amounts configurable
  extraPaymentAmounts?: number[];
}

export const OverpaymentScenariosApi: React.FC<OverpaymentScenariosProps> = ({
  baseScenario,
  currentAge,
  currency,
  fullInputs,
  extraPaymentAmounts = [50, 100, 200, 500]
}) => {
  const [scenarios, setScenarios] = useState<OverpaymentScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiScenarios = await apiService.calculateScenarioComparison(
          fullInputs,
          extraPaymentAmounts
        );
        
        setScenarios(apiScenarios);
      } catch (err) {
        console.error('Failed to fetch scenario comparison:', err);
        setError('Failed to load scenario comparison. Please try again.');
        
        // Fallback to local calculation
        const { calculateMortgageLocal } = await import('../utils/mortgageCalculations');
        const fallbackScenarios = extraPaymentAmounts.map(extraPayment => {
          const scenarioInputs = { ...fullInputs, extraPayment };
          const baseInputs = { ...fullInputs, extraPayment: 0 };
          
          const scenarioResult = calculateMortgageLocal(scenarioInputs);
          const baseResult = calculateMortgageLocal(baseInputs);
          
          return {
            extraPayment,
            monthsSaved: baseResult.payoffMonths - scenarioResult.payoffMonths,
            interestSaved: baseResult.totalInterest - scenarioResult.totalInterest,
            newPayoffTime: scenarioResult.payoffMonths
          };
        });
        setScenarios(fallbackScenarios);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, [fullInputs, baseScenario]);

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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-gray-900">Extra Payment Impact</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading scenarios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 hover:shadow-3xl transition-all duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-emerald-800 bg-clip-text text-transparent">
              Extra Payment Impact
            </h3>
            <p className="text-gray-600 text-sm mt-1">See how extra payments accelerate your payoff</p>
          </div>
          <span className="text-xs bg-gradient-to-r from-blue-100 to-emerald-100 text-emerald-700 font-semibold px-4 py-2 rounded-full border border-emerald-200 shadow-sm">
            Real-time Analysis
          </span>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-800">{error}</span>
        </div>
      )}
      
      <p className="text-gray-600 mb-6">
        See how extra monthly payments can reduce your loan term and interest costs
        {fullInputs.extraPaymentStartsNow && fullInputs.monthsSincePurchase > 0 && (
          <span className="block text-sm text-emerald-600 font-medium mt-1">
            ✓ Calculations show extra payments starting from today
          </span>
        )}
        {!fullInputs.extraPaymentStartsNow && (
          <span className="block text-sm text-blue-600 font-medium mt-1">
            ℹ️ Calculations show extra payments from the beginning of the loan
          </span>
        )}
      </p>
      
      <div className="space-y-4">
        {scenarios.map((scenario, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-white to-emerald-50/50 rounded-2xl p-6 border-2 border-emerald-100/50 hover:border-emerald-200 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl w-12 h-12 flex items-center justify-center text-sm font-bold shadow-lg group-hover:shadow-xl transition-all duration-300">
                  +{formatCurrency(scenario.extraPayment).replace(/[$€£]/, '')}
                </div>
                <div>
                  <span className="font-bold text-gray-900 text-lg">
                    Extra {formatCurrency(scenario.extraPayment)}/month
                  </span>
                  <div className="text-xs text-gray-500 font-medium">Additional payment</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 text-center border border-blue-200/30 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Time Saved</span>
                </div>
                <div className="text-xl font-black text-blue-600 mb-1">
                  {yearsMonthsFromMonths(scenario.monthsSaved)}
                </div>
                <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                  Age {currentAge + Math.floor(scenario.newPayoffTime / 12)} at payoff
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 text-center border border-emerald-200/30 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">Interest Saved</span>
                </div>
                <div className="text-xl font-black text-emerald-600 mb-1">
                  {formatCurrency(scenario.interestSaved)}
                </div>
                <div className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded-full">
                  {((scenario.interestSaved / baseScenario.totalInterest) * 100).toFixed(1)}% savings
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 text-center border border-purple-200/30 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">New Payoff</span>
                </div>
                <div className="text-xl font-black text-purple-600 mb-1">
                  {yearsMonthsFromMonths(scenario.newPayoffTime)}
                </div>
                <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
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
