require_relative "boot"

require "rails"
# ONLY load what we absolutely need
require "active_model/railtie"
require "active_record/railtie" 
require "action_controller/railtie"
# Skip: active_storage, action_mailer, action_mailbox, action_text, action_view, action_cable

Bundler.require(*Rails.groups)

module MortgageCalculatorApi
  class Application < Rails::Application
    config.load_defaults 8.0
    config.autoload_lib(ignore: %w[assets tasks])
    config.api_only = true
    
    # Disable everything we don't need
    config.action_controller.perform_caching = false
  end
end
