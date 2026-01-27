FROM php:8.4-fpm-alpine

RUN apk add --no-cache git curl libpng-dev libxml2-dev zip unzip icu-dev libzip-dev oniguruma-dev \
    && docker-php-ext-install pdo_mysql bcmath zip intl mbstring xml

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

RUN chmod +x /var/www/docker-entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/var/www/docker-entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]