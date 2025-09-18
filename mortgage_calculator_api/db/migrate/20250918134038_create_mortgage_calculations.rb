class CreateMortgageCalculations < ActiveRecord::Migration[8.0]
  def change
    create_table :mortgage_calculations do |t|
      t.references :user, null: false, foreign_key: true
      t.decimal :loan_amount
      t.decimal :interest_rate
      t.integer :loan_term
      t.decimal :extra_payment
      t.decimal :property_tax
      t.decimal :insurance
      t.integer :current_age
      t.date :purchase_date
      t.boolean :extra_payment_starts_now
      t.string :payment_frequency
      t.decimal :one_time_payment
      t.date :one_time_payment_date
      t.decimal :down_payment
      t.decimal :home_value
      t.string :currency

      t.timestamps
    end
  end
end
