class MortgageCalculation < ApplicationRecord
  belongs_to :user
  has_many :mortgage_scenarios, dependent: :destroy

  validates :loan_amount, presence: true, numericality: { greater_than: 0, less_than: 10_000_000 }
  validates :interest_rate, presence: true, numericality: { greater_than: 0, less_than: 30 }
  validates :loan_term, presence: true, numericality: { greater_than: 0, less_than: 50 }
  validates :current_age, presence: true, numericality: { greater_than_or_equal_to: 18, less_than: 100 }
  validates :purchase_date, presence: true
  validates :payment_frequency, inclusion: { in: %w[monthly biweekly] }
  validates :currency, inclusion: { in: %w[USD EUR GBP CAD AUD] }
  validates :home_value, presence: true, numericality: { greater_than: 0 }
  validates :down_payment, numericality: { greater_than_or_equal_to: 0 }

  validate :down_payment_not_greater_than_home_value

  scope :recent, -> { order(created_at: :desc) }

  def to_frontend_format
    {
      loanAmount: loan_amount,
      interestRate: interest_rate,
      loanTerm: loan_term,
      extraPayment: extra_payment || 0,
      currentAge: current_age,
      purchaseDate: purchase_date,
      extraPaymentStartsNow: extra_payment_starts_now || false,
      paymentFrequency: payment_frequency,
      oneTimePayment: one_time_payment || 0,
      oneTimePaymentDate: one_time_payment_date,
      downPayment: down_payment || 0,
      homeValue: home_value,
      currency: currency
    }
  end

  private

  def down_payment_not_greater_than_home_value
    return unless down_payment && home_value
    
    errors.add(:down_payment, "cannot be greater than home value") if down_payment > home_value
  end
end
