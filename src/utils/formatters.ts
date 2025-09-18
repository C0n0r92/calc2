import { CURRENCIES } from '../types/mortgage';

export const formatCurrency = (amount: number, currency: keyof typeof CURRENCIES = 'USD') => {
  const currencyInfo = CURRENCIES[currency];
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Add thousand separators
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const parseFormattedNumber = (value: string): number => {
  return parseInt(value.replace(/,/g, '')) || 0;
};

export const formatPercent = (rate: number): string => {
  return `${rate.toFixed(2)}%`;
};

export const yearsMonthsFromMonths = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths}mo`;
  if (remainingMonths === 0) return `${years}y`;
  return `${years}y ${remainingMonths}mo`;
};

export const validateInput = (field: string, value: number): string | null => {
  switch (field) {
    case 'loanAmount':
      if (value <= 0) return 'Loan amount must be greater than 0';
      if (value > 10000000) return 'Loan amount seems unrealistic';
      break;
    case 'interestRate':
      if (value <= 0) return 'Interest rate must be greater than 0';
      if (value > 30) return 'Interest rate seems too high';
      break;
    case 'loanTerm':
      if (value <= 0) return 'Loan term must be greater than 0';
      if (value > 50) return 'Loan term seems too long';
      break;
    case 'currentAge':
      if (value < 18) return 'Age must be at least 18';
      if (value > 100) return 'Age seems unrealistic';
      break;
    case 'downPayment':
      if (value < 0) return 'Down payment cannot be negative';
      break;
    case 'homeValue':
      if (value <= 0) return 'Home value must be greater than 0';
      break;
  }
  return null;
};