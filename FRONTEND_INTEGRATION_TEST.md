# Frontend Integration Test Guide

## Quick Test Setup

I've created the API integration for your frontend. Here's how to test it:

### 1. Start Both Servers

**Terminal 1 - Rails API:**
```bash
cd mortgage_calculator_api
rails server -p 3001
```

**Terminal 2 - React Frontend with API:**
```bash
# From the main project directory
npm run dev -- --port 5174
```

### 2. Test API Integration

**Option A: Replace your main app (backup first!)**
```bash
# Backup your current App.tsx
mv src/App.tsx src/App-original.tsx
mv src/main.tsx src/main-original.tsx

# Use API version
mv src/AppWithApi.tsx src/App.tsx
mv src/main-api.tsx src/main.tsx
```

**Option B: Test side by side**
Just modify your `src/main.tsx` to import from `AppWithApi` instead of `App`:
```typescript
import App from './AppWithApi.tsx'
```

### 3. What You'll See

- **API Connected indicator** in the header when backend is running
- **Loading states** during calculations
- **Fallback to local calculation** if API fails
- **Enhanced overpayment scenarios** powered by the API

### 4. Test the Integration

1. **Basic Calculation:**
   - Enter mortgage details
   - Click "Calculate Mortgage"
   - Should work exactly like before but using API

2. **API Features:**
   - Overpayment scenarios load from API
   - Connection status indicator
   - Graceful fallback if API is down

3. **Error Handling:**
   - Stop the Rails server (`Ctrl+C`)
   - Try calculating - should fall back to local calculation
   - Restart Rails server - should reconnect automatically

### 5. Files Created

- `src/services/api.ts` - Main API service
- `src/utils/mortgageCalculationsApi.ts` - API calculation wrapper
- `src/components/OverpaymentScenariosApi.tsx` - API-powered scenarios
- `src/AppWithApi.tsx` - App with API integration
- `src/main-api.tsx` - Entry point for API version

### 6. How the Integration Works

**Calculation Flow:**
1. User clicks "Calculate Mortgage"
2. Frontend sends request to Rails API at `http://localhost:3001`
3. Rails processes calculation using the same logic as your frontend
4. Returns results to frontend
5. If API fails, falls back to local calculation

**API Endpoints Used:**
- `POST /api/v1/mortgage_calculations/calculate` - Main calculation
- `POST /api/v1/mortgage_calculations/scenario_comparison` - Extra payment scenarios

### 7. Next Steps

Once you verify this works:

1. **Update your original App.tsx** with API features you want
2. **Add authentication** for saving scenarios (optional)
3. **Deploy both frontend and backend** to production

### 8. Production Deployment

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://your-api-domain.com
```

**Backend:**
- Deploy Rails app to Heroku, Railway, or AWS
- Update CORS settings for your production domain

## Troubleshooting

**CORS Errors:**
- Make sure Rails server is running on port 3001
- Check browser console for specific errors

**Connection Issues:**
- Verify Rails server is accessible at `http://localhost:3001/up`
- Check if ports are conflicting

**Calculation Differences:**
- Both local and API should return identical results
- If they differ, there may be a data format issue

## Current Status

✅ **Rails API**: Fully functional with all mortgage calculations
✅ **Frontend Service**: API client with fallback to local calculation  
✅ **Integration**: Basic integration with error handling
⏳ **Authentication**: Optional - for saving scenarios
⏳ **Production**: Ready for deployment configuration

Your mortgage calculator now has a powerful Rails backend while maintaining all existing functionality!
