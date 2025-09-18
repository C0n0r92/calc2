class Api::V1::MortgageCalculationsController < Api::V1::BaseController
  skip_before_action :authenticate_request, only: [:calculate, :scenario_comparison]

  def index
    calculations = current_user.mortgage_calculations.recent.limit(10)
    render json: { calculations: calculations.map(&:to_frontend_format) }
  end

  def show
    calculation = current_user.mortgage_calculations.find(params[:id])
    result = MortgageCalculatorService.new(calculation.to_frontend_format).calculate
    
    render json: {
      calculation: calculation.to_frontend_format,
      result: result
    }
  end

  def create
    calculation = current_user.mortgage_calculations.build(calculation_params)
    
    if calculation.save
      result = MortgageCalculatorService.new(calculation.to_frontend_format).calculate
      render json: {
        calculation: calculation.to_frontend_format,
        result: result
      }, status: :created
    else
      render json: { errors: calculation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def calculate
    # Allow anonymous calculations
    calculator = MortgageCalculatorService.new(frontend_params)
    result = calculator.calculate
    
    render json: { result: result }
  end

  def scenario_comparison
    calculator = MortgageCalculatorService.new(frontend_params)
    comparison = calculator.calculate_scenario_comparison(
      params[:extra_payment_amounts] || [50, 100, 200, 500]
    )
    
    render json: { scenarios: comparison }
  end

  private

  def calculation_params
    params.require(:calculation).permit(
      :loan_amount, :interest_rate, :loan_term, :extra_payment, 
      :current_age, :purchase_date,
      :extra_payment_starts_now, :payment_frequency, :one_time_payment,
      :one_time_payment_date, :down_payment, :home_value, :currency, :pmi_rate
    )
  end

  def frontend_params
    params.permit(
      :loan_amount, :interest_rate, :loan_term, :extra_payment,
      :current_age, :purchase_date,
      :extra_payment_starts_now, :payment_frequency, :one_time_payment,
      :one_time_payment_date, :down_payment, :home_value, :currency, :pmi_rate
    ).to_h.with_indifferent_access
  end
end
