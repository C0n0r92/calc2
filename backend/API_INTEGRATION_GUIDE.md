# Frontend Integration Guide

This guide helps you integrate your React frontend with the Rails API backend.

## Quick Start

1. **Start the Rails server:**
   ```bash
   cd mortgage_calculator_api
   rails server -p 3001
   ```
   The API will be available at `http://localhost:3001`

2. **Update your frontend to use the API:**
   Replace your local calculations with API calls.

## Integration Steps

### 1. Anonymous Calculations (No Auth Required)

Replace your local `calculateMortgage` function with an API call:

```typescript
// In your utils/mortgageCalculations.ts
export const calculateMortgage = async (inputs: MortgageInputs): Promise<PaymentBreakdown & { amortization: AmortizationEntry[], monthsSincePurchase: number, currentBalance: number }> => {
  const response = await fetch('http://localhost:3001/api/v1/mortgage_calculations/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inputs)
  });

  if (!response.ok) {
    throw new Error('Failed to calculate mortgage');
  }

  const data = await response.json();
  return data.result;
};
```

### 2. Scenario Comparison

For the overpayment scenarios:

```typescript
// In your components/OverpaymentScenarios.tsx
const fetchScenarioComparison = async (inputs: MortgageInputs, extraPaymentAmounts: number[]) => {
  const response = await fetch('http://localhost:3001/api/v1/mortgage_calculations/scenario_comparison', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...inputs,
      extra_payment_amounts: extraPaymentAmounts
    })
  });

  const data = await response.json();
  return data.scenarios;
};
```

### 3. User Authentication (Optional)

Add authentication to save scenarios:

```typescript
// Auth service
class AuthService {
  private token: string | null = localStorage.getItem('token');

  async register(userData: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
  }) {
    const response = await fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userData })
    });

    const data = await response.json();
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }
    return data;
  }

  async login(email: string, password: string) {
    const response = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }
    return data;
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService();
```

### 4. Saving Scenarios

```typescript
// Scenario service
export const saveScenario = async (name: string, inputs: MortgageInputs) => {
  const token = authService.getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch('http://localhost:3001/api/v1/mortgage_scenarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      inputs
    })
  });

  return response.json();
};

export const getScenarios = async () => {
  const token = authService.getToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch('http://localhost:3001/api/v1/mortgage_scenarios', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};
```

### 5. Update Your App Component

```typescript
// In your App.tsx
import { authService, saveScenario, getScenarios } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [scenarios, setScenarios] = useState<MortgageScenario[]>([]);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadScenarios();
    }
  }, []);

  const loadScenarios = async () => {
    try {
      const data = await getScenarios();
      setScenarios(data.scenarios);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    }
  };

  const handleSaveScenario = async () => {
    if (!authService.isAuthenticated()) {
      // Show login modal or redirect to login
      return;
    }

    try {
      const scenarioName = `Scenario ${scenarios.length + 1}`;
      await saveScenario(scenarioName, calculatedInputs);
      loadScenarios(); // Refresh scenarios
    } catch (error) {
      console.error('Failed to save scenario:', error);
    }
  };

  // ... rest of your component
}
```

## Environment Configuration

Create a `.env` file in your frontend project:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Then create an API client:

```typescript
// utils/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiClient = {
  async post(endpoint: string, data: any, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async get(endpoint: string, token?: string) {
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
};
```

## Production Deployment

For production, update your environment variables:

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://your-api-domain.com
```

**Backend (Rails):**
- Set `RAILS_ENV=production`
- Configure proper database credentials
- Update CORS origins in `config/initializers/cors.rb`

## Testing the Integration

1. Start both servers:
   ```bash
   # Terminal 1 - Rails API
   cd mortgage_calculator_api
   rails server -p 3001

   # Terminal 2 - React Frontend
   npm run dev
   ```

2. Test the calculation endpoint:
   - Open your React app
   - Enter mortgage details
   - Click "Calculate Mortgage"
   - Verify the results match your previous calculations

3. Test authentication (if implemented):
   - Register a new user
   - Login
   - Save a scenario
   - Verify it appears in the saved scenarios list

## Common Issues

1. **CORS Errors**: Make sure your frontend URL is added to the CORS configuration in Rails
2. **Port Conflicts**: Use different ports for frontend (5173) and backend (3001)
3. **Authentication Errors**: Ensure JWT tokens are properly stored and sent in headers
4. **Data Format**: The API expects snake_case but returns camelCase - handle conversion as needed

## Demo Account

Use these credentials to test with pre-saved scenarios:
- **Email**: demo@mortgagecalc.com
- **Password**: password123
