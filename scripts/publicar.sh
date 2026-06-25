#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# NOVUS — Publica atualização no servidor
# Execute no seu Mac após o Claude fazer alterações: bash scripts/publicar.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# Configure aqui o IP ou domínio do seu servidor
SERVIDOR="root@SEU_IP_AQUI"

echo ""
echo "📦 Enviando atualizações para o servidor..."
echo ""

# Verifica se há alterações para enviar
if [ -z "$(git status --porcelain)" ]; then
  echo "⚠️  Nenhuma alteração local detectada."
  echo "   Talvez o deploy já esteja atualizado."
  exit 0
fi

# Mostra o que vai ser enviado
echo "Alterações a publicar:"
git status --short
echo ""

# Pede confirmação
read -p "Confirmar publicação? (s/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo "Cancelado."
  exit 0
fi

# Commit automático com timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
git add -A
git commit -m "deploy: atualização $TIMESTAMP" || true
git push origin main

# Executa o deploy no servidor via SSH
echo ""
echo "🚀 Executando deploy no servidor..."
ssh $SERVIDOR "bash /var/www/novus-app/scripts/deploy.sh"

echo ""
echo "✅ Publicação concluída!"
