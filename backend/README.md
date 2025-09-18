# Mortgage Calculator API

A comprehensive Ruby on Rails API backend for a mortgage calculator application. This API provides mortgage calculation services, user authentication, and scenario management capabilities.

## Features

- **Mortgage Calculations**: Calculate monthly payments, amortization schedules, and payoff scenarios
- **Extra Payment Analysis**: Compare scenarios with different extra payment amounts
- **PMI Calculations**: Automatic private mortgage insurance calculations
- **Multiple Payment Frequencies**: Support for monthly and bi-weekly payments
- **User Authentication**: JWT-based authentication system
- **Scenario Management**: Save and compare multiple mortgage scenarios
- **Multi-Currency Support**: USD, EUR, GBP, CAD, AUD

## API Endpoints

### Authentication

```
POST /api/v1/auth/register    # User registration
POST /api/v1/auth/login       # User login
GET  /api/v1/auth/profile     # Get user profile
```

### Mortgage Calculations

```
POST /api/v1/mortgage_calculations/calculate             # Calculate mortgage (anonymous)
POST /api/v1/mortgage_calculations/scenario_comparison   # Compare extra payment scenarios
GET  /api/v1/mortgage_calculations                       # Get user's calculations
POST /api/v1/mortgage_calculations                       # Save calculation
GET  /api/v1/mortgage_calculations/:id                   # Get specific calculation
```

### Mortgage Scenarios

```
GET    /api/v1/mortgage_scenarios           # Get user's scenarios
POST   /api/v1/mortgage_scenarios           # Create new scenario
GET    /api/v1/mortgage_scenarios/:id       # Get specific scenario
PUT    /api/v1/mortgage_scenarios/:id       # Update scenario name
DELETE /api/v1/mortgage_scenarios/:id       # Delete scenario
POST   /api/v1/mortgage_scenarios/compare   # Compare multiple scenarios
```

## Request/Response Examples

### Calculate Mortgage

**POST** `/api/v1/mortgage_calculations/calculate`

```json
{
  "loan_amount": 300000,
  "interest_rate": 6.5,
  "loan_term": 30,
  "extra_payment": 200,
  "property_tax": 300,
  "insurance": 150,
  "current_age": 35,
  "purchase_date": "2022-01-01",
  "extra_payment_starts_now": true,
  "payment_frequency": "monthly",
  "one_time_payment": 5000,
  "one_time_payment_date": "2025-06-01",
  "down_payment": 60000,
  "home_value": 360000,
  "currency": "USD"
}
```

**Response:**
```json
{
  "result": {
    "monthly_payment": 1896.20,
    "principal": 300000,
    "interest": 383230.19,
    "total_payment": 683230.19,
    "total_interest": 383230.19,
    "payoff_months": 360,
    "savings": 45230.50,
    "pmi_months": 0,
    "pmi_amount": 0,
    "amortization": [...],
    "months_since_purchase": 24,
    "current_balance": 285430.22
  }
}
```

### Create Scenario

**POST** `/api/v1/mortgage_scenarios`

```json
{
  "name": "Aggressive Payoff Strategy",
  "inputs": {
    "loan_amount": 300000,
    "interest_rate": 6.5,
    "loan_term": 30,
    "extra_payment": 500,
    "current_age": 35,
    "purchase_date": "2024-01-01",
    "payment_frequency": "monthly",
    "down_payment": 60000,
    "home_value": 360000,
    "currency": "USD"
  }
}
```

### User Authentication

**POST** `/api/v1/auth/register`

```json
{
  "user": {
    "email": "user@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

## Setup Instructions

### Prerequisites

- Ruby 3.0+ 
- Rails 8.0+
- PostgreSQL
- Bundler

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mortgage_calculator_api
   ```

2. **Install dependencies:**
   ```bash
   bundle install
   ```

3. **Database setup:**
   ```bash
   rails db:create
   rails db:migrate
   rails db:seed
   ```

4. **Start the server:**
   ```bash
   rails server
   ```

The API will be available at `http://localhost:3000`

### Demo Account

A demo account is created with the seed data:
- **Email:** demo@mortgagecalc.com
- **Password:** password123

## Configuration

### CORS Settings

The API is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)
- `http://localhost:4173` (Vite preview server)

To modify CORS settings, edit `config/initializers/cors.rb`

### Database Configuration

PostgreSQL is used as the database. Configuration can be found in `config/database.yml`

### Environment Variables

For production deployment, set the following environment variables:
- `MORTGAGE_CALCULATOR_API_DATABASE_PASSWORD` - Database password
- `SECRET_KEY_BASE` - Rails secret key base
- `RAILS_ENV=production`

## Frontend Integration

This API is designed to work with the React/TypeScript frontend. The calculation logic matches exactly with the frontend implementation to ensure consistency.

### Key Integration Points:

1. **Authentication**: Use JWT tokens in Authorization header
2. **Calculations**: Anonymous calculations don't require authentication
3. **Scenarios**: Require authentication for saving/retrieving
4. **Data Format**: Matches frontend TypeScript interfaces

### Sample Frontend Integration:

```javascript
// Anonymous calculation
const response = await fetch('http://localhost:3000/api/v1/mortgage_calculations/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(mortgageInputs)
});

// Authenticated request
const response = await fetch('http://localhost:3000/api/v1/mortgage_scenarios', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

## Testing

Run the test suite:
```bash
rails test
```

## Production Deployment

1. **Set environment variables**
2. **Run database migrations:**
   ```bash
   rails db:create RAILS_ENV=production
   rails db:migrate RAILS_ENV=production
   ```
3. **Start the server:**
   ```bash
   rails server -e production
   ```

## API Documentation

For detailed API documentation with all endpoints, request/response schemas, and authentication details, the API is self-documenting through the Rails routes and controller implementations.

Run `rails routes` to see all available endpoints.

## Support

For issues or questions, please refer to the codebase documentation or create an issue in the repository.