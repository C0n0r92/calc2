import { MortgageInputs, PaymentBreakdown, AmortizationEntry } from '../types/mortgage';

export const calculateMortgage = (inputs: MortgageInputs): PaymentBreakdown & { amortization: AmortizationEntry[], monthsSincePurchase: number, currentBalance: number } => {
  const { loanAmount, interestRate, loanTerm, extraPayment, paymentFrequency, oneTimePayment, oneTimePaymentDate, downPayment, homeValue } = inputs;
  
  const actualLoanAmount = loanAmount;
  const monthlyRate = interestRate / 100 / 12;
  const paymentsPerYear = paymentFrequency === 'biweekly' ? 26 : 12;
  const paymentRate = interestRate / 100 / paymentsPerYear;
  const numberOfPayments = loanTerm * paymentsPerYear;
  
  // Calculate months since purchase
  const monthsSincePurchase = Math.max(0, Math.floor((new Date().getTime() - new Date(inputs.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  
  // Calculate PMI if applicable (if down payment < 20%)
  const loanToValue = actualLoanAmount / homeValue;
  const needsPMI = loanToValue > 0.8;
  const pmiRate = needsPMI ? (inputs.pmiRate || 0.5) / 100 : 0; // Use configurable PMI rate
  const monthlyPMI = needsPMI ? (actualLoanAmount * pmiRate) / 12 : 0;
  
  // Standard payment calculation
  let basePayment: number;
  if (paymentFrequency === 'biweekly') {
    const monthlyPayment = actualLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm * 12)) / (Math.pow(1 + monthlyRate, loanTerm * 12) - 1);
    basePayment = monthlyPayment / 2;
  } else {
    basePayment = actualLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  }

  // Calculate current balance (standard payments only, no extra)
  let currentBalance = actualLoanAmount;
  if (monthsSincePurchase > 0) {
    let tempBalance = actualLoanAmount;
    const periodsElapsed = paymentFrequency === 'biweekly' ? Math.floor(monthsSincePurchase * 26 / 12) : monthsSincePurchase;
    
    for (let i = 0; i < periodsElapsed && tempBalance > 0.01; i++) {
      const interestPayment = tempBalance * paymentRate;
      let principalPayment = basePayment - interestPayment;
      if (principalPayment > tempBalance) {
        principalPayment = tempBalance;
      }
      tempBalance -= principalPayment;
    }
    currentBalance = Math.max(0, tempBalance);
  }

  // Calculate payoff with extra payments and one-time payment
  let balance = actualLoanAmount;
  let period = 0;
  let totalInterest = 0;
  let totalPMI = 0;
  let pmiMonths = 0;
  const amortization: AmortizationEntry[] = [];
  const oneTimePaymentPeriod = oneTimePaymentDate ? Math.floor((new Date(oneTimePaymentDate).getTime() - new Date(inputs.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * (paymentFrequency === 'biweekly' ? 14 : 30.44))) : -1;
  
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  while (balance > 0.01 && period < numberOfPayments + 120) {
    period++;
    const interestPayment = balance * paymentRate;
    let principalPayment = basePayment - interestPayment;
    
    // Add extra payment logic
    const periodsElapsed = paymentFrequency === 'biweekly' ? Math.floor(monthsSincePurchase * 26 / 12) : monthsSincePurchase;
    if (inputs.extraPaymentStartsNow && period > periodsElapsed && monthsSincePurchase > 0) {
      const extraPerPeriod = paymentFrequency === 'biweekly' ? extraPayment / 2 : extraPayment;
      principalPayment += extraPerPeriod;
    } else if (!inputs.extraPaymentStartsNow) {
      const extraPerPeriod = paymentFrequency === 'biweekly' ? extraPayment / 2 : extraPayment;
      principalPayment += extraPerPeriod;
    }
    
    // Add one-time payment
    if (period === oneTimePaymentPeriod && oneTimePayment > 0) {
      principalPayment += oneTimePayment;
    }
    
    if (principalPayment > balance) {
      principalPayment = balance;
    }

    // Calculate PMI
    const currentLTV = balance / homeValue;
    const currentPMI = currentLTV > 0.8 ? monthlyPMI : 0;
    if (currentPMI > 0) pmiMonths++;
    
    balance -= principalPayment;
    totalInterest += interestPayment;
    totalPMI += currentPMI;
    cumulativeInterest += interestPayment;
    cumulativePrincipal += principalPayment;

    // Convert period to month for display (approximate for biweekly)
    const displayMonth = paymentFrequency === 'biweekly' ? Math.ceil(period * 12 / 26) : period;
    
    amortization.push({
      month: displayMonth,
      payment: interestPayment + principalPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
      pmi: currentPMI,
      cumulativeInterest,
      cumulativePrincipal
    });
  }

  // Calculate standard loan for comparison
  let standardBalance = actualLoanAmount;
  let standardTotalInterest = 0;
  let standardPeriod = 0;
  
  while (standardBalance > 0.01 && standardPeriod < numberOfPayments) {
    standardPeriod++;
    const standardInterestPayment = standardBalance * paymentRate;
    let standardPrincipalPayment = basePayment - standardInterestPayment;
    
    if (standardPrincipalPayment > standardBalance) {
      standardPrincipalPayment = standardBalance;
    }
    
    standardBalance -= standardPrincipalPayment;
    standardTotalInterest += standardInterestPayment;
  }
  
  const savings = standardTotalInterest - totalInterest;
  const monthlyPayment = paymentFrequency === 'biweekly' ? basePayment * 26 / 12 : basePayment;

  return {
    monthlyPayment,
    principal: actualLoanAmount,
    interest: totalInterest,
    totalPayment: actualLoanAmount + totalInterest,
    totalInterest,
    payoffMonths: paymentFrequency === 'biweekly' ? Math.ceil(period * 12 / 26) : period,
    savings,
    pmiMonths: Math.ceil(pmiMonths * (paymentFrequency === 'biweekly' ? 12 / 26 : 1)),
    pmiAmount: totalPMI,
    amortization,
    monthsSincePurchase,
    currentBalance
  };
};