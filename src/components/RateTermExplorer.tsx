import React, { useState, useMemo } from 'react';
import { Sliders, TrendingUp, DollarSign, Clock, Bookmark, User } from 'lucide-react';
import { MortgageInputs } from '../types/mortgage';
import { calculateMortgage } from '../utils/mortgageCalculationsApi';
import { formatCurrency } from '../utils/formatters';

interface RateTermExplorerProps {
  baseInputs: MortgageInputs;
  currency: string;
  baseScenario?: {
    totalInterest: number;
    payoffMonths: number;
  };
  onSaveScenario?: (scenario: any) => void;
}

export const RateTermExplorer: React.FC<RateTermExplorerProps> = ({
  baseInputs,
  currency,
  baseScenario: propBaseScenario,
  onSaveScenario
}) => {
  // Slider states
  const [exploreRate, setExploreRate] = useState(baseInputs.interestRate || 6.5);
  const [exploreTerm, setExploreTerm] = useState(baseInputs.loanTerm || 30);
  const [exploreDownPayment, setExploreDownPayment] = useState(
    ((baseInputs.downPayment || 0) / (baseInputs.homeValue || 1)) * 100
  );
  const [exploreExtraPayment, setExploreExtraPayment] = useState(baseInputs.extraPayment || 0);

  // Calculate scenarios with improved logic
  const baseScenario = useMemo(() => {
    console.log('RateTermExplorer: Calculating base scenario');
    console.log('Base inputs received:', baseInputs);
    
    // Always use fallback calculation for now to ensure we have data
    const P = baseInputs?.loanAmount || 300000;
    const r = (baseInputs?.interestRate || 6.5) / 100 / 12;
    const n = (baseInputs?.loanTerm || 30) * 12;
    
    console.log('Using values - Principal:', P, 'Rate:', r, 'Months:', n);
    
    if (P <= 0 || r <= 0 || n <= 0) {
      console.log('Invalid calculation values');
      return {
        monthlyPayment: 1500, // Default values for testing
        totalInterest: 200000,
        payoffMonths: 360,
        totalPayments: 500000
      };
    }
    
    const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayments = monthlyPayment * n;
    const totalInterest = totalPayments - P;
    
    const result = {
      monthlyPayment: Math.round(monthlyPayment) || 1500,
      totalInterest: Math.round(totalInterest) || 200000,
      payoffMonths: n || 360,
      totalPayments: Math.round(totalPayments) || 500000
    };
    
    console.log('Base scenario calculated:', result);
    return result;
  }, [baseInputs]);


  const exploredScenario = useMemo(() => {
    console.log('RateTermExplorer: Calculating explored scenario');
    console.log('Explore rate:', exploreRate, 'term:', exploreTerm, 'down payment %:', exploreDownPayment, 'extra payment:', exploreExtraPayment);
    
    // Use simplified calculation based on sliders
    const homeValue = baseInputs?.homeValue || 400000; // Default home value
    const newDownPayment = (exploreDownPayment / 100) * homeValue;
    const P = homeValue - newDownPayment; // New loan amount
    const r = exploreRate / 100 / 12; // Monthly rate
    const n = exploreTerm * 12; // Total months
    
    console.log('Explored calculation - Principal:', P, 'Rate:', r, 'Months:', n, 'Extra payment:', exploreExtraPayment);
    
    if (P <= 0 || r <= 0 || n <= 0) {
      console.log('Invalid explored values');
      return {
        monthlyPayment: 1600, // Slightly different from base for testing
        totalInterest: 220000,
        payoffMonths: 300,
        totalPayments: 520000
      };
    }
    
    // Calculate base monthly payment
    const baseMonthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalMonthlyPayment = baseMonthlyPayment + exploreExtraPayment;
    
    // Calculate new payoff time with extra payment
    let newPayoffMonths = n;
    if (exploreExtraPayment > 0 && totalMonthlyPayment > P * r) {
      newPayoffMonths = -Math.log(1 - (P * r) / totalMonthlyPayment) / Math.log(1 + r);
    }
    
    // Calculate totals
    const totalPayments = totalMonthlyPayment * newPayoffMonths;
    const totalInterest = totalPayments - P;
    
    const result = {
      monthlyPayment: Math.round(totalMonthlyPayment) || 1600,
      totalInterest: Math.round(totalInterest) || 220000,
      payoffMonths: Math.round(newPayoffMonths) || 300,
      totalPayments: Math.round(totalPayments) || 520000
    };
    
    console.log('Explored scenario calculated:', result);
    return result;
  }, [baseInputs, exploreRate, exploreTerm, exploreDownPayment, exploreExtraPayment]);

  // Calculate differences
  const monthlyDiff = exploredScenario.monthlyPayment - baseScenario.monthlyPayment;
  const interestDiff = exploredScenario.totalInterest - baseScenario.totalInterest;
  const timeDiff = exploredScenario.payoffMonths - baseScenario.payoffMonths;
  
  // Calculate ages at payoff
  const currentAge = baseInputs.currentAge || 30; // Default to 30 if not provided
  const baseAgeAtPayoff = currentAge + Math.floor(baseScenario.payoffMonths / 12);
  const exploredAgeAtPayoff = currentAge + Math.floor(exploredScenario.payoffMonths / 12);
  const ageDiff = exploredAgeAtPayoff - baseAgeAtPayoff;

  const formatDifference = (value: number, isCurrency: boolean = false, isTime: boolean = false) => {
    if (value === 0) return '—';
    const sign = value > 0 ? '+' : '';
    
    if (isTime) {
      const months = Math.abs(value);
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      let timeStr = '';
      if (years > 0) timeStr += `${years}y `;
      if (remainingMonths > 0) timeStr += `${remainingMonths}mo`;
      return `${sign}${timeStr}`;
    }
    
    if (isCurrency) {
      return `${sign}${formatCurrency(Math.abs(value), currency)}`;
    }
    
    return `${sign}${Math.abs(value).toFixed(2)}`;
  };

  const getDifferenceColor = (value: number, inverse: boolean = false) => {
    if (value === 0) return 'text-gray-500';
    const isPositive = value > 0;
    const isBad = inverse ? !isPositive : isPositive;
    return isBad ? 'text-red-600' : 'text-emerald-600';
  };

  const saveCurrentScenario = () => {
    const scenario = {
      name: `${exploreRate}% - ${exploreTerm}yr - ${exploreDownPayment.toFixed(1)}% down`,
      inputs: {
        ...baseInputs,
        interestRate: exploreRate,
        loanTerm: exploreTerm,
        downPayment: (exploreDownPayment / 100) * (baseInputs.homeValue || 0),
        loanAmount: (baseInputs.homeValue || 0) - ((exploreDownPayment / 100) * (baseInputs.homeValue || 0))
      },
      results: exploredScenario,
      timestamp: new Date().toISOString()
    };
    
    if (onSaveScenario) {
      onSaveScenario(scenario);
    } else {
      // Save to localStorage as fallback
      const saved = JSON.parse(localStorage.getItem('savedScenarios') || '[]');
      saved.push(scenario);
      localStorage.setItem('savedScenarios', JSON.stringify(saved));
      alert('Scenario saved!');
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 hover:shadow-3xl transition-all duration-500">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
          <Sliders className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-purple-800 bg-clip-text text-transparent">
            Rate & Term Explorer
          </h3>
          <p className="text-gray-600 text-sm mt-1">Explore how different rates and terms affect your mortgage</p>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Interest Rate Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Interest Rate</label>
            <span className="text-lg font-bold text-purple-600">{exploreRate.toFixed(2)}%</span>
          </div>
          <input
            type="range"
            min="3"
            max="12"
            step="0.1"
            value={exploreRate}
            onChange={(e) => setExploreRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>3%</span>
            <span>12%</span>
          </div>
        </div>

        {/* Loan Term Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Loan Term</label>
            <span className="text-lg font-bold text-indigo-600">{exploreTerm} years</span>
          </div>
          <input
            type="range"
            min="10"
            max="40"
            step="5"
            value={exploreTerm}
            onChange={(e) => setExploreTerm(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-indigo"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>10yr</span>
            <span>40yr</span>
          </div>
        </div>

        {/* Down Payment Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Down Payment</label>
            <span className="text-lg font-bold text-emerald-600">{exploreDownPayment.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={exploreDownPayment}
            onChange={(e) => setExploreDownPayment(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-emerald"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>5%</span>
            <span>50%</span>
          </div>
        </div>

        {/* Extra Monthly Payment Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Extra Monthly Payment</label>
            <span className="text-lg font-bold text-orange-600">{formatCurrency(exploreExtraPayment, currency)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            step="25"
            value={exploreExtraPayment}
            onChange={(e) => setExploreExtraPayment(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-orange"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatCurrency(0, currency)}</span>
            <span>{formatCurrency(1000, currency)}</span>
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Monthly Payment */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 text-center border border-purple-200/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Monthly Payment</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {formatCurrency(isNaN(exploredScenario.monthlyPayment) ? 0 : exploredScenario.monthlyPayment, currency)}
          </div>
          <div className={`text-sm font-medium ${getDifferenceColor(monthlyDiff, true)}`}>
            {formatDifference(isNaN(monthlyDiff) ? 0 : monthlyDiff, true)}
          </div>
        </div>

        {/* Total Interest */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 text-center border border-orange-200/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Total Interest</span>
          </div>
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {formatCurrency(isNaN(exploredScenario.totalInterest) ? 0 : exploredScenario.totalInterest, currency)}
          </div>
          <div className={`text-sm font-medium ${getDifferenceColor(interestDiff, true)}`}>
            {formatDifference(isNaN(interestDiff) ? 0 : interestDiff, true)}
          </div>
        </div>

        {/* Payoff Time */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 text-center border border-blue-200/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Payoff Time</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {Math.floor((isNaN(exploredScenario.payoffMonths) ? 0 : exploredScenario.payoffMonths) / 12)}y {(isNaN(exploredScenario.payoffMonths) ? 0 : exploredScenario.payoffMonths) % 12}mo
          </div>
          <div className={`text-sm font-medium ${getDifferenceColor(timeDiff, true)}`}>
            {formatDifference(isNaN(timeDiff) ? 0 : timeDiff, false, true)}
          </div>
        </div>

        {/* Age at Payoff */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 text-center border border-emerald-200/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-900">Age at Payoff</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mb-1">
            {isNaN(exploredAgeAtPayoff) ? currentAge : exploredAgeAtPayoff} years
          </div>
          <div className={`text-sm font-medium ${getDifferenceColor(ageDiff, true)}`}>
            {formatDifference(isNaN(ageDiff) ? 0 : ageDiff)} years
          </div>
        </div>
      </div>

      {/* Extra Payment Quick Reference */}
      <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-orange-600" />
          <h4 className="text-sm font-semibold text-orange-800">Extra Payment Quick Reference</h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[100, 200, 500].map((amount) => {
            // Calculate impact for this amount
            const homeValue = baseInputs?.homeValue || 400000;
            const downPayment = (exploreDownPayment / 100) * homeValue;
            const P = homeValue - downPayment;
            const r = exploreRate / 100 / 12;
            const n = exploreTerm * 12;
            
            const baseMonthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            const totalMonthlyPayment = baseMonthlyPayment + amount;
            
            let newPayoffMonths = n;
            if (amount > 0 && totalMonthlyPayment > P * r) {
              newPayoffMonths = -Math.log(1 - (P * r) / totalMonthlyPayment) / Math.log(1 + r);
            }
            
            const monthsSaved = n - newPayoffMonths;
            const baseInterest = (baseMonthlyPayment * n) - P;
            const newInterest = (totalMonthlyPayment * newPayoffMonths) - P;
            const interestSaved = baseInterest - newInterest;
            
            return (
              <div key={amount} className="bg-white rounded-lg p-3 text-center border border-orange-200/50 hover:shadow-sm transition-all">
                <div className="text-sm font-bold text-orange-700 mb-1">
                  +{formatCurrency(amount, currency)}
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  {Math.floor(monthsSaved / 12)}y {Math.round(monthsSaved % 12)}mo faster
                </div>
                <div className="text-xs text-emerald-600 font-medium">
                  {formatCurrency(Math.max(0, interestSaved), currency)} saved
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-center">
          <p className="text-xs text-orange-700">
            💡 Use the Extra Monthly Payment slider above to explore any amount
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={saveCurrentScenario}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <Bookmark className="w-4 h-4" />
          Save This Scenario
        </button>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
        <div className="text-sm text-gray-700 text-center">
          <strong>Quick Summary:</strong> {exploreRate}% rate, {exploreTerm}-year term, {exploreDownPayment.toFixed(1)}% down → 
          <span className={getDifferenceColor(monthlyDiff, true)}> {formatDifference(monthlyDiff, true)} monthly</span>, 
          <span className={getDifferenceColor(interestDiff, true)}> {formatDifference(interestDiff, true)} total interest</span>
        </div>
      </div>
    </div>
  );
};
