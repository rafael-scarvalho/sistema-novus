#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   NOVUS — Instalação Automática      ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Verifica Homebrew
if ! command -v brew &>/dev/null; then
  echo "❌ Homebrew não encontrado."
  echo "   Instale primeiro em: https://brew.sh"
  echo "   Comando: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
  exit 1
fi

echo "✅ Homebrew encontrado"

# Node.js
if ! command -v node &>/dev/null; then
  echo "📦 Instalando Node.js 20..."
  brew install node@20
  echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
  export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
else
  echo "✅ Node.js já instalado: $(node --version)"
fi

# PostgreSQL
if ! command -v psql &>/dev/null; then
  echo "📦 Instalando PostgreSQL 15..."
  brew install postgresql@15
  brew services start postgresql@15
  echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
  export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
  sleep 3
  createdb novus_vet 2>/dev/null || echo "Banco novus_vet já existe"
else
  echo "✅ PostgreSQL já instalado"
  createdb novus_vet 2>/dev/null || echo "Banco novus_vet já existe"
fi

echo ""
echo "📁 Entrando na pasta do projeto..."
cd "$(dirname "$0")"

# Cria o .env se não existir
if [ ! -f apps/api/.env ]; then
  echo "⚙️  Criando arquivo .env..."
  cp apps/api/.env.example apps/api/.env
  # Preenche automaticamente com usuário atual do sistema
  PGUSER=$(whoami)
  sed -i '' "s|postgresql://user:password@localhost:5432/novus_vet|postgresql://${PGUSER}@localhost:5432/novus_vet|g" apps/api/.env
fi

echo ""
echo "📦 Instalando dependências (pode levar 2-3 min)..."
npm install

echo ""
echo "🗄️  Criando tabelas no banco de dados..."
npm run db:migrate -- --name init

echo ""
echo "🌱 Populando catálogo e usuário inicial..."
npm run db:seed

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   ✅ Instalação concluída!           ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Para iniciar o sistema, execute:"
echo "  npm run dev"
echo ""
echo "Depois abra: http://localhost:5173"
echo ""
echo "Login inicial:"
echo "  E-mail: admin@novusvet.com"
echo "  Senha:  novus2024"
echo ""
