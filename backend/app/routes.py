from fastapi import APIRouter, HTTPException
from app.schemas import (
    MortgageCalculationRequest, 
    MortgageCalculationResult, 
    ScenarioComparisonRequest,
    ScenarioComparison,
    HealthCheck
)
from app.services.mortgage_calculator import MortgageCalculatorService
from datetime import datetime
from typing import List

router = APIRouter()


@router.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return HealthCheck(status="healthy", timestamp=datetime.now())


@router.post("/api/v1/mortgage_calculations/calculate", response_model=MortgageCalculationResult)
async def calculate_mortgage(request: MortgageCalculationRequest):
    """Calculate mortgage payments and amortization schedule"""
    try:
        # Convert Pydantic model to dict for the service
        inputs = request.dict()
        
        # Convert datetime to string if needed
        if inputs.get('purchase_date'):
            inputs['purchase_date'] = inputs['purchase_date'].isoformat()
        if inputs.get('one_time_payment_date'):
            inputs['one_time_payment_date'] = inputs['one_time_payment_date'].isoformat()
        
        calculator = MortgageCalculatorService(inputs)
        result = calculator.calculate()
        
        return MortgageCalculationResult(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")


@router.post("/api/v1/mortgage_calculations/scenario_comparison", response_model=List[ScenarioComparison])
async def scenario_comparison(request: ScenarioComparisonRequest):
    """Compare different extra payment scenarios"""
    try:
        # Convert Pydantic model to dict for the service
        inputs = request.inputs.dict()
        
        # Convert datetime to string if needed
        if inputs.get('purchase_date'):
            inputs['purchase_date'] = inputs['purchase_date'].isoformat()
        if inputs.get('one_time_payment_date'):
            inputs['one_time_payment_date'] = inputs['one_time_payment_date'].isoformat()
        
        calculator = MortgageCalculatorService(inputs)
        scenarios = calculator.calculate_scenario_comparison(request.extra_payment_amounts)
        
        return [ScenarioComparison(**scenario) for scenario in scenarios]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Scenario comparison error: {str(e)}")


# Legacy route compatibility (if your frontend uses these)
@router.post("/calculate", response_model=MortgageCalculationResult)
async def calculate_mortgage_legacy(request: MortgageCalculationRequest):
    """Legacy calculate endpoint for backward compatibility"""
    return await calculate_mortgage(request)


@router.post("/scenario_comparison", response_model=List[ScenarioComparison])
async def scenario_comparison_legacy(request: ScenarioComparisonRequest):
    """Legacy scenario comparison endpoint for backward compatibility"""
    return await scenario_comparison(request)
