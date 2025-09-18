class MortgageScenario < ApplicationRecord
  belongs_to :user
  belongs_to :mortgage_calculation

  validates :name, presence: true
  validates :results, presence: true

  scope :by_name, -> { order(:name) }
  scope :recent, -> { order(created_at: :desc) }

  def calculation_inputs
    mortgage_calculation.to_frontend_format
  end
end
