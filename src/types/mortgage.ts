export interface MortgageInputs {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  extraPayment: number;
  currentAge: number;
  purchaseDate: string;
  extraPaymentStartsNow: boolean;
  paymentFrequency: 'monthly' | 'biweekly';
  oneTimePayment: number;
  oneTimePaymentDate: string;
  downPayment: number;
  homeValue: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  pmiRate?: number; // PMI rate as percentage (default 0.5%)
}

export interface PaymentBreakdown {
  monthlyPayment: number;
  principal: number;
  interest: number;
  totalPayment: number;
  totalInterest: number;
  payoffMonths: number;
  savings: number;
  pmiMonths?: number;
  pmiAmount?: number;
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  pmi?: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface MortgageScenario {
  id: string;
  name: string;
  inputs: MortgageInputs;
  results: PaymentBreakdown;
}

export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' }
} as const;