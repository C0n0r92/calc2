import { useState, useEffect } from 'react';
import { Calculator, Home, Save, AlertCircle, Wifi, WifiOff, TrendingUp } from 'lucide-react';
import { MortgageInputs, MortgageScenario, CURRENCIES } from './types/mortgage';
import { calculateMortgage } from './utils/mortgageCalculationsApi';
import { validateInput, formatCurrency } from './utils/formatters';
import { NumberInput } from './components/NumberInput';
import { PayoffTimeline } from './components/PayoffTimeline';
import { OverpaymentScenariosApi } from './components/OverpaymentScenariosApi';
import { AmortizationTable } from './components/AmortizationTable';
import { ScenarioComparison } from './components/ScenarioComparison';
import { CondensedExtraPaymentImpact } from './components/CondensedExtraPaymentImpact';
import { RateTermExplorer } from './components/RateTermExplorer';
import { LabelWithTooltip } from './components/Tooltip';
import { getTooltip, getTooltipTitle } from './data/mortgageGlossary';
import { apiService } from './services/api';

function App() {
  // Load saved inputs from localStorage
  const loadSavedInputs = () => {
    try {
      const saved = localStorage.getItem('mortgageCalculatorInputs');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading saved inputs:', error);
    }
    return {
      loanAmount: 300000,
      interestRate: 6.5,
      loanTerm: 30,
      extraPayment: 0,
      currentAge: 35,
      purchaseDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago as default
      extraPaymentStartsNow: true,
      paymentFrequency: 'monthly',
      oneTimePayment: 0,
      oneTimePaymentDate: new Date().toISOString().split('T')[0],
      downPayment: 60000,
      homeValue: 360000,
      currency: 'USD',
      pmiRate: 0.5
    };
  };

  const [inputs, setInputs] = useState<MortgageInputs>(loadSavedInputs());

  const [calculatedInputs, setCalculatedInputs] = useState<MortgageInputs>(inputs);
  const [scenarios, setScenarios] = useState<MortgageScenario[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiConnected, setApiConnected] = useState(true);
  const [calculations, setCalculations] = useState<any>(null);
  const [hasInitialCalculation, setHasInitialCalculation] = useState(false);

  // Test API connection on mount and trigger initial calculation
  useEffect(() => {
    const testConnection = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        await fetch(`${apiUrl}/up`);
        setApiConnected(true);
      } catch {
        setApiConnected(false);
      }
    };
    testConnection();
    
    // Trigger initial calculation
    if (!hasInitialCalculation) {
      setHasInitialCalculation(true);
      setCalculatedInputs({...inputs}); // Force trigger by creating new object
    }
  }, []);

  // Calculate mortgage when calculatedInputs change
  useEffect(() => {
    const performCalculation = async () => {
      if (!calculatedInputs) return;
      
      try {
        setIsCalculating(true);
        const result = await calculateMortgage(calculatedInputs);
        setCalculations(result);
      } catch (error) {
        console.error('Calculation error:', error);
        // Could show error notification here
      } finally {
        setIsCalculating(false);
      }
    };

    performCalculation();
  }, [calculatedInputs]);

  // Extract values from calculations
  const { monthsSincePurchase = 0, currentBalance = 0 } = calculations || {};
  

  const updateInput = (field: keyof MortgageInputs, value: number | string) => {
    const newInputs = { ...inputs, [field]: value };
    setInputs(newInputs);
    
    // Auto-save to localStorage
    try {
      localStorage.setItem('mortgageCalculatorInputs', JSON.stringify(newInputs));
    } catch (error) {
      console.error('Error saving inputs:', error);
    }
    
    // Validate input
    if (typeof value === 'number') {
      const error = validateInput(field as string, value);
      setErrors(prev => ({
        ...prev,
        [field]: error || ''
      }));
    }
    
    // Auto-calculate loan amount from home value and down payment
    if (field === 'homeValue' || field === 'downPayment') {
      const homeValue = field === 'homeValue' ? value as number : newInputs.homeValue;
      const downPayment = field === 'downPayment' ? value as number : newInputs.downPayment;
      const loanAmount = homeValue - downPayment;
      if (loanAmount > 0) {
        setInputs(prev => ({ ...prev, loanAmount }));
      }
    }
  };

  const handleCalculate = async () => {
    // Validate all inputs before calculating
    const newErrors: Record<string, string> = {};
    Object.entries(inputs).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const error = validateInput(key, value);
        if (error) newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).some(key => newErrors[key])) {
      return; // Don't calculate if there are errors
    }
    
    setCalculatedInputs(inputs);
  };

  const saveScenario = async () => {
    if (!apiService.isAuthenticated()) {
      // For now, just save locally
      const scenarioName = `Scenario ${scenarios.length + 1}`;
      const newScenario: MortgageScenario = {
        id: Date.now().toString(),
        name: scenarioName,
        inputs: calculatedInputs,
        results: calculations
      };
      setScenarios(prev => [...prev, newScenario]);
      return;
    }

    try {
      const scenarioName = `Scenario ${scenarios.length + 1}`;
      await apiService.saveScenario(scenarioName, calculatedInputs);
      // Refresh scenarios list
      const response = await apiService.getScenarios();
      if (response.scenarios && Array.isArray(response.scenarios)) {
        setScenarios(Array.isArray(response.scenarios) ? response.scenarios : []);
      }
    } catch (error) {
      console.error('Failed to save scenario:', error);
      // Fallback to local save
      const scenarioName = `Scenario ${scenarios.length + 1}`;
      const newScenario: MortgageScenario = {
        id: Date.now().toString(),
        name: scenarioName,
        inputs: calculatedInputs,
        results: calculations
      };
      setScenarios(prev => [...prev, newScenario]);
    }
  };

  const removeScenario = async (id: string) => {
    if (apiService.isAuthenticated()) {
      try {
        await apiService.deleteScenario(id);
      } catch (error) {
        console.error('Failed to delete scenario:', error);
      }
    }
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  const hasErrors = Object.values(errors).some(error => error);

  if (!calculations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto mb-6"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-700 font-medium text-lg">Initializing calculator...</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100 scroll-smooth">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.03\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-6 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/10">
                <Calculator className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
              <div className="text-left">
                <h1 className="text-6xl font-black bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent leading-tight">
                  Mortgage Payoff
                </h1>
                <h1 className="text-6xl font-black bg-gradient-to-r from-emerald-200 via-blue-200 to-white bg-clip-text text-transparent leading-tight">
                  Calculator
                </h1>
              </div>
            </div>
            
            <p className="text-2xl mb-8 max-w-4xl mx-auto text-blue-100 leading-relaxed">
              Calculate how <strong className="text-emerald-300">extra payments</strong> can save you{" "}
              <strong className="text-yellow-300">thousands in interest</strong> and{" "}
              <strong className="text-green-300">years off your mortgage</strong>.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-3 h-3 bg-emerald-400 rounded-full mx-auto mb-2"></div>
                <span className="text-sm font-medium">Extra Payment Impact</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-2"></div>
                <span className="text-sm font-medium">Amortization Schedule</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mx-auto mb-2"></div>
                <span className="text-sm font-medium">Interest Savings</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="w-3 h-3 bg-purple-400 rounded-full mx-auto mb-2"></div>
                <span className="text-sm font-medium">Progress Timeline</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              {apiConnected ? (
                <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-emerald-400/30">
                  <Wifi className="w-4 h-4 text-emerald-300" />
                  <span className="text-emerald-100">Real-time Calculations</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-amber-400/30">
                  <WifiOff className="w-4 h-4 text-amber-300" />
                  <span className="text-amber-100">Offline Mode</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(248 250 252)"/>
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Content Header */}
        <div className="text-center mb-8">
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Calculate your mortgage payments and discover how extra payments can save you thousands in interest
          </p>
        </div>

        <div className="grid xl:grid-cols-5 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="xl:col-span-2 lg:col-span-1 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 hover:shadow-3xl transition-all duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-3 flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  Loan Details
                </h2>
                <p className="text-gray-600 text-sm">Enter your mortgage information to get started</p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={inputs.currency}
                    onChange={(e) => updateInput('currency', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {Object.entries(CURRENCIES).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.symbol} {info.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <LabelWithTooltip 
                    label="Home Value"
                    tooltip={getTooltip('homeValue')}
                    title={getTooltipTitle('homeValue')}
                  />
                  <NumberInput
                    value={inputs.homeValue}
                    onChange={(value) => updateInput('homeValue', value)}
                    prefix={CURRENCIES[inputs.currency].symbol}
                    placeholder="360,000"
                    className={errors.homeValue ? 'border-red-300' : ''}
                  />
                  {errors.homeValue && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.homeValue}
                    </p>
                  )}
                </div>

                <div>
                  <LabelWithTooltip 
                    label="Down Payment"
                    tooltip={getTooltip('downPayment')}
                    title={getTooltipTitle('downPayment')}
                  />
                  <NumberInput
                    value={inputs.downPayment}
                    onChange={(value) => updateInput('downPayment', value)}
                    prefix={CURRENCIES[inputs.currency].symbol}
                    placeholder="60,000"
                    className={errors.downPayment ? 'border-red-300' : ''}
                  />
                  {errors.downPayment && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.downPayment}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {inputs.homeValue > 0 && inputs.downPayment > 0 && (
                      <>Down payment: {((inputs.downPayment / inputs.homeValue) * 100).toFixed(1)}%</>
                    )}
                  </p>
                </div>

                <div>
                  <LabelWithTooltip 
                    label="Loan Amount"
                    tooltip={getTooltip('loanAmount')}
                    title={getTooltipTitle('loanAmount')}
                  />
                  <NumberInput
                    value={inputs.loanAmount}
                    onChange={(value) => updateInput('loanAmount', value)}
                    prefix={CURRENCIES[inputs.currency].symbol}
                    placeholder="300,000"
                    className={errors.loanAmount ? 'border-red-300' : ''}
                  />
                  {errors.loanAmount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.loanAmount}
                    </p>
                  )}
                </div>

                <div>
                  <LabelWithTooltip 
                    label="Interest Rate (%)"
                    tooltip={getTooltip('interestRate')}
                    title={getTooltipTitle('interestRate')}
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.interestRate}
                    onChange={(e) => updateInput('interestRate', Number(e.target.value))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.interestRate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="6.5"
                  />
                  {errors.interestRate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.interestRate}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={inputs.purchaseDate}
                    onChange={(e) => updateInput('purchaseDate', e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Current Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={inputs.currentAge}
                    onChange={(e) => updateInput('currentAge', Number(e.target.value))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.currentAge ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="35"
                  />
                  {errors.currentAge && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.currentAge}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Term (Years)
                  </label>
                  <select
                    value={inputs.loanTerm}
                    onChange={(e) => updateInput('loanTerm', Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={25}>25 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Frequency
                  </label>
                  <select
                    value={inputs.paymentFrequency}
                    onChange={(e) => updateInput('paymentFrequency', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Bi-weekly</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Bi-weekly payments can save significant interest over time
                  </p>
                </div>

                <div>
                  <LabelWithTooltip 
                    label="Extra Monthly Payment"
                    tooltip={getTooltip('extraPayment')}
                    title={getTooltipTitle('extraPayment')}
                  />
                  <NumberInput
                    value={inputs.extraPayment}
                    onChange={(value) => updateInput('extraPayment', value)}
                    prefix={CURRENCIES[inputs.currency].symbol}
                    placeholder="0"
                    className="focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {inputs.extraPayment > 0 && (
                    <div className="mt-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inputs.extraPaymentStartsNow}
                          onChange={(e) => setInputs(prev => ({ ...prev, extraPaymentStartsNow: e.target.checked }))}
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-700">
                          Start extra payments from today
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-7">
                        {inputs.extraPaymentStartsNow 
                          ? "Extra payments begin from current date forward"
                          : "Extra payments applied from the beginning of the loan"
                        }
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <LabelWithTooltip 
                    label="One-Time Extra Payment"
                    tooltip={getTooltip('oneTimePayment')}
                    title={getTooltipTitle('oneTimePayment')}
                  />
                  <NumberInput
                    value={inputs.oneTimePayment}
                    onChange={(value) => updateInput('oneTimePayment', value)}
                    prefix={CURRENCIES[inputs.currency].symbol}
                    placeholder="0"
                    className="focus:ring-purple-500 focus:border-purple-500"
                  />
                  {inputs.oneTimePayment > 0 && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={inputs.oneTimePaymentDate}
                        onChange={(e) => updateInput('oneTimePaymentDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleCalculate}
                  disabled={hasErrors || isCalculating}
                  className={`w-full font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-lg ${
                    hasErrors || isCalculating
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white hover:shadow-blue-500/25'
                  } ${isCalculating ? 'animate-pulse' : ''}`}
                >
                  {isCalculating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Calculating...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5" />
                      <span>Calculate Mortgage</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={saveScenario}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save as Scenario
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="xl:col-span-3 lg:col-span-2 space-y-8">
            {/* Loan Progress Overview - Just the key metrics */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 hover:shadow-3xl transition-all duration-500">
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-purple-800 bg-clip-text text-transparent">
                      Loan Progress Overview
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">Your current mortgage status</p>
                  </div>
                </div>
              </div>

              {/* Progress Overview - Key metrics only */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 text-center border border-blue-200/50 hover:shadow-lg transition-all duration-300">
                  <div className="text-3xl font-black text-blue-600 mb-2">
                    {((((calculatedInputs.loanAmount - currentBalance) / calculatedInputs.loanAmount) * 100) || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm font-semibold text-blue-700 mb-1">Equity Built</div>
                  <div className="text-xs text-blue-600 font-medium bg-blue-100 px-3 py-1 rounded-full">
                    {formatCurrency(calculatedInputs.loanAmount - currentBalance, calculatedInputs.currency)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 text-center border border-emerald-200/50 hover:shadow-lg transition-all duration-300">
                  <div className="text-3xl font-black text-emerald-600 mb-2">
                    {Math.floor((calculations.payoffMonths - monthsSincePurchase) / 12)}y {(calculations.payoffMonths - monthsSincePurchase) % 12}mo
                  </div>
                  <div className="text-sm font-semibold text-emerald-700 mb-1">Remaining</div>
                  <div className="text-xs text-emerald-600 font-medium bg-emerald-100 px-3 py-1 rounded-full">
                    Age {calculatedInputs.currentAge + Math.floor((calculations.payoffMonths - monthsSincePurchase) / 12)} at payoff
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 text-center border border-purple-200/50 hover:shadow-lg transition-all duration-300">
                  <div className="text-3xl font-black text-purple-600 mb-2">
                    {formatCurrency(calculations.monthlyPayment + calculatedInputs.extraPayment, calculatedInputs.currency)}
                  </div>
                  <div className="text-sm font-semibold text-purple-700 mb-1">Monthly Payment</div>
                  <div className="text-xs text-purple-600 font-medium bg-purple-100 px-3 py-1 rounded-full">
                    Total with extra
                  </div>
                </div>
              </div>
            </div>

            {/* Rate & Term Explorer - Now includes Extra Payment Quick Reference */}
            <RateTermExplorer
              baseInputs={calculatedInputs}
              currency={calculatedInputs.currency}
              baseScenario={{
                totalInterest: calculations.totalInterest,
                payoffMonths: calculations.payoffMonths
              }}
            />

            {/* Full Loan Progress Timeline - Detailed view */}
            <PayoffTimeline
              loanAmount={calculatedInputs.loanAmount}
              currentBalance={currentBalance}
              monthsSincePurchase={monthsSincePurchase}
              totalPayoffMonths={calculations.payoffMonths}
              monthlyPayment={calculations.monthlyPayment}
              extraPayment={calculatedInputs.extraPayment}
              currentAge={calculatedInputs.currentAge}
              currency={calculatedInputs.currency}
              interestRate={calculatedInputs.interestRate}
              loanTerm={calculatedInputs.loanTerm}
              purchaseDate={calculatedInputs.purchaseDate}
              paymentFrequency={calculatedInputs.paymentFrequency}
              oneTimePayment={calculatedInputs.oneTimePayment}
              downPayment={calculatedInputs.downPayment}
              homeValue={calculatedInputs.homeValue}
            />

            {/* Amortization Table */}
            <AmortizationTable
              amortization={calculations.amortization}
              currency={calculatedInputs.currency}
            />

            {/* Scenario Comparison */}
            <ScenarioComparison
              scenarios={scenarios}
              onRemoveScenario={removeScenario}
              currency={calculatedInputs.currency}
            />
          </div>
        </div>
      </div>

      {/* Mobile Floating Calculate Button */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <button
          onClick={handleCalculate}
          disabled={hasErrors || isCalculating}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 transform ${
            hasErrors || isCalculating
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white hover:scale-110 active:scale-95'
          }`}
        >
          {isCalculating ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Calculator className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}

export default App;