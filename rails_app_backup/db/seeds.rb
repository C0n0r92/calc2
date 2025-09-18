# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create a demo user
demo_user = User.find_or_create_by!(email: 'demo@mortgagecalc.com') do |user|
  user.password = 'password123'
  user.password_confirmation = 'password123'
  user.first_name = 'Demo'
  user.last_name = 'User'
end

puts "Created demo user: #{demo_user.email}"

# Create sample mortgage calculations
calculations_data = [
  {
    loan_amount: 300000,
    interest_rate: 6.5,
    loan_term: 30,
    extra_payment: 0,
    property_tax: 300,
    insurance: 150,
    current_age: 35,
    purchase_date: Date.current - 2.years,
    extra_payment_starts_now: false,
    payment_frequency: 'monthly',
    one_time_payment: 0,
    down_payment: 60000,
    home_value: 360000,
    currency: 'USD'
  },
  {
    loan_amount: 250000,
    interest_rate: 7.0,
    loan_term: 30,
    extra_payment: 200,
    property_tax: 250,
    insurance: 125,
    current_age: 28,
    purchase_date: Date.current - 1.year,
    extra_payment_starts_now: true,
    payment_frequency: 'monthly',
    one_time_payment: 5000,
    one_time_payment_date: Date.current + 6.months,
    down_payment: 50000,
    home_value: 300000,
    currency: 'USD'
  },
  {
    loan_amount: 500000,
    interest_rate: 5.5,
    loan_term: 25,
    extra_payment: 500,
    property_tax: 600,
    insurance: 300,
    current_age: 42,
    purchase_date: Date.current,
    extra_payment_starts_now: false,
    payment_frequency: 'biweekly',
    one_time_payment: 0,
    down_payment: 100000,
    home_value: 600000,
    currency: 'USD'
  }
]

calculations_data.each_with_index do |calc_data, index|
  calculation = demo_user.mortgage_calculations.find_or_create_by!(
    loan_amount: calc_data[:loan_amount],
    interest_rate: calc_data[:interest_rate]
  ) do |calc|
    calc.assign_attributes(calc_data)
  end

  # Create mortgage scenario for each calculation
  calculator = MortgageCalculatorService.new(calculation.to_frontend_format)
  results = calculator.calculate
  
  scenario_name = case index
  when 0
    "Standard 30-year Fixed"
  when 1
    "Aggressive Payoff Strategy"
  when 2
    "Bi-weekly Premium Home"
  end

  demo_user.mortgage_scenarios.find_or_create_by!(
    name: scenario_name,
    mortgage_calculation: calculation
  ) do |scenario|
    scenario.results = results
  end

  puts "Created calculation and scenario: #{scenario_name}"
end

puts "Seed data created successfully!"
puts "Demo user email: demo@mortgagecalc.com"
puts "Demo user password: password123"
