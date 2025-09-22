# Mortgage Payoff Calculator

A modern mortgage calculator built with Python FastAPI backend and React frontend, designed for easy deployment on Digital Ocean.

## 🏗️ Project Structure

```
├── .do/
│   └── app.yaml              # Digital Ocean App Platform configuration
├── python-backend/            # FastAPI backend service
│   ├── app/
│   │   ├── main.py           # FastAPI application entry point
│   │   ├── routes.py         # API endpoints
│   │   ├── schemas.py        # Pydantic models
│   │   ├── config.py         # Configuration settings
│   │   └── services/
│   │       └── mortgage_calculator.py  # Core calculation logic
│   ├── Dockerfile            # Backend container configuration
│   └── requirements.txt      # Python dependencies
├── webapp/                   # React frontend application
│   ├── src/                  # React source code
│   ├── public/              # Static assets
│   ├── Dockerfile           # Frontend container configuration
│   ├── nginx.conf           # Nginx configuration
│   └── package.json         # Node.js dependencies
├── docker-compose.yml       # Production deployment
├── docker-compose.dev.yml   # Development environment
└── DEPLOYMENT_GUIDE.md      # Detailed deployment instructions
```

## 🚀 Quick Start

### Local Development
```bash
# Start both services
docker compose -f docker-compose.dev.yml up

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Production Deployment
```bash
# Build and run production containers
docker compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

## 📡 API Endpoints

- `GET /health` - Health check
- `POST /api/v1/mortgage_calculations/calculate` - Calculate mortgage payments
- `POST /api/v1/mortgage_calculations/scenario_comparison` - Compare payment scenarios
- `GET /docs` - Interactive API documentation

## 🌊 Digital Ocean Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy mortgage calculator"
   git push origin main
   ```

2. **Deploy on Digital Ocean**:
   - Go to [Digital Ocean Apps](https://cloud.digitalocean.com/apps)
   - Create new app from GitHub repository
   - Configuration will be auto-detected from `.do/app.yaml`
   - Deploy!

## 💰 Estimated Costs
- **Digital Ocean App Platform**: ~$10/month
  - Frontend (Static Site): $5/month
  - Backend (Basic): $5/month

## 🛠️ Technologies

### Backend
- **Python 3.11** - Runtime
- **FastAPI** - Web framework
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Nginx** - Web server

### DevOps
- **Docker** - Containerization
- **Digital Ocean App Platform** - Hosting
- **GitHub Actions** - CI/CD (optional)

## 📊 Features

- **Mortgage Payment Calculations** - Monthly/biweekly payments
- **Extra Payment Analysis** - See interest savings
- **Scenario Comparisons** - Compare different payment strategies
- **PMI Calculations** - Private mortgage insurance
- **Amortization Schedules** - Detailed payment breakdowns
- **Responsive Design** - Works on all devices
- **No User Authentication** - Simple, stateless calculations

## 🔧 Development

### Backend Development
```bash
cd python-backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd webapp
npm install
npm run dev
```

## 📝 License

MIT License - see LICENSE file for details
