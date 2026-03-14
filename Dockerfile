# 1. Usar la imagen oficial de PHP 8.2 con Apache integrado
FROM php:8.2-apache

# 2. Habilitar el módulo rewrite de Apache
RUN a2enmod rewrite

# 3. Instalar dependencias del sistema y utilidades
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 4. Instalar las extensiones PHP requeridas
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip xml

# 5. Instalar Composer (Versión 2.x)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 6. Instalar Node.js (Versión 18.x) y NPM
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# 7. Configurar el directorio de trabajo
WORKDIR /var/www/html

# 8. Copiar los archivos locales de tu proyecto al contenedor
COPY . /var/www/html/

# 9. Instalar dependencias de PHP y Node.js
RUN composer install --no-interaction --optimize-autoloader
RUN npm install && npm run build

# 10. Crear script de auto-reparación y arranque (Entrypoint)
# Este bloque automatiza TODO lo que tuvimos que arreglar manualmente.
RUN echo '#!/bin/bash\n\
mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache public/storage resources/lang\n\
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/storage /var/www/html/resources/lang\n\
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/storage /var/www/html/resources/lang\n\
php artisan storage:link || true\n\
sed -i "s|VITE_DEV_SERVER=true|VITE_DEV_SERVER=false|g" .env || true\n\
sed -i "s|APP_URL=http://localhost$|APP_URL=http://localhost:8000|g" .env || true\n\
sed -i "s|ASSET_URL=http://localhost$|ASSET_URL=http://localhost:8000|g" .env || true\n\
php artisan optimize:clear\n\
exec apache2-foreground' > /usr/local/bin/start.sh \
&& chmod +x /usr/local/bin/start.sh

# 11. Exponer el puerto web
EXPOSE 80

# 12. Iniciar usando el script de auto-reparación
CMD ["start.sh"]