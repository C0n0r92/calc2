import React from 'react';
import { TrendingUp, Calendar, DollarSign, Target, PieChart, Home } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { getTooltip, getTooltipTitle } from '../data/mortgageGlossary';
import { useAnimatedNumber, useAnimatedPercentage, useAnimatedCurrency } from '../hooks/useAnimatedNumber';
import { AnimatedProgressBar } from './AnimatedProgressBar';

interface PayoffTimelineProps {
  loanAmount: number;
  currentBalance: number;
  monthsSincePurchase: number;
  totalPayoffMonths: number;
  monthlyPayment: number;
  extraPayment: number;
  currentAge: number;
  currency: string;
  interestRate: number;
  // Additional loan details
  loanTerm: number;
  purchaseDate: string;
  paymentFrequency: 'monthly' | 'biweekly';
  oneTimePayment: number;
  downPayment: number;
  homeValue: number;
}

export const PayoffTimeline: React.FC<PayoffTimelineProps> = ({
  loanAmount,
  currentBalance,
  monthsSincePurchase,
  totalPayoffMonths,
  monthlyPayment,
  extraPayment,
  currentAge,
  currency,
  interestRate,
  loanTerm,
  purchaseDate,
  paymentFrequency,
  oneTimePayment,
  downPayment,
  homeValue
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const equityBuilt = loanAmount - currentBalance;
  const equityPercentage = (equityBuilt / loanAmount) * 100;
  const progressPercentage = (monthsSincePurchase / totalPayoffMonths) * 100;
  const remainingMonths = totalPayoffMonths - monthsSincePurchase;
  const ageAtPayoff = currentAge + Math.floor(remainingMonths / 12);

  // Animated values with shorter delays for faster feedback
  const animatedEquityPercentage = useAnimatedPercentage(equityPercentage, { duration: 800, delay: 100 });
  const animatedEquityBuilt = useAnimatedCurrency(equityBuilt, currency, { duration: 800, delay: 200 });
  const animatedRemainingMonths = useAnimatedNumber(remainingMonths, { duration: 600, delay: 300 });
  const animatedMonthlyPayment = useAnimatedCurrency(monthlyPayment + extraPayment, currency, { duration: 600, delay: 400 });
  const animatedProgressPercentage = useAnimatedPercentage(progressPercentage, { duration: 1000, delay: 150 });

  const yearsMonthsFromMonths = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths}mo`;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}mo`;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 hover:shadow-3xl transition-all duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-purple-800 bg-clip-text text-transparent">
              Detailed Progress & Breakdown
            </h3>
            <p className="text-gray-600 text-sm mt-1">Timeline, milestones, and monthly allocation</p>
          </div>
        </div>
      </div>

      {/* Loan Details Summary */}
      <div className="mb-8 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-blue-600" />
          Loan Details
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Home Value:</span>
            <div className="font-bold text-gray-800">{formatCurrency(homeValue)}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Down Payment:</span>
            <div className="font-bold text-gray-800">
              {formatCurrency(downPayment)} 
              <span className="text-xs text-gray-500 ml-1">
                ({((downPayment / homeValue) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Loan Term:</span>
            <div className="font-bold text-gray-800">{loanTerm} years</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Interest Rate:</span>
            <div className="font-bold text-gray-800">{interestRate}%</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Payment Frequency:</span>
            <div className="font-bold text-gray-800 capitalize">{paymentFrequency}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Purchase Date:</span>
            <div className="font-bold text-gray-800">
              {new Date(purchaseDate).toLocaleDateString()}
            </div>
          </div>
          {oneTimePayment > 0 && (
            <div>
              <span className="font-medium text-gray-600">One-time Payment:</span>
              <div className="font-bold text-gray-800">{formatCurrency(oneTimePayment)}</div>
            </div>
          )}
        </div>
      </div>


      {/* Timeline Visualization */}
      <div className="relative">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Loan Start</span>
          <span>Current Progress</span>
          <span>Payoff Complete</span>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="relative w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-4 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1500 ease-out"
            style={{ width: `${Math.max(animatedProgressPercentage.value || progressPercentage, 2)}%` }}
          />
          
          {/* Current Position Marker */}
          <div
            className="absolute top-0 h-4 w-1 bg-white border-2 border-blue-600 rounded-full transform -translate-x-0.5 transition-all duration-1500 ease-out"
            style={{ left: `${Math.max(animatedProgressPercentage.value || progressPercentage, 2)}%` }}
          />
          
          {/* Shimmer effect during animation */}
          {animatedProgressPercentage.isAnimating && (
            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          )}
        </div>

        {/* Timeline Labels */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatCurrency(loanAmount)}</span>
          <span className="font-medium text-blue-600">
            {formatCurrency(currentBalance)} remaining
          </span>
          <span>$0</span>
        </div>
      </div>

      {/* Key Milestones */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Time Elapsed</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {yearsMonthsFromMonths(monthsSincePurchase)}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {monthsSincePurchase} payments made
          </div>
        </div>
        
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-900">Principal Paid</span>
          </div>
          <div className="text-lg font-bold text-emerald-600">
            {formatCurrency(equityBuilt)}
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            {((equityBuilt / loanAmount) * 100).toFixed(1)}% of original loan
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900 flex items-center">
              Interest Paid
              <Tooltip 
                content={getTooltip('totalInterest')}
                title={getTooltipTitle('totalInterest')}
                iconClassName="w-3 h-3 text-purple-400 hover:text-purple-600 cursor-help ml-1"
                maxWidth="max-w-lg"
              />
            </span>
          </div>
          <div className="text-lg font-bold text-purple-600">
            {formatCurrency((monthlyPayment * monthsSincePurchase) - equityBuilt)}
          </div>
          <div className="text-xs text-purple-700 mt-1">
            Total interest to date
          </div>
        </div>
      </div>


      {/* Monthly Breakdown Chart */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Monthly Allocation</h4>
        <div className="space-y-2">
          {/* Calculate current month's principal vs interest */}
          {(() => {
            const monthlyRate = interestRate / 100 / 12; // Use actual interest rate
            const currentInterest = currentBalance * monthlyRate;
            const currentPrincipal = monthlyPayment - currentInterest;
            const totalPayment = monthlyPayment + extraPayment;
            
            return (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 flex items-center">
                      Interest
                      <Tooltip 
                        content={getTooltip('interest')}
                        title={getTooltipTitle('interest')}
                        iconClassName="w-3 h-3 text-gray-400 hover:text-red-500 cursor-help ml-1"
                        maxWidth="max-w-lg"
                      />
                    </span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(currentInterest)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(currentInterest / totalPayment) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 flex items-center">
                      Principal
                      <Tooltip 
                        content={getTooltip('principal')}
                        title={getTooltipTitle('principal')}
                        iconClassName="w-3 h-3 text-gray-400 hover:text-blue-500 cursor-help ml-1"
                        maxWidth="max-w-lg"
                      />
                    </span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(currentPrincipal)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(currentPrincipal / totalPayment) * 100}%` }}
                  />
                </div>

                {extraPayment > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Extra Principal</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(extraPayment)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${(extraPayment / totalPayment) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Home Equity Breakdown */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-gray-900">Home Equity Breakdown</h4>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          {/* Simple circular progress indicator */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#3b82f6"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(equityPercentage / 100) * 201.06} 201.06`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900">{equityPercentage.toFixed(0)}%</span>
            </div>
          </div>
          
          {/* Equity stats */}
          <div className="flex-1 ml-6 space-y-3">
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">Equity Built</span>
              </div>
              <div className="text-sm font-bold text-blue-600">{formatCurrency(equityBuilt)}</div>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Remaining Balance</span>
              </div>
              <div className="text-sm font-bold text-gray-600">{formatCurrency(currentBalance)}</div>
            </div>
          </div>
        </div>

        {monthsSincePurchase > 0 && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">
                Building {formatCurrency(equityBuilt / monthsSincePurchase)}/month in equity
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};