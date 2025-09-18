import { MortgageInputs, PaymentBreakdown, AmortizationEntry } from '../types/mortgage';
import { apiService } from '../services/api';

// New API-based calculation function
export const calculateMortgageApi = async (inputs: MortgageInputs): Promise<PaymentBreakdown & { 
  amortization: AmortizationEntry[], 
  monthsSincePurchase: number, 
  currentBalance: number 
}> => {
  try {
    return await apiService.calculateMortgage(inputs);
  } catch (error) {
    console.error('API calculation failed, falling back to local calculation:', error);
    // Fall back to local calculation if API fails
    const { calculateMortgage } = await import('./mortgageCalculations');
    return calculateMortgage(inputs);
  }
};

// Export both versions for gradual migration
export { calculateMortgage as calculateMortgageLocal } from './mortgageCalculations';

// Default export uses API with fallback
export const calculateMortgage = calculateMortgageApi;
