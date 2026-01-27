#!/usr/bin/env sh
set -e

cd /var/www

# Ensure Composer deps exist (bind-mount may hide image-built vendor/)
if [ ! -f vendor/autoload.php ]; then
  echo "Installing Composer dependencies..."

  # If Filament isn't declared yet, add it (updates composer.json + composer.lock)
  if ! grep -q '"filament/filament"' composer.json; then
    composer require filament/filament:"^5.0" --no-interaction --prefer-dist
  fi

  composer install --no-interaction --prefer-dist
fi

exec "$@"

