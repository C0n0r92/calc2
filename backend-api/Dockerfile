# Use Ruby 3.2.2 as base image
FROM ruby:3.2.2-slim

# Install system dependencies
RUN apt-get update -qq && \
    apt-get install -yq --no-install-recommends \
      build-essential \
      gnupg2 \
      less \
      git \
      libpq-dev \
      postgresql-client \
      curl \
      nodejs \
      npm && \
    apt-get clean && \
    rm -rf /var/cache/apt/archives/* && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    truncate -s 0 /var/log/*log

# Set working directory
WORKDIR /app

# Copy Gemfile and Gemfile.lock
COPY Gemfile Gemfile.lock ./

# Install Ruby dependencies
RUN bundle config --global frozen 1 && \
    bundle install

# Copy the rest of the application
COPY . .

# Create directories for Rails
RUN mkdir -p tmp/pids log storage

# Precompile assets (if any)
RUN bundle exec rails assets:precompile RAILS_ENV=production || true

# Create a script to run migrations and start the server
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Running database migrations..."\n\
bundle exec rails db:create db:migrate\n\
echo "Starting Rails server..."\n\
exec bundle exec rails server -b 0.0.0.0 -p $PORT' > /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Set environment variables
ENV RAILS_ENV=production
ENV RAILS_SERVE_STATIC_FILES=true
ENV RAILS_LOG_TO_STDOUT=true

# Start the server
CMD ["/app/start.sh"]
