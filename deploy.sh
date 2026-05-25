#!/usr/bin/env bash
# deploy.sh — Build et déploie l'app sur le VPS via rsync
# Usage : ./deploy.sh [--skip-build]

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
VPS_USER="root"
VPS_HOST="180.149.196.5"
VPS_PATH="/var/www/html"
LOCAL_DIST="dist"
SSH_KEY="${SSH_KEY:-}"   # optionnel : SSH_KEY=~/.ssh/id_spirit_app ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

SKIP_BUILD=false
for arg in "$@"; do
  [[ "$arg" == "--skip-build" ]] && SKIP_BUILD=true
done

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}   $*"; }
die()  { echo -e "${RED}[error]${NC}  $*" >&2; exit 1; }

# ── 1. Build ─────────────────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == false ]]; then
  log "Build de l'application (expo export -p web)..."
  npm run build
  log "Build terminé."
else
  warn "--skip-build activé : le build est ignoré."
fi

# ── 2. Vérification du dossier dist ──────────────────────────────────────────
[[ -d "$LOCAL_DIST" ]] || die "Le dossier '$LOCAL_DIST' est introuvable. Lancez d'abord : npm run build"
[[ -f "$LOCAL_DIST/index.html" ]] || die "index.html absent dans '$LOCAL_DIST'. Le build semble incomplet."

log "Dossier '$LOCAL_DIST' prêt ($(du -sh "$LOCAL_DIST" | cut -f1))."

# ── 3. Rsync vers le VPS ─────────────────────────────────────────────────────
SSH_OPTS="-o StrictHostKeyChecking=accept-new"
[[ -n "$SSH_KEY" ]] && SSH_OPTS="$SSH_OPTS -i $SSH_KEY"

log "Synchronisation vers ${VPS_USER}@${VPS_HOST}:${VPS_PATH} ..."

rsync -avz --delete \
  --exclude='.DS_Store' \
  --exclude='*.map' \
  -e "ssh $SSH_OPTS" \
  "${LOCAL_DIST}/" \
  "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"

# ── 4. Rechargement Nginx (optionnel) ────────────────────────────────────────
log "Rechargement de Nginx sur le VPS..."
ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" "nginx -t && systemctl reload nginx"

log "Déploiement terminé. Application disponible sur http://${VPS_HOST}"
