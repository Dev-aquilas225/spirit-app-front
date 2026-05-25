#!/usr/bin/env bash
# vps-setup.sh — Setup initial du VPS pour héberger l'app (à exécuter UNE SEULE FOIS)
# Usage depuis Termux ou ton PC : bash vps-setup.sh
# Prérequis : être connecté en SSH sur le VPS en tant que root

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }
die()  { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }
step() { echo -e "\n${BLUE}══ $* ══${NC}"; }

[[ $EUID -ne 0 ]] && die "Ce script doit être exécuté en tant que root (sudo bash vps-setup.sh)"

# ── 1. Mise à jour système ────────────────────────────────────────────────────
step "1/6 Mise à jour du système"
apt update && apt upgrade -y
log "Système à jour."

# ── 2. Installation Nginx ─────────────────────────────────────────────────────
step "2/6 Installation de Nginx"
apt install -y nginx
systemctl enable nginx
systemctl start nginx
log "Nginx installé et démarré."

# ── 3. Dossier de déploiement ─────────────────────────────────────────────────
step "3/6 Création du dossier /var/www/html"
mkdir -p /var/www/html
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
# Permettre à root (utilisé par rsync) d'écrire dans le dossier
setfacl -R -m u:root:rwx /var/www/html 2>/dev/null || chmod -R 777 /var/www/html
log "Dossier prêt."

# ── 4. Configuration Nginx ────────────────────────────────────────────────────
step "4/6 Configuration Nginx"
NGINX_CONF="/etc/nginx/sites-available/spirit-app"

cat > "$NGINX_CONF" << 'NGINX'
server {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/javascript application/javascript application/json application/manifest+json image/svg+xml;

    location = /manifest.json {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Content-Type "application/manifest+json";
        expires 0;
    }

    location = /service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
        access_log off;
    }

    location = /expo-service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
        access_log off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|mp4|webm)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header X-XSS-Protection "1; mode=block";

    access_log /var/log/nginx/spirit-app.access.log;
    error_log  /var/log/nginx/spirit-app.error.log warn;
}
NGINX

# Activer le site, désactiver le default
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/spirit-app
rm -f /etc/nginx/sites-enabled/default

# Tester et recharger
nginx -t && systemctl reload nginx
log "Nginx configuré."

# ── 5. Clé SSH GitHub Actions ─────────────────────────────────────────────────
step "5/6 Clé SSH pour GitHub Actions"
SSH_DIR="/root/.ssh"
KEY_FILE="$SSH_DIR/id_github_actions"

mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

if [[ ! -f "$KEY_FILE" ]]; then
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$KEY_FILE" -N ""
    log "Clé SSH générée : $KEY_FILE"
else
    warn "Clé SSH déjà existante, on la réutilise."
fi

# Autoriser la clé publique à se connecter
if ! grep -qF "$(cat ${KEY_FILE}.pub)" "$SSH_DIR/authorized_keys" 2>/dev/null; then
    cat "${KEY_FILE}.pub" >> "$SSH_DIR/authorized_keys"
    chmod 600 "$SSH_DIR/authorized_keys"
    log "Clé publique ajoutée à authorized_keys."
fi

echo ""
echo -e "${YELLOW}══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  COPIE cette clé privée dans GitHub Secret 'VPS_SSH_PRIVATE_KEY'${NC}"
echo -e "${YELLOW}══════════════════════════════════════════════════════════════${NC}"
cat "$KEY_FILE"
echo -e "${YELLOW}══════════════════════════════════════════════════════════════${NC}"

# ── 6. Résumé ─────────────────────────────────────────────────────────────────
step "6/6 Résumé"
log "Setup terminé. Récapitulatif des GitHub Secrets à configurer :"
echo ""
echo "  VPS_SSH_PRIVATE_KEY  → contenu affiché ci-dessus (clé privée)"
echo "  VPS_HOST             → $(hostname -I | awk '{print $1}')"
echo "  VPS_USER             → root"
echo "  VPS_PATH             → /var/www/html"
echo ""
echo "  Variables d'environnement de l'app (optionnel si déjà dans le code) :"
echo "  EXPO_PUBLIC_API_BASE_URL"
echo "  EXPO_PUBLIC_APP_URL"
echo "  EXPO_PUBLIC_ADMIN_EMAIL"
echo "  EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB"
echo ""
log "Nginx status : $(systemctl is-active nginx)"
log "Site accessible sur : http://$(hostname -I | awk '{print $1}')"
