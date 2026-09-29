# Recanto da Lagoa — site + sistema de gestão

Next.js 16 · Prisma 6 (SQLite dev / Postgres prod) · Asaas · ConextBot (WhatsApp oficial Meta) · Pérola (IA Claude).

## Rodar
```bash
cp .env.example .env      # preencha as chaves
npm install
npm run db:push && npm run db:seed
npm run dev               # http://localhost:3000
```

## Mapa
| Rota | O que é |
|---|---|
| `/` | Site premium (hero com água interativa, título de sócio, calculadora, chat Pérola) |
| `/entrar` | Login: Google **ou** código por WhatsApp (via ConextBot) |
| `/painel` | Área do sócio: título, cobranças, dependentes, chat com a Pérola (com contexto do sócio) |
| `/painel/titulo` | Contratação do título → cria cobranças no Asaas |
| `/admin` | Visão geral, leads, títulos, pagamentos, conversas (assumir conversa / responder) |
| `POST /api/webhooks/whatsapp` | Mensagens recebidas do ConextBot → Pérola responde |
| `POST /api/webhooks/asaas` | Atualiza pagamentos; entrada paga ⇒ título ATIVO |

## Configuração
1. **ConextBot**: `CONEXTBOT_API_KEY` (Portal Dev → API Keys). Configure o webhook de mensagens recebidas para
   `{APP_URL}/api/webhooks/whatsapp` com header `x-webhook-secret`. Para o código de login fora da janela de 24h,
   crie/aprove um template de **autenticação** e informe `CONEXTBOT_OTP_TEMPLATE`.
   Sem `CONEXTBOT_API_KEY` em dev, o código aparece no console do servidor.
2. **Google**: crie credencial OAuth; redirect `{APP_URL}/api/auth/google/callback`.
3. **Asaas**: `ASAAS_API_KEY` (sandbox primeiro). Webhook → `{APP_URL}/api/webhooks/asaas`, token em `ASAAS_WEBHOOK_TOKEN`,
   eventos `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`.
4. **IA**: `ANTHROPIC_API_KEY`. A base de conhecimento fica em `src/lib/ai.ts` e os dados do parque em `src/lib/park.ts`.
5. **Admin**: e-mails/telefones em `ADMIN_EMAILS` / `ADMIN_PHONES` viram ADMIN no primeiro login.

## Pendências conhecidas
- Fotos reais do parque (o site usa arte em canvas/gradiente). Coloque em `public/fotos` e me peça para integrar.
- Formato exato do webhook do ConextBot: o parser aceita o padrão Cloud API e `{from,text}`; ajuste em `api/webhooks/whatsapp` se diferir.
- Produção: trocar provider para `postgresql`, definir `APP_URL` e `SESSION_SECRET` fortes.
