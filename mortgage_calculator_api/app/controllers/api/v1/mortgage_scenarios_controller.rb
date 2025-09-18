class Api::V1::MortgageScenariosController < Api::V1::BaseController
  def index
    scenarios = current_user.mortgage_scenarios.includes(:mortgage_calculation).recent
    render json: { 
      scenarios: scenarios.map do |scenario|
        {
          id: scenario.id,
          name: scenario.name,
          inputs: scenario.calculation_inputs,
          results: scenario.results,
          created_at: scenario.created_at
        }
      end
    }
  end

  def show
    scenario = current_user.mortgage_scenarios.find(params[:id])
    render json: {
      id: scenario.id,
      name: scenario.name,
      inputs: scenario.calculation_inputs,
      results: scenario.results,
      created_at: scenario.created_at
    }
  end

  def create
    # First create or find the mortgage calculation
    calculation = current_user.mortgage_calculations.create!(calculation_params)
    
    # Calculate the results
    calculator = MortgageCalculatorService.new(calculation.to_frontend_format)
    results = calculator.calculate

    # Create the scenario
    scenario = current_user.mortgage_scenarios.build(
      name: params[:name] || "Scenario #{current_user.mortgage_scenarios.count + 1}",
      mortgage_calculation: calculation,
      results: results
    )

    if scenario.save
      render json: {
        id: scenario.id,
        name: scenario.name,
        inputs: scenario.calculation_inputs,
        results: scenario.results,
        created_at: scenario.created_at
      }, status: :created
    else
      render json: { errors: scenario.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    scenario = current_user.mortgage_scenarios.find(params[:id])
    
    if scenario.update(name: params[:name])
      render json: {
        id: scenario.id,
        name: scenario.name,
        inputs: scenario.calculation_inputs,
        results: scenario.results,
        created_at: scenario.created_at
      }
    else
      render json: { errors: scenario.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    scenario = current_user.mortgage_scenarios.find(params[:id])
    scenario.destroy
    head :no_content
  end

  def compare
    scenario_ids = params[:scenario_ids] || []
    scenarios = current_user.mortgage_scenarios.where(id: scenario_ids).includes(:mortgage_calculation)
    
    comparison_data = scenarios.map do |scenario|
      {
        id: scenario.id,
        name: scenario.name,
        inputs: scenario.calculation_inputs,
        results: scenario.results
      }
    end

    render json: { scenarios: comparison_data }
  end

  private

  def calculation_params
    params.require(:inputs).permit(
      :loan_amount, :interest_rate, :loan_term, :extra_payment,
      :property_tax, :insurance, :current_age, :purchase_date,
      :extra_payment_starts_now, :payment_frequency, :one_time_payment,
      :one_time_payment_date, :down_payment, :home_value, :currency
    )
  end
end
