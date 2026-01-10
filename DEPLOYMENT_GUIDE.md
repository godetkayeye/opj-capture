# Guide de déploiement sur Hostinger VPS

## 📋 Infos du serveur
- **IP**: 72.61.97.77
- **User**: appuser (ou root selon besoin)
- **OS**: Ubuntu 22.04 LTS
- **Type**: KVM VPS

## 🏗️ Architecture du projet
- **Backend**: Symfony 6.4 (PHP)
- **Frontend**: React + Vite
- **Base de données**: MySQL 8.0

---

## ✅ Étape 1: Préparation du serveur

### Connexion SSH
```bash
ssh root@72.61.97.77
```

### Mise à jour du système
```bash
apt update && apt upgrade -y
```

### Installation des dépendances requises
```bash
# PHP et extensions
apt install -y php8.2-cli php8.2-fpm php8.2-mysql php8.2-curl php8.2-xml php8.2-mbstring php8.2-zip git curl wget

# Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer

# Node.js et npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# MySQL (optionnel si tu as un serveur DB séparé)
apt install -y mysql-server

# Nginx (serveur web)
apt install -y nginx

# SSL (Let's Encrypt)
apt install -y certbot python3-certbot-nginx
```

---

## 📂 Étape 2: Préparation des répertoires

```bash
# Créer le répertoire du projet
mkdir -p /var/www/opj-capture
cd /var/www/opj-capture

# Définir les permissions
chown -R appuser:appuser /var/www/opj-capture
chmod -R 755 /var/www/opj-capture
```

---

## 🚀 Étape 3: Déploiement du code

### Option A: Via Git (Recommandé)
```bash
cd /var/www/opj-capture
git clone https://github.com/godetkayeye/opj-capture.git .
```

### Option B: Via SCP (Si pas de Git public)
```bash
# Sur ta machine locale:
scp -r . root@72.61.97.77:/var/www/opj-capture/
```

---

## ⚙️ Étape 4: Configuration Symfony

### Installation des dépendances PHP
```bash
cd /var/www/opj-capture
composer install --no-dev --optimize-autoloader
```

### Configuration des variables d'environnement
```bash
# Créer le fichier .env.local
nano .env.local
```

Ajoute ceci (adapte les valeurs):
```properties
APP_ENV=prod
APP_DEBUG=false
APP_SECRET=your_secret_key_here

# Base de données
DATABASE_URL="mysql://dbuser:dbpassword@localhost:3306/opj_capture?serverVersion=8.0&charset=utf8mb4"

# CORS pour le frontend
CORS_ALLOW_ORIGIN=^https?://(tondomaine\.com|www\.tondomaine\.com)$
```

### Permissions des répertoires
```bash
chmod -R 775 var/
chmod -R 775 public/
chown -R www-data:www-data var/
chown -R www-data:www-data public/
```

### Créer la base de données
```bash
cd /var/www/opj-capture
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate --no-interaction
```

---

## 🎨 Étape 5: Build du Frontend

```bash
cd /var/www/opj-capture/frontend
npm install
npm run build
```

Les fichiers compilés iront dans `frontend/dist/`

---

## 🔧 Étape 6: Configuration Nginx

### Créer le fichier de configuration
```bash
nano /etc/nginx/sites-available/opj-capture
```

Ajoute ceci:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tondomaine.com www.tondomaine.com;

    root /var/www/opj-capture/public;
    index index.php;

    # Logs
    access_log /var/log/nginx/opj-capture_access.log;
    error_log /var/log/nginx/opj-capture_error.log;

    # Frontend static files
    location ~* ^/(dist|assets|vendor)/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # PHP FPM
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Réicrire pour Symfony
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Bloquer les fichiers sensibles
    location ~ /\.env {
        deny all;
    }

    location ~ /composer\.json {
        deny all;
    }
}
```

### Activer la configuration
```bash
ln -s /etc/nginx/sites-available/opj-capture /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 🔒 Étape 7: SSL avec Let's Encrypt

```bash
certbot --nginx -d tondomaine.com -d www.tondomaine.com
```

---

## 🗄️ Étape 8: Configuration MySQL

```bash
# Se connecter à MySQL
mysql -u root -p

# Créer l'utilisateur et la BD
CREATE DATABASE opj_capture;
CREATE USER 'dbuser'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON opj_capture.* TO 'dbuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 🔄 Étape 9: Services systemd

### PHP-FPM
```bash
systemctl start php8.2-fpm
systemctl enable php8.2-fpm
```

### Nginx
```bash
systemctl start nginx
systemctl enable nginx
```

### MySQL
```bash
systemctl start mysql
systemctl enable mysql
```

---

## 🚀 Étape 10: Déploiement automatisé (Optionnel)

Crée un script de déploiement `/var/www/opj-capture/deploy.sh`:

```bash
#!/bin/bash
cd /var/www/opj-capture

# Pull les changements
git pull origin main

# Backend
composer install --no-dev --optimize-autoloader
php bin/console cache:clear
php bin/console doctrine:migrations:migrate --no-interaction

# Frontend
cd frontend
npm install
npm run build
cd ..

# Permissions
chmod -R 775 var/
chown -R www-data:www-data var/ public/

echo "✅ Déploiement terminé!"
```

Rendre exécutable:
```bash
chmod +x deploy.sh
```

---

## 🧪 Tests de vérification

```bash
# Vérifier Symfony
curl http://tondomaine.com

# Vérifier les logs
tail -f /var/log/nginx/opj-capture_error.log
tail -f /var/log/nginx/opj-capture_access.log

# Vérifier PHP-FPM
systemctl status php8.2-fpm

# Vérifier Nginx
systemctl status nginx
```

---

## 📝 Checklist finale

- [ ] SSH configuré
- [ ] Dépendances installées (PHP, Node, Composer, Nginx)
- [ ] Code cloné/uploadé
- [ ] `.env.local` configuré avec DB credentials
- [ ] Migrations Doctrine exécutées
- [ ] Frontend buildé
- [ ] Nginx configuré
- [ ] SSL activé
- [ ] Permissions correctes
- [ ] Services démarrés et activés

---

## 🆘 Dépannage

### Erreur 502 Bad Gateway
```bash
systemctl restart php8.2-fpm
systemctl restart nginx
```

### Permission denied on var/
```bash
chown -R www-data:www-data /var/www/opj-capture/var/
chmod -R 775 /var/www/opj-capture/var/
```

### Erreur de base de données
```bash
# Vérifier la connexion MySQL
mysql -u dbuser -p opj_capture
```

---

## 📞 Besoin d'aide?

Utilise ce guide étape par étape et fais-moi signe si tu blockes sur une partie spécifique!
