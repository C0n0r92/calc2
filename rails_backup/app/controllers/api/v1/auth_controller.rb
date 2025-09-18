class Api::V1::AuthController < ApplicationController
  skip_before_action :authenticate_request, only: [:register, :login]

  def register
    user = User.new(user_params)
    
    if user.save
      token = JsonWebToken.encode(user_id: user.id)
      render json: { 
        user: user_response(user), 
        token: token 
      }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def login
    user = User.find_by(email: params[:email]&.downcase)
    
    if user&.authenticate(params[:password])
      token = JsonWebToken.encode(user_id: user.id)
      render json: { 
        user: user_response(user), 
        token: token 
      }
    else
      render json: { error: 'Invalid email or password' }, status: :unauthorized
    end
  end

  def profile
    render json: { user: user_response(current_user) }
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name)
  end

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name
    }
  end
end
