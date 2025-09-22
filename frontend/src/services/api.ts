import { MortgageInputs, PaymentBreakdown, AmortizationEntry } from '../types/mortgage';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // In production (Digital Ocean), use relative path
  if (window.location.hostname.includes('ondigitalocean.app')) {
    return '';  // Use relative path, same domain
  }
  // In development, use environment variable or localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  result?: T;
  scenarios?: T;
  user?: any;
  token?: string;
  errors?: string[];
  error?: string;
}

class ApiService {
  private token: string | null = localStorage.getItem('authToken');

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token && !endpoint.includes('/auth/')) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Convert camelCase to snake_case for Rails API
  private toSnakeCase(inputs: MortgageInputs): any {
    return {
      loan_amount: inputs.loanAmount,
      interest_rate: inputs.interestRate,
      loan_term: inputs.loanTerm,
      extra_payment: inputs.extraPayment || 0,
      current_age: inputs.currentAge,
      purchase_date: inputs.purchaseDate,
      extra_payment_starts_now: inputs.extraPaymentStartsNow || false,
      payment_frequency: inputs.paymentFrequency || 'monthly',
      one_time_payment: inputs.oneTimePayment || 0,
      one_time_payment_date: inputs.oneTimePaymentDate || null,
      down_payment: inputs.downPayment || 0,
      home_value: inputs.homeValue,
      currency: inputs.currency || 'USD',
      pmi_rate: inputs.pmiRate || 0.5
    };
  }

  // Convert snake_case API response to camelCase for frontend
  private toCamelCase(apiResponse: any): any {
    if (!apiResponse) return apiResponse;
    
    return {
      monthlyPayment: apiResponse.monthly_payment,
      principal: apiResponse.principal,
      interest: apiResponse.interest,
      totalPayment: apiResponse.total_payment,
      totalInterest: apiResponse.total_interest,
      payoffMonths: apiResponse.payoff_months,
      savings: apiResponse.savings,
      pmiMonths: apiResponse.pmi_months,
      pmiAmount: apiResponse.pmi_amount,
      amortization: apiResponse.amortization,
      monthsSincePurchase: apiResponse.months_since_purchase,
      currentBalance: apiResponse.current_balance
    };
  }

  private scenarioToCamelCase(scenario: any): any {
    if (!scenario) return scenario;
    
    return {
      extraPayment: scenario.extra_payment,
      monthsSaved: scenario.months_saved,
      interestSaved: scenario.interest_saved,
      newPayoffTime: scenario.new_payoff_time
    };
  }

  // Mortgage calculations (anonymous)
  async calculateMortgage(inputs: MortgageInputs): Promise<PaymentBreakdown & { 
    amortization: AmortizationEntry[], 
    monthsSincePurchase: number, 
    currentBalance: number 
  }> {
    const snakeCaseInputs = this.toSnakeCase(inputs);
    
    const response = await this.request<any>('/api/v1/mortgage_calculations/calculate', {
      method: 'POST',
      body: JSON.stringify(snakeCaseInputs),
    });

    if (!response.result) {
      throw new Error('No calculation result received');
    }

    return this.toCamelCase(response.result);
  }

  // Scenario comparison (anonymous)
  async calculateScenarioComparison(
    inputs: MortgageInputs, 
    extraPaymentAmounts: number[] = [50, 100, 200, 500]
  ) {
    const snakeCaseInputs = this.toSnakeCase(inputs);
    
    const response = await this.request('/api/v1/mortgage_calculations/scenario_comparison', {
      method: 'POST',
      body: JSON.stringify({
        ...snakeCaseInputs,
        extra_payment_amounts: extraPaymentAmounts,
      }),
    });
    
    // Convert each scenario to camelCase
    const scenarios = response.scenarios || [];
    return Array.isArray(scenarios) ? scenarios.map((scenario: any) => this.scenarioToCamelCase(scenario)) : [];
  }

  // Authentication
  async register(userData: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
  }) {
    const response = await this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ user: userData }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
    }

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.token = response.token;
      localStorage.setItem('authToken', response.token);
    }

    return response;
  }

  async getProfile() {
    return this.request('/api/v1/auth/profile');
  }

  // Scenario management (requires authentication)
  async saveScenario(name: string, inputs: MortgageInputs) {
    return this.request('/api/v1/mortgage_scenarios', {
      method: 'POST',
      body: JSON.stringify({
        name,
        inputs,
      }),
    });
  }

  async getScenarios() {
    return this.request('/api/v1/mortgage_scenarios');
  }

  async deleteScenario(id: string) {
    return this.request(`/api/v1/mortgage_scenarios/${id}`, {
      method: 'DELETE',
    });
  }

  async compareScenarios(scenarioIds: string[]) {
    return this.request('/api/v1/mortgage_scenarios/compare', {
      method: 'POST',
      body: JSON.stringify({ scenario_ids: scenarioIds }),
    });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return this.token;
  }
}

export const apiService = new ApiService();
