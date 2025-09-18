class MortgageCalculatorService
  attr_reader :inputs

  def initialize(inputs)
    @inputs = inputs.with_indifferent_access
  end

  def calculate
    {
      monthly_payment: monthly_payment,
      principal: actual_loan_amount,
      interest: total_interest,
      total_payment: actual_loan_amount + total_interest,
      total_interest: total_interest,
      payoff_months: payoff_months,
      savings: savings,
      pmi_months: pmi_months,
      pmi_amount: total_pmi,
      amortization: amortization,
      months_since_purchase: months_since_purchase,
      current_balance: current_balance
    }
  end

  def calculate_scenario_comparison(extra_payment_amounts = [50, 100, 200, 500])
    extra_payment_amounts.map do |extra_amount|
      scenario_inputs = inputs.merge(extra_payment: extra_amount)
      scenario_calculator = MortgageCalculatorService.new(scenario_inputs)
      scenario_result = scenario_calculator.calculate

      base_calculator = MortgageCalculatorService.new(inputs.merge(extra_payment: 0))
      base_result = base_calculator.calculate

      {
        extra_payment: extra_amount,
        months_saved: base_result[:payoff_months] - scenario_result[:payoff_months],
        interest_saved: base_result[:total_interest] - scenario_result[:total_interest],
        new_payoff_time: scenario_result[:payoff_months]
      }
    end
  end

  private

  def actual_loan_amount
    inputs[:loan_amount].to_f
  end

  def monthly_rate
    inputs[:interest_rate].to_f / 100 / 12
  end

  def payments_per_year
    inputs[:payment_frequency] == 'biweekly' ? 26 : 12
  end

  def payment_rate
    inputs[:interest_rate].to_f / 100 / payments_per_year
  end

  def number_of_payments
    inputs[:loan_term].to_i * payments_per_year
  end

  def months_since_purchase
    return 0 unless inputs[:purchase_date]
    
    purchase_date = inputs[:purchase_date].is_a?(String) ? Date.parse(inputs[:purchase_date]) : inputs[:purchase_date]
    months = ((Date.current - purchase_date) / 30.44).to_i
    [0, months].max
  end

  def need_pmi?
    loan_to_value > 0.8
  end

  def loan_to_value
    actual_loan_amount / inputs[:home_value].to_f
  end

  def pmi_rate
    need_pmi? ? (inputs[:pmi_rate]&.to_f || 0.5) / 100 : 0 # Use configurable PMI rate
  end

  def monthly_pmi
    need_pmi? ? (actual_loan_amount * pmi_rate) / 12 : 0
  end

  def base_payment
    @base_payment ||= begin
      if inputs[:payment_frequency] == 'biweekly'
        monthly_payment_calc = actual_loan_amount * (monthly_rate * (1 + monthly_rate) ** (inputs[:loan_term].to_i * 12)) / 
                              ((1 + monthly_rate) ** (inputs[:loan_term].to_i * 12) - 1)
        monthly_payment_calc / 2
      else
        actual_loan_amount * (monthly_rate * (1 + monthly_rate) ** number_of_payments) / 
        ((1 + monthly_rate) ** number_of_payments - 1)
      end
    end
  end

  def current_balance
    @current_balance ||= calculate_current_balance
  end

  def calculate_current_balance
    return actual_loan_amount if months_since_purchase <= 0

    temp_balance = actual_loan_amount
    periods_elapsed = inputs[:payment_frequency] == 'biweekly' ? 
                     (months_since_purchase * 26 / 12).floor : months_since_purchase

    periods_elapsed.times do
      break if temp_balance <= 0.01
      
      interest_payment = temp_balance * payment_rate
      principal_payment = base_payment - interest_payment
      principal_payment = temp_balance if principal_payment > temp_balance
      temp_balance -= principal_payment
    end

    [0, temp_balance].max
  end

  def one_time_payment_period
    return -1 unless inputs[:one_time_payment_date] && inputs[:one_time_payment].to_f > 0

    one_time_date = inputs[:one_time_payment_date].is_a?(String) ? 
                   Date.parse(inputs[:one_time_payment_date]) : inputs[:one_time_payment_date]
    purchase_date = inputs[:purchase_date].is_a?(String) ? 
                   Date.parse(inputs[:purchase_date]) : inputs[:purchase_date]
    
    days_diff = (one_time_date - purchase_date).to_i
    period_length = inputs[:payment_frequency] == 'biweekly' ? 14 : 30.44
    (days_diff / period_length).floor
  end

  def calculate_amortization_and_totals
    @amortization_data ||= begin
      balance = actual_loan_amount
      period = 0
      total_interest = 0
      total_pmi = 0
      pmi_months = 0
      amortization = []
      cumulative_interest = 0
      cumulative_principal = 0

      while balance > 0.01 && period < number_of_payments + 120
        period += 1
        interest_payment = balance * payment_rate
        principal_payment = base_payment - interest_payment

        # Add extra payment logic
        periods_elapsed = inputs[:payment_frequency] == 'biweekly' ? 
                         (months_since_purchase * 26 / 12).floor : months_since_purchase

        if inputs[:extra_payment_starts_now] && period > periods_elapsed && months_since_purchase > 0
          extra_per_period = inputs[:payment_frequency] == 'biweekly' ? 
                           inputs[:extra_payment].to_f / 2 : inputs[:extra_payment].to_f
          principal_payment += extra_per_period
        elsif !inputs[:extra_payment_starts_now]
          extra_per_period = inputs[:payment_frequency] == 'biweekly' ? 
                           inputs[:extra_payment].to_f / 2 : inputs[:extra_payment].to_f
          principal_payment += extra_per_period
        end

        # Add one-time payment
        if period == one_time_payment_period && inputs[:one_time_payment].to_f > 0
          principal_payment += inputs[:one_time_payment].to_f
        end

        principal_payment = balance if principal_payment > balance

        # Calculate PMI
        current_ltv = balance / inputs[:home_value].to_f
        current_pmi = current_ltv > 0.8 ? monthly_pmi : 0
        pmi_months += 1 if current_pmi > 0

        balance -= principal_payment
        total_interest += interest_payment
        total_pmi += current_pmi
        cumulative_interest += interest_payment
        cumulative_principal += principal_payment

        # Convert period to month for display
        display_month = inputs[:payment_frequency] == 'biweekly' ? 
                       (period * 12 / 26.0).ceil : period

        amortization << {
          month: display_month,
          payment: interest_payment + principal_payment,
          principal: principal_payment,
          interest: interest_payment,
          balance: [0, balance].max,
          pmi: current_pmi,
          cumulative_interest: cumulative_interest,
          cumulative_principal: cumulative_principal
        }
      end

      {
        amortization: amortization,
        total_interest: total_interest,
        total_pmi: total_pmi,
        payoff_months: inputs[:payment_frequency] == 'biweekly' ? 
                      (period * 12 / 26.0).ceil : period,
        pmi_months: (pmi_months * (inputs[:payment_frequency] == 'biweekly' ? 12 / 26.0 : 1)).ceil
      }
    end
  end

  def calculate_standard_loan_for_comparison
    @standard_loan ||= begin
      standard_balance = actual_loan_amount
      standard_total_interest = 0
      standard_period = 0

      while standard_balance > 0.01 && standard_period < number_of_payments
        standard_period += 1
        standard_interest_payment = standard_balance * payment_rate
        standard_principal_payment = base_payment - standard_interest_payment
        standard_principal_payment = standard_balance if standard_principal_payment > standard_balance

        standard_balance -= standard_principal_payment
        standard_total_interest += standard_interest_payment
      end

      standard_total_interest
    end
  end

  def amortization
    calculate_amortization_and_totals[:amortization]
  end

  def total_interest
    calculate_amortization_and_totals[:total_interest]
  end

  def total_pmi
    calculate_amortization_and_totals[:total_pmi]
  end

  def payoff_months
    calculate_amortization_and_totals[:payoff_months]
  end

  def pmi_months
    calculate_amortization_and_totals[:pmi_months]
  end

  def savings
    calculate_standard_loan_for_comparison - total_interest
  end

  def monthly_payment
    inputs[:payment_frequency] == 'biweekly' ? base_payment * 26 / 12 : base_payment
  end
end
