class CreateMortgageScenarios < ActiveRecord::Migration[8.0]
  def change
    create_table :mortgage_scenarios do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name
      t.references :mortgage_calculation, null: false, foreign_key: true
      t.json :results

      t.timestamps
    end
  end
end
