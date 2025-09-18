import React from 'react';
import { BarChart3, TrendingUp, X } from 'lucide-react';
import { MortgageScenario } from '../types/mortgage';
import { formatCurrency, yearsMonthsFromMonths } from '../utils/formatters';

interface ScenarioComparisonProps {
  scenarios: MortgageScenario[];
  onRemoveScenario: (id: string) => void;
  currency: string;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  scenarios,
  onRemoveScenario,
  currency
}) => {
  if (scenarios.length === 0) return null;

  const maxInterest = Math.max(...scenarios.map(s => s.results.totalInterest));

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-900">Scenario Comparison</h3>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario, index) => (
          <div key={scenario.id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-blue-500' : 
                  index === 1 ? 'bg-emerald-500' : 
                  index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                }`} />
                {scenario.name}
              </h4>
              <button
                onClick={() => onRemoveScenario(scenario.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-3">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Monthly Payment</div>
                <div className="font-bold text-gray-900">
                  {formatCurrency(scenario.results.monthlyPayment + scenario.inputs.extraPayment, currency as any)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Total Interest</div>
                <div className="font-bold text-red-600">
                  {formatCurrency(scenario.results.totalInterest, currency as any)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Payoff Time</div>
                <div className="font-bold text-blue-600">
                  {yearsMonthsFromMonths(scenario.results.payoffMonths)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Interest Saved</div>
                <div className="font-bold text-emerald-600">
                  {formatCurrency(scenario.results.savings, currency as any)}
                </div>
              </div>
            </div>

            {/* Interest comparison bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  index === 0 ? 'bg-blue-500' : 
                  index === 1 ? 'bg-emerald-500' : 
                  index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                }`}
                style={{ width: `${(scenario.results.totalInterest / maxInterest) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {scenarios.length > 1 && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="bg-purple-500 rounded-full p-1">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900 mb-1">Best Option</h4>
              <p className="text-sm text-purple-800">
                {(() => {
                  const bestScenario = scenarios.reduce((best, current) => 
                    current.results.totalInterest < best.results.totalInterest ? current : best
                  );
                  return `"${bestScenario.name}" saves the most interest with ${formatCurrency(bestScenario.results.savings, currency as any)} in total savings.`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};