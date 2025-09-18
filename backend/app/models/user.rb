class User < ApplicationRecord
  has_secure_password

  has_many :mortgage_calculations, dependent: :destroy
  has_many :mortgage_scenarios, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :first_name, presence: true
  validates :last_name, presence: true

  before_save { self.email = email.downcase }

  def full_name
    "#{first_name} #{last_name}"
  end
end
