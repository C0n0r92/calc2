# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_09_18_134041) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "mortgage_calculations", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.decimal "loan_amount"
    t.decimal "interest_rate"
    t.integer "loan_term"
    t.decimal "extra_payment"
    t.decimal "property_tax"
    t.decimal "insurance"
    t.integer "current_age"
    t.date "purchase_date"
    t.boolean "extra_payment_starts_now"
    t.string "payment_frequency"
    t.decimal "one_time_payment"
    t.date "one_time_payment_date"
    t.decimal "down_payment"
    t.decimal "home_value"
    t.string "currency"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_mortgage_calculations_on_user_id"
  end

  create_table "mortgage_scenarios", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name"
    t.bigint "mortgage_calculation_id", null: false
    t.json "results"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["mortgage_calculation_id"], name: "index_mortgage_scenarios_on_mortgage_calculation_id"
    t.index ["user_id"], name: "index_mortgage_scenarios_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email"
    t.string "password_digest"
    t.string "first_name"
    t.string "last_name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "mortgage_calculations", "users"
  add_foreign_key "mortgage_scenarios", "mortgage_calculations"
  add_foreign_key "mortgage_scenarios", "users"
end
