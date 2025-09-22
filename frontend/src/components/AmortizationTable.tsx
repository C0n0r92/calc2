import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, Table } from 'lucide-react';
import { AmortizationEntry } from '../types/mortgage';
import { formatCurrency } from '../utils/formatters';

interface AmortizationTableProps {
  amortization: AmortizationEntry[];
  currency: string;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  amortization,
  currency
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showYearly, setShowYearly] = useState(true);

  const exportToCSV = () => {
    const headers = ['Month', 'Payment', 'Principal', 'Interest', 'Balance', 'PMI', 'Cumulative Interest', 'Cumulative Principal'];
    const csvContent = [
      headers.join(','),
      ...amortization.map(entry => [
        entry.month,
        entry.payment.toFixed(2),
        entry.principal.toFixed(2),
        entry.interest.toFixed(2),
        entry.balance.toFixed(2),
        (entry.pmi || 0).toFixed(2),
        entry.cumulativeInterest.toFixed(2),
        entry.cumulativePrincipal.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amortization-schedule.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Group by year for yearly view
  const yearlyData = amortization.reduce((acc, entry) => {
    const year = Math.ceil(entry.month / 12);
    if (!acc[year]) {
      acc[year] = {
        year,
        totalPayment: 0,
        totalPrincipal: 0,
        totalInterest: 0,
        totalPMI: 0,
        endingBalance: 0,
        months: []
      };
    }
    acc[year].totalPayment += entry.payment;
    acc[year].totalPrincipal += entry.principal;
    acc[year].totalInterest += entry.interest;
    acc[year].totalPMI += entry.pmi || 0;
    acc[year].endingBalance = entry.balance;
    acc[year].months.push(entry);
    return acc;
  }, {} as Record<number, any>);

  const displayData = showYearly ? Object.values(yearlyData) : amortization.slice(0, isExpanded ? undefined : 12);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Table className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Amortization Schedule</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowYearly(false)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                !showYearly ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setShowYearly(true)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                showYearly ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Yearly
            </button>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-700">
                {showYearly ? 'Year' : 'Month'}
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Payment</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Principal</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Interest</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">PMI</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Balance</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((entry: any, index: number) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">
                  {showYearly ? entry.year : entry.month}
                </td>
                <td className="py-3 px-2 text-right">
                  {formatCurrency(showYearly ? entry.totalPayment : entry.payment, currency as any)}
                </td>
                <td className="py-3 px-2 text-right text-blue-600">
                  {formatCurrency(showYearly ? entry.totalPrincipal : entry.principal, currency as any)}
                </td>
                <td className="py-3 px-2 text-right text-red-600">
                  {formatCurrency(showYearly ? entry.totalInterest : entry.interest, currency as any)}
                </td>
                <td className="py-3 px-2 text-right text-orange-600">
                  {formatCurrency(showYearly ? entry.totalPMI : (entry.pmi || 0), currency as any)}
                </td>
                <td className="py-3 px-2 text-right font-medium">
                  {formatCurrency(showYearly ? entry.endingBalance : entry.balance, currency as any)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!showYearly && amortization.length > 12 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 mx-auto px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All {amortization.length} Payments
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};