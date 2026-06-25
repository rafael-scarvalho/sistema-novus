#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# NOVUS — Deploy / Atualização do sistema
# Execute sempre que houver uma atualização: bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

APP_DIR="/var/www/novus-app"
WEB_DIR="/var/www/novus"

echo ""
echo "🚀 NOVUS — Iniciando deploy..."
echo ""

# ── 1. Puxa as últimas alterações do repositório ──────────────────────────────
echo "▶ [1/6] Baixando atualizações..."
cd $APP_DIR
git pull origin main

# ── 2. Instala dependências (somente se package.json mudou) ──────────────────
echo "▶ [2/6] Instalando dependências..."
npm install --workspaces

# ── 3. Aplica migrações do banco de dados ────────────────────────────────────
echo "▶ [3/6] Aplicando migrações do banco..."
cd $APP_DIR/apps/api
npx prisma migrate deploy
npx prisma generate

# ── 4. Compila o frontend React ───────────────────────────────────────────────
echo "▶ [4/6] Compilando frontend..."
cd $APP_DIR/apps/web
npm run build

# Copia arquivos compilados para onde o Nginx serve
echo "  Copiando para /var/www/novus..."
rsync -a --delete dist/ $WEB_DIR/

# ── 5. Reinicia a API ────────────────────────────────────────────────────────
echo "▶ [5/6] Reiniciando API..."
cd $APP_DIR

# Se PM2 já está rodando, faz reload sem downtime; senão inicia
if pm2 list | grep -q "novus-api"; then
  pm2 reload ecosystem.config.cjs --env production
else
  pm2 start ecosystem.config.cjs --env production
  pm2 save
fi

# ── 6. Verifica se está funcionando ──────────────────────────────────────────
echo "▶ [6/6] Verificando..."
sleep 3

if curl -sf http://localhost:3001/api/auth/me > /dev/null 2>&1 || \
   curl -sf http://localhost:3001/api/dashboard > /dev/null 2>&1 || \
   curl -o /dev/null -s -w "%{http_code}" http://localhost:3001 | grep -qE "200|401"; then
  echo ""
  echo "╔══════════════════════════════════════════╗"
  echo "║  ✅ Deploy concluído com sucesso!        ║"
  echo "╚══════════════════════════════════════════╝"
else
  echo ""
  echo "⚠️  API pode não estar respondendo. Verifique:"
  echo "   pm2 logs novus-api"
fi

echo ""
pm2 status
echo ""
