# 1. Usar la imagen oficial de PHP 8.2 con Apache integrado
FROM php:8.2-apache

# 2. Habilitar el módulo rewrite de Apache (requerido por el .htaccess de Laravel)
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

# 4. Instalar las extensiones PHP requeridas por la documentación
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

# 9. Instalar dependencias de PHP y Node.js directamente en el contenedor
RUN composer install --no-interaction --optimize-autoloader
RUN npm install && npm run build

# 10. Configurar los permisos exigidos por el instalador
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Nota: Como tienes un index.php en tu directorio raíz, mantendremos el DocumentRoot 
# estándar de Apache en /var/www/html en lugar de /var/www/html/public.

# 11. Exponer el puerto web
EXPOSE 80

# 12. Iniciar Apache en primer plano
CMD ["apache2-foreground"]