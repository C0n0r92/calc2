Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes
  namespace :api do
    namespace :v1 do
      # Authentication routes
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      get 'auth/profile', to: 'auth#profile'

      # Mortgage calculation routes
      post 'mortgage_calculations/calculate', to: 'mortgage_calculations#calculate'
      post 'mortgage_calculations/scenario_comparison', to: 'mortgage_calculations#scenario_comparison'
      resources :mortgage_calculations, only: [:index, :show, :create]

      # Mortgage scenario routes
      resources :mortgage_scenarios do
        collection do
          post :compare
        end
      end
    end
  end

  # Defines the root path route ("/")
  root "rails/health#show"
end
