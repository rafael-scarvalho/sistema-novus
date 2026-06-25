#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# NOVUS — Setup inicial do servidor (Ubuntu 22.04)
# Execute UMA VEZ após criar a VPS:  bash setup-servidor.sh seudominio.com.br
# ─────────────────────────────────────────────────────────────────────────────

set -e

DOMAIN=${1:-"seudominio.com.br"}
DB_NAME="novus_db"
DB_USER="novus_user"
DB_PASS=$(openssl rand -base64 24)
APP_DIR="/var/www/novus-app"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     NOVUS — Setup do Servidor            ║"
echo "║     Domínio: $DOMAIN"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Atualiza o sistema ─────────────────────────────────────────────────────
echo "▶ Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Instala Node.js 20 ────────────────────────────────────────────────────
echo "▶ Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# ── 3. Instala PM2 globalmente ────────────────────────────────────────────────
echo "▶ Instalando PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root

# ── 4. Instala PostgreSQL ─────────────────────────────────────────────────────
echo "▶ Instalando PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Cria banco e usuário
sudo -u postgres psql <<SQL
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL

echo ""
echo "  ✅ Banco criado!"
echo "  DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo ""

# ── 5. Instala Nginx ──────────────────────────────────────────────────────────
echo "▶ Instalando Nginx..."
apt-get install -y nginx

# ── 6. Instala Certbot (SSL gratuito Let's Encrypt) ──────────────────────────
echo "▶ Instalando Certbot (SSL)..."
apt-get install -y certbot python3-certbot-nginx

# ── 7. Cria diretórios ───────────────────────────────────────────────────────
echo "▶ Criando diretórios..."
mkdir -p /var/www/novus          # frontend compilado
mkdir -p $APP_DIR                # código-fonte
mkdir -p /var/log/novus          # logs da API
mkdir -p $APP_DIR/apps/api/uploads/patients

# ── 8. Instala Git ───────────────────────────────────────────────────────────
echo "▶ Instalando Git..."
apt-get install -y git

# ── 9. Configura Nginx ───────────────────────────────────────────────────────
echo "▶ Configurando Nginx..."
# Copia config (substituindo o domínio)
sed "s/seudominio.com.br/$DOMAIN/g" $APP_DIR/nginx/novus.conf \
  > /etc/nginx/sites-available/novus
ln -sf /etc/nginx/sites-available/novus /etc/nginx/sites-enabled/novus
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Servidor configurado!                                    ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Próximos passos:                                            ║"
echo "║                                                              ║"
echo "║  1. Aponte o DNS do domínio para o IP desta VPS             ║"
echo "║  2. Execute: certbot --nginx -d $DOMAIN"
echo "║  3. Clone o repositório em: $APP_DIR"
echo "║  4. Copie o .env e execute: bash scripts/deploy.sh          ║"
echo "║                                                              ║"
echo "║  DATABASE_URL salva abaixo — guarde em local seguro:        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo ""
