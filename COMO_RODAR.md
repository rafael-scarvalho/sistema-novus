# Como rodar o NOVUS localmente

## Pré-requisitos
- Node.js 20+ → https://nodejs.org
- PostgreSQL 15+ → https://www.postgresql.org ou via Docker

## 1. Instalar dependências

```bash
npm install
```

## 2. Configurar banco de dados

Crie um banco PostgreSQL:

```sql
CREATE DATABASE novus_vet;
```

Copie o arquivo de variáveis de ambiente:

```bash
cp apps/api/.env.example apps/api/.env
```

Edite `apps/api/.env` com sua senha e dados do banco.

## 3. Rodar as migrations

```bash
npm run db:migrate
```

## 4. Popular o banco com dados iniciais

```bash
npm run db:seed
```

Isso cria:
- Usuário admin: `admin@novusvet.com` / senha: `novus2024`
- Catálogo com 17 itens de cirurgia veterinária

## 5. Iniciar o sistema

```bash
npm run dev
```

Acesse:
- **Sistema:** http://localhost:5173
- **API:** http://localhost:3001
- **Banco (visual):** `npm run db:studio`

---

## Integrações opcionais

### WhatsApp Business (Meta)
1. Crie um app em https://developers.facebook.com
2. Adicione o produto "WhatsApp"
3. Copie o `Access Token` e o `Phone Number ID` para o `.env`
4. Configure o webhook: `POST https://seudominio.com/api/whatsapp/webhook`

### Google Calendar
1. Acesse https://console.cloud.google.com
2. Crie um projeto → ative a "Google Calendar API"
3. Crie credenciais OAuth2 → copie Client ID e Secret para o `.env`

### Portal do Tutor
- Na página de guardiões, gere um link de acesso
- O tutor acessa pelo celular sem precisar de login
- Vê status da cirurgia em tempo real + laudos de exames
