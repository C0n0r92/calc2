import React from 'react';
import { PieChart, TrendingUp, Home } from 'lucide-react';

interface EquityChartProps {
  loanAmount: number;
  currentBalance: number;
  monthsSincePurchase: number;
  currency: string;
}

export const EquityChart: React.FC<EquityChartProps> = ({
  loanAmount,
  currentBalance,
  monthsSincePurchase,
  currency
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
  const remainingPercentage = 100 - equityPercentage;

  // Calculate the circumference for the circle
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (equityPercentage / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <PieChart className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900">Home Equity Breakdown</h3>
      </div>

      <div className="flex items-center justify-center mb-6">
        {/* Circular Progress Chart */}
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {equityPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Equity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend and Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-900">Equity Built</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-blue-600">{formatCurrency(equityBuilt)}</div>
            <div className="text-xs text-blue-700">{equityPercentage.toFixed(1)}%</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
            <span className="font-medium text-gray-700">Remaining Balance</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-600">{formatCurrency(currentBalance)}</div>
            <div className="text-xs text-gray-500">{remainingPercentage.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Equity Growth Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Home className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Original Loan</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(loanAmount)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Monthly Equity</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {monthsSincePurchase > 0 
                ? formatCurrency(equityBuilt / monthsSincePurchase)
                : formatCurrency(0)
              }
            </div>
          </div>
        </div>
      </div>

      {monthsSincePurchase > 0 && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-500 rounded-full p-1">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900 mb-1">Equity Progress</h4>
              <p className="text-sm text-emerald-800">
                You've built {formatCurrency(equityBuilt)} in equity over {Math.floor(monthsSincePurchase / 12)} years 
                and {monthsSincePurchase % 12} months. That's an average of {formatCurrency(equityBuilt / monthsSincePurchase)} 
                per month in wealth building!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};