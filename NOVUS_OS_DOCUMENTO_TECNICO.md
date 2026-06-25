# NOVUS OS — Documento Técnico Completo
**Versão:** 1.0  
**Data:** Junho 2026  
**Status:** Base para Desenvolvimento

---

## Visão Geral

**NOVUS OS** é uma plataforma SaaS completa para gestão de uma empresa de cirurgia veterinária avançada que opera como equipe cirúrgica itinerante em hospitais e clínicas parceiras.

**Missão:** Centralizar toda a operação cirúrgica — do primeiro contato ao pós-operatório — em um sistema único, escalável e premium.

**Visão de longo prazo:** Tornar-se referência nacional em cirurgia veterinária avançada, com dados clínicos e educação como pilares de expansão.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend Web | Next.js + TypeScript + Tailwind CSS + Shadcn/UI |
| Backend | Node.js + NestJS |
| Banco de dados | PostgreSQL |
| Storage | AWS S3 |
| Autenticação | Clerk (ou Auth0) |
| Notificações | WhatsApp API + Email + SMS |
| Tempo real | WebSocket (Socket.io via NestJS) |
| Infraestrutura | Docker + AWS |
| App Mobile | PWA (fase 2) → React Native (fase 3) |

---

## Perfis de Usuário (RBAC)

| Role | Acesso principal |
|---|---|
| Super Admin | Acesso total ao sistema |
| CEO | Dashboards, financeiro, analytics |
| Cirurgião | Casos, planejamento, procedimentos, live tracker |
| Auxiliar Cirúrgico | Atualização de status, checklist, live tracker |
| Administrativo | CRM, agendamento, parceiros, orçamentos |
| Financeiro | Centro financeiro, relatórios |
| Veterinário Referente | Portal do parceiro, casos enviados |
| Hospital Parceiro | Dashboard de casos na unidade |
| Tutor (Responsável) | Portal do tutor, live tracker, documentos |

---

## Roadmap de Desenvolvimento

### Fase 1 — MVP (0 a 4 meses)
> Base operacional para funcionar no dia a dia

- Módulo 1: Gestão de Pacientes
- Módulo 3: CRM Cirúrgico (Kanban)
- Módulo 5: Motor de Orçamentos
- Módulo 11: Live Tracker Cirúrgico
- Infraestrutura: Auth + Roles + Notificações + S3

### Fase 2 — Crescimento (4 a 9 meses)
> Diferenciação competitiva e retenção de parceiros

- Módulo 2: Portal do Tutor
- Módulo 4: Planejamento Cirúrgico
- Módulo 6: Rede de Parceiros
- Módulo 7: Pós-operatório Inteligente
- Módulo 8: Centro Financeiro
- Módulo 12: Agenda Cirúrgica
- Módulo 13: Gestão de OPME e Materiais

### Fase 3 — Escala (9 a 18 meses)
> Inteligência de dados e posicionamento nacional

- Módulo 9: Surgical Intelligence (Data Warehouse)
- Módulo 10: Plataforma Educacional
- Módulo 14: App Mobile Nativo (React Native)
- Módulo 15: Integração com sistemas de hospitais parceiros

---

## Módulo 1 — Gestão de Pacientes

**Objetivo:** Centralizar todo o histórico clínico do animal.

### Funcionalidades
- Perfil completo do paciente: nome, espécie, raça, sexo, peso, idade, microchip
- Histórico médico completo com linha do tempo
- Upload e organização de: exames laboratoriais, imagens diagnósticas (raio-x, ultrassom, TC), histopatologia, culturas, vídeos cirúrgicos
- Documentos clínicos e relatórios
- Vinculação com tutor, veterinário referente e hospital parceiro
- Notas de acompanhamento
- Histórico cirúrgico completo

### Regras de negócio
- Um paciente pode ter múltiplos casos cirúrgicos ao longo do tempo
- Arquivos de imagem e vídeo armazenados no AWS S3 com URL assinada temporária
- Acesso ao prontuário segmentado por role (tutor vê resumo; cirurgião vê tudo)

---

## Módulo 2 — Portal do Tutor

**Objetivo:** Criar uma experiência premium para o responsável do animal.

### Funcionalidades
- Dashboard com status do animal e próximos procedimentos
- **Live Tracker** integrado (ver Módulo 11)
- Acesso a exames, documentos e laudos
- Faturas e formas de pagamento
- Termos de consentimento para assinatura digital
- Plano de tratamento e recuperação
- Central de mensagens com a equipe
- Upload de fotos e vídeos do animal (pós-op em casa)
- Notificações push e WhatsApp
- Relatórios cirúrgicos simplificados (linguagem acessível)
- Conteúdo educativo sobre o procedimento realizado
- Marcos de recuperação (checklist pós-operatório domiciliar)

### Regras de negócio
- Tutor acessa apenas dados do(s) seu(s) animal(is)
- Linguagem sempre acessível — termos técnicos são traduzidos para o portal do tutor
- Notificações automáticas a cada mudança de status

---

## Módulo 3 — CRM Cirúrgico

**Objetivo:** Gerenciar o pipeline completo de cada caso cirúrgico.

### Pipeline (Kanban)

```
Novo Caso
    ↓
Triagem Clínica
    ↓
Análise de Exames
    ↓
Planejamento Cirúrgico
    ↓
Orçamento
    ↓
Aprovação
    ↓
Agendamento
    ↓
Cirurgia
    ↓
Internação
    ↓
Alta
    ↓
Acompanhamento
    ↓
Concluído
```

### Funcionalidades
- Board Kanban visual com drag and drop
- Filtros por espécie, procedimento, hospital, cirurgião, urgência
- Tags personalizáveis
- Níveis de prioridade (eletivo, urgência, emergência)
- Histórico de movimentações de cada card
- Comentários internos por caso
- Vinculação com orçamento, agenda e live tracker

---

## Módulo 4 — Planejamento Cirúrgico

**Objetivo:** Padronizar os fluxos de trabalho para cada tipo de procedimento.

### Procedimentos com workflow padrão
- Ovariectomia Laparoscópica
- Colecistectomia Laparoscópica
- PCCL
- Toracoscopia
- Bypass Ureteral
- Nefroscopia
- Adrenalectomia
- Ureteroneocistostomia
- Procedimentos customizados

### Para cada procedimento
- Checklist pré-operatório
- Equipamentos necessários (lista com disponibilidade)
- Equipe necessária (funções e quantidade)
- Tempo estimado de cirurgia
- Protocolo anestésico sugerido
- Template de notas cirúrgicas
- Protocolo pós-operatório padrão
- Registro de complicações

---

## Módulo 5 — Motor de Orçamentos

**Objetivo:** Gerar orçamentos precisos, rápidos e profissionais.

### Entradas
- Procedimento selecionado
- Hospital onde será realizado
- Materiais e insumos
- Implantes e OPME
- Custos de deslocamento da equipe
- Equipamentos especiais
- Taxa de emergência (se aplicável)

### Saídas
- Honorário NOVUS
- Taxa do hospital parceiro
- Preço total
- Simulação de parcelamento
- Geração automática de PDF com layout premium
- Envio por WhatsApp/email
- Assinatura digital pelo tutor

### Regras de negócio
- Tabela de preços por procedimento configurável pelo admin
- Histórico de orçamentos por caso
- Orçamento aprovado trava os valores e avança o CRM automaticamente

---

## Módulo 6 — Rede de Parceiros

**Objetivo:** Gerenciar e nutrir relacionamento com hospitais e veterinários referentes.

### Hospitais Parceiros
- Cadastro completo: endereço, salas disponíveis, equipamentos, contatos
- Histórico de casos realizados na unidade
- Receita gerada por hospital
- Taxa de conversão de casos
- Relatório mensal automático
- Dashboard do hospital (acesso restrito ao parceiro)

### Veterinários Referentes
- Cadastro com CRMV
- Casos enviados por referente
- Taxa de conversão e retorno
- Ranking de top referentes
- Relatório mensal de performance
- Portal do referente com acesso aos casos que enviou

---

## Módulo 7 — Pós-operatório Inteligente

**Objetivo:** Automatizar o acompanhamento após a alta e detectar complicações precocemente.

### Follow-up automático
- 24 horas após a alta
- 48 horas
- 7 dias
- 14 dias
- 30 dias

### Questionário enviado ao tutor (WhatsApp/app)
- Nível de dor percebida (0–10)
- Apetite
- Vômito
- Urinando normalmente
- Defecando normalmente
- Foto da incisão cirúrgica
- Campo aberto para observações

### Classificação automática de risco
| Cor | Significado | Ação |
|---|---|---|
| 🟢 Verde | Recuperação dentro do esperado | Nenhuma ação necessária |
| 🟡 Amarelo | Sinal de atenção | Notificação ao cirurgião para avaliar |
| 🔴 Vermelho | Possível complicação | Alerta imediato ao cirurgião |

### Regras de negócio
- Algoritmo de classificação configurável por procedimento
- Cirurgião notificado via push + WhatsApp em casos amarelos e vermelhos
- Todas as respostas registradas no prontuário do animal

---

## Módulo 8 — Centro Financeiro

**Objetivo:** Visibilidade financeira completa da operação.

### Funcionalidades
- Receitas por período, hospital, procedimento e cirurgião
- Despesas operacionais
- Contas a receber e a pagar
- Fluxo de caixa
- Rentabilidade por procedimento
- Rentabilidade por hospital parceiro
- Produtividade por cirurgião
- KPIs mensais
- Exportação de relatórios (PDF e Excel)

---

## Módulo 9 — Surgical Intelligence

**Objetivo:** Transformar dados clínicos em inteligência para melhoria contínua.

### Métricas rastreadas
- Taxa de complicações por procedimento
- Tempo médio de cirurgia
- Tempo de internação
- Taxa de readmissão
- Mortalidade
- Reintervenções
- Outcomes clínicos (escores de recuperação)
- Conversão de casos (CRM)

### Entregáveis
- Dashboards interativos para CEO e Cirurgião
- Relatórios periódicos automatizados
- Comparativo entre períodos
- Base para publicações científicas e educação

---

## Módulo 10 — Plataforma Educacional

**Objetivo:** Posicionar NOVUS como referência nacional em educação cirúrgica veterinária.

### Funcionalidades
- Cursos online com certificado
- Programa de mentoria
- Biblioteca cirúrgica com vídeos de procedimentos
- Plataforma de vídeo própria (ou integração Vimeo/Panda)
- Conteúdo exclusivo para veterinários parceiros
- Trilhas de aprendizado por especialidade
- Emissão de certificados digitais

---

## Módulo 11 — Surgical Live Tracker ⭐ NOVO

**Objetivo:** Oferecer transparência total ao tutor sobre o status do animal durante o procedimento.

### Fases exibidas ao tutor

| Fase interna | Linguagem exibida ao tutor |
|---|---|
| Pré-Operatório | **"Preparando [nome do animal] para a cirurgia"** |
| Acesso Cirúrgico | **"Cirurgia iniciada"** |
| Transcirúrgico | **"Procedimento em andamento — tudo dentro do esperado"** |
| Pós-Operatório Imediato | **"Cirurgia concluída — [nome] está em recuperação"** |
| Pronto para Alta | **"[nome] está pronto! Você já pode vir buscá-lo 🐾"** |

> A equipe interna visualiza a nomenclatura técnica. O tutor sempre vê a versão humanizada.

### Forma de atualização
- **iPad com botões grandes** posicionado na sala cirúrgica ou área adjacente
- Interface dedicada: tela simples com os 5 botões de fase, acionada pelo auxiliar ou anestesista
- Sem necessidade de login a cada atualização — sessão persistente no dispositivo da sala
- Confirmação com 1 toque + 1 confirmação (evitar acionamento acidental)

### Comportamento do sistema
- Cada mudança de fase dispara automaticamente:
  - Notificação push para o app do tutor
  - Mensagem WhatsApp personalizada com o nome do animal
  - Registro com timestamp no prontuário do caso
- Atualização em tempo real via WebSocket (sem necessidade de recarregar a página)
- O tutor vê uma linha do tempo visual com fases concluídas, fase atual e fases pendentes com horário estimado

### Regras de negócio
- Fases só avançam — não é possível voltar (requer permissão de admin para correção)
- Horário estimado de cada fase calculado com base no procedimento e histórico
- O cirurgião pode adicionar uma mensagem personalizada opcional ao tutor a qualquer momento

---

## Módulo 12 — Agenda Cirúrgica ⭐ NOVO

**Objetivo:** Gerenciar deslocamentos, disponibilidade de sala e equipe de forma inteligente.

### Funcionalidades
- Calendário visual por dia, semana e mês
- Agendamento vinculado ao hospital parceiro e sala disponível
- Controle de disponibilidade da equipe cirúrgica
- Cálculo de tempo de deslocamento entre hospitais
- Bloqueio de datas e horários
- Alertas de conflito de agenda
- Integração automática com o CRM (quando caso é aprovado, vai para a agenda)
- Notificação da equipe via WhatsApp ao confirmar agenda

---

## Módulo 13 — Gestão de OPME e Materiais ⭐ NOVO

**Objetivo:** Rastrear órteses, próteses, materiais especiais e insumos por procedimento.

### Funcionalidades
- Cadastro de materiais e implantes com fornecedor e custo
- Vinculação de materiais ao planejamento cirúrgico e orçamento
- Rastreabilidade por lote e número de série (exigência CFV)
- Controle de estoque mínimo com alertas
- Histórico de materiais utilizados por procedimento
- Relatório de custo de materiais por caso
- Integração com o Centro Financeiro (Módulo 8)

---

## Módulo 14 — Consentimento Digital via WhatsApp ⭐ NOVO

**Objetivo:** Permitir assinatura de termos de consentimento sem instalar app.

### Fluxo
1. Sistema gera o termo de consentimento em PDF
2. Link é enviado ao tutor via WhatsApp
3. Tutor acessa link no celular, lê o documento
4. Confirma identidade com CPF + data de nascimento
5. Assina digitalmente com o dedo na tela
6. PDF assinado é gerado e armazenado no prontuário
7. Cópia enviada ao tutor por email e WhatsApp

### Validade jurídica
- Registro de IP, data/hora e hash do documento
- Compatível com MP 2.200-2/2001 (ICP-Brasil para documentos simples)

---

## Arquitetura Técnica (Visão Geral)

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                   │
│  Portal Web Admin  │  Portal Tutor  │  Portal Parceiro  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS + WebSocket
┌──────────────────────────▼──────────────────────────────┐
│                    BACKEND (NestJS)                       │
│  API REST  │  WebSocket Gateway  │  Queue (Bull/Redis)  │
└──────┬──────────────┬───────────────────┬───────────────┘
       │              │                   │
  ┌────▼────┐   ┌─────▼──────┐   ┌───────▼───────┐
  │PostgreSQL│   │  AWS S3    │   │  WhatsApp API │
  │         │   │  (arquivos)│   │  Email / SMS  │
  └─────────┘   └────────────┘   └───────────────┘
```

### Princípios de arquitetura
- **Multi-tenant:** cada empresa é um tenant isolado (preparado para vender o sistema a outras empresas no futuro)
- **API-first:** todo o frontend consome a mesma API REST, facilitando app mobile no futuro
- **Event-driven:** mudanças de status disparam eventos que acionam notificações e registros automaticamente
- **Escalabilidade horizontal:** serviços stateless prontos para auto-scaling na AWS

---

## Schema de Banco de Dados (Entidades Principais)

```sql
-- Pacientes
patients (id, name, species, breed, sex, weight, age, microchip, owner_id, created_at)

-- Tutores
owners (id, name, email, phone, cpf, address, created_at)

-- Casos Cirúrgicos
cases (id, patient_id, status, pipeline_stage, priority, referring_vet_id, hospital_id, created_at)

-- Procedimentos
procedures (id, case_id, type, scheduled_at, surgeon_id, duration_estimated, duration_actual, notes, created_at)

-- Live Tracker
surgical_status_logs (id, procedure_id, phase, phase_label_tutor, updated_by, updated_at, custom_message)

-- Orçamentos
quotes (id, case_id, procedure_type, hospital_id, materials_cost, implants_cost, travel_cost, novus_fee, total, status, signed_at)

-- Hospitais Parceiros
hospitals (id, name, address, city, state, contact_name, contact_phone, active)

-- Veterinários Referentes
referring_vets (id, name, crmv, email, phone, clinic_name, hospital_id)

-- Pós-operatório
followup_responses (id, case_id, sent_at, responded_at, pain_score, appetite, vomiting, urination, defecation, incision_photo_url, notes, risk_level)

-- Materiais / OPME
materials (id, name, supplier, unit_cost, category, stock_quantity, min_stock)
procedure_materials (id, procedure_id, material_id, quantity, batch_number, serial_number)

-- Financeiro
transactions (id, type, amount, category, case_id, description, date, created_by)
```

---

## Notificações Automáticas (Mapa Completo)

| Gatilho | Canal | Destinatário |
|---|---|---|
| Caso criado no CRM | Email | Administrativo |
| Orçamento enviado | WhatsApp + Email | Tutor |
| Orçamento aprovado | Push + Email | Cirurgião + Administrativo |
| Cirurgia agendada | WhatsApp | Tutor + Equipe + Hospital |
| Fase do Live Tracker atualizada | Push + WhatsApp | Tutor |
| Cirurgia concluída | WhatsApp | Tutor |
| Alta liberada | Push + WhatsApp + Email | Tutor |
| Follow-up pós-op (24h, 48h, 7d...) | WhatsApp | Tutor |
| Resposta pós-op Amarela | Push | Cirurgião |
| Resposta pós-op Vermelha | Push + WhatsApp | Cirurgião |
| Estoque de material abaixo do mínimo | Email | Administrativo |

---

## Design System

**Inspirações visuais:** Apple · Linear · Stripe · Notion

**Paleta de cores:**
- Background: `#0a0a0a` (dark) / `#ffffff` (light)
- Primária: `#4ade80` (Surgical Green)
- Texto principal: `#ffffff` / `#0a0a0a`
- Texto secundário: `#888888`
- Bordas: `#1e1e1e`
- Alerta amarelo: `#f59e0b`
- Alerta vermelho: `#ef4444`
- Roxo (educação/escala): `#a78bfa`

**Princípios:**
- Premium, minimalista, médico, profissional
- Zero estilo cartoon ou pet-friendly infantil
- Tipografia clean com hierarquia clara
- Dark mode como padrão; light mode disponível

---

## MVP — Escopo Mínimo para Lançamento

### O que entra no MVP
1. Autenticação com roles (Super Admin, Cirurgião, Auxiliar, Administrativo, Tutor)
2. Cadastro de pacientes e tutores
3. CRM Kanban (pipeline de casos)
4. Motor de orçamentos com geração de PDF
5. Surgical Live Tracker com iPad
6. Notificações WhatsApp automáticas

### O que fica para depois
- Módulos financeiros avançados
- Analytics e data warehouse
- Plataforma educacional
- App mobile nativo
- Integração com sistemas de hospitais

### Critério de sucesso do MVP
> A equipe consegue receber um caso, criar o paciente, gerar e enviar o orçamento, agendar, atualizar o status em tempo real durante a cirurgia e o tutor acompanha tudo pelo celular — sem usar WhatsApp manual para nenhuma dessas etapas.

---

*Documento gerado em Junho de 2026 — NOVUS OS v1.0*
