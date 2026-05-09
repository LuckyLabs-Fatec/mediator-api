# Mediator API

O Mediator API é um microserviço de pré-aprovação de ideias de projeto antes da publicação na plataforma. Ele valida as ideias em dois níveis:

1. **Compatibilidade com Curso**: busca no banco de dados o curso melhor alinhado com a descrição da ideia
2. **Parecer Técnico**: consulta o Gemini 2.5 Flash para validar viabilidade de implementação

## 🚀 Como Iniciar

### Pré-requisitos

- **Node.js** 18+ com pnpm
- **PostgreSQL** 12+
- **API Key do Google Gemini** (obter em [console.cloud.google.com](https://console.cloud.google.com))
- **Banco de dados** já existente com a tabela `courses` populada

### Instalação

```bash
# 1. Clone o repositório
cd mediator-api

# 2. Instale as dependências
pnpm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores:
# - API_KEY_GOOGLEGENAI: sua chave do Google Gemini
# - DATABASE_URL: postgresql://user:password@host:port/database
# - PORT: (opcional, padrão 3000)
```

### Inicialização

```bash
# Modo desenvolvimento (com hot-reload)
pnpm dev

# Build para produção
pnpm build

# Iniciar em produção
pnpm start

# Documentação Swagger
# Acesse: http://localhost:3000/docs
```

### Deploy no Render

Se o clone do Render vier sem `pnpm-lock.yaml`, não use `--frozen-lockfile`.

**Build command recomendado:**
```bash
pnpm install --no-frozen-lockfile && pnpm run render-build
```

**Start command:**
```bash
pnpm start
```

**Variáveis obrigatórias no Render:**
- `API_KEY_GOOGLEGENAI`
- `DATABASE_URL`

**Variável opcional recomendada:**
- `CORS_ORIGIN` para liberar o domínio do frontend no Render. Se não for definido, a API responde ao origin da requisição.

## 📊 Fluxo da API

```
Requisição POST /pre-approve
    ↓
[1] Extrair ideia da requisição
    ↓
[2] Buscar curso compatível no banco
    ├─ Se não encontrado: retorna {approved: false, compatible: false, course: null}
    ├─ Se encontrado: continua
    ↓
[3] Consultar Gemini com contexto do curso
    ├─ Parse resposta JSON
    ├─ Fallback a regex se JSON inválido
    ↓
[4] Retornar resultado completo
    {
      "approved": boolean,
      "compatible": boolean,
      "opinion": string,
      "course": {...} | null
    }
```

## 📋 Estrutura da Aplicação

```
src/
├── server.ts                 # Entrada e inicialização do Express
├── app.ts                    # Configuração da aplicação
├── index.ts                  # Export principal
├── config/
│   ├── env.ts               # Variáveis de ambiente validadas
│   └── swagger.ts           # Documentação OpenAPI
├── lib/
│   ├── prisma.ts            # Cliente Prisma com adapter PG
│   └── gemini.ts            # Cliente e parser de respostas Gemini
├── modules/
│   ├── health/              # GET /health
│   ├── course/
│   │   └── course.repository.ts  # Query ao banco com scoring
│   └── pre-approval/
│       ├── preApproval.types.ts
│       ├── preApproval.service.ts         # Lógica de negócio (testável)
│       ├── preApproval.service.default.ts # Inicialização com deps reais
│       ├── preApproval.controller.ts      # Handler HTTP
│       ├── preApproval.route.ts           # Rota e docs Swagger
│       └── preApproval.service.test.ts    # Testes unitários
└── routes/
    └── index.ts             # Agregador de rotas
```

## 🧪 Testes

```bash
# Rodar testes uma vez
pnpm test

# Rodar em modo watch
pnpm test:watch

# Cobertura
pnpm test:coverage
```

Testes cobrem:
- Rejeição quando nenhum curso é encontrado
- Aprovação quando Gemini classifica como compatível

## 🔍 Qualidade de Código

```bash
# Lint
pnpm lint

# Lint com fix automático
pnpm lint:fix
```

## 🗄️ Banco de Dados (Prisma)

```bash
# Gerar cliente Prisma
pnpm prisma:generate

# Criar/aplicar migrations
pnpm prisma:migrate

# Visualizar dados (UI)
pnpm prisma:studio
```

Schema esperado:

```sql
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(60) NOT NULL,
  description text
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id)
);
```

## 📝 Exemplos de Teste

### ⚙️ Cursos Configurados

A API está pré-configurada com dois cursos exemplo:

```json
[
  {
    "id": "e1111111-1111-4111-8111-111111111111",
    "name": "Systems Analysis",
    "description": "Technology projects connected to community needs."
  },
  {
    "id": "e2222222-2222-4222-8222-222222222222",
    "name": "Business Management",
    "description": "Operational and social impact projects."
  }
```bash
curl -X POST http://localhost:3000/pre-approve \

---

### ✅ Teste 1: Compatível com Systems Analysis

**Ideia proposta:** Sistema de rastreamento de demandas tecnológicas comunitárias

**Requisição:**
```bash
curl -X POST http://localhost:3000/pre-approve \
  -H "Content-Type: application/json" \
  -d '{
    "ideaDescription": "Desenvolver plataforma de gerenciamento de demandas tecnológicas para projetos comunitários, conectando organizações não-governamentais com desenvolvedores. A plataforma permitirá cadastro de necessidades e matching com profissionais."
  }'
```

**Resposta Esperada (200 OK):**
```json
{
  "approved": true,
  "compatible": true,
  "opinion": "A ideia está bem alinhada ao curso de Systems Analysis, pois envolve desenvolvimento de um sistema tecnológico conectado a necessidades reais da comunidade. O escopo é viável e bem estruturado.",
  "course": {
    "id": "e1111111-1111-4111-8111-111111111111",
    "name": "Systems Analysis",
    "description": "Technology projects connected to community needs."
  }
}
```

**Por que funciona:** Contém palavras-chave relevantes (technology, community, projects) que fazem match com Systems Analysis.

---

### ✅ Teste 2: Compatível com Business Management

**Ideia proposta:** Dashboard de impacto social para ONGs

**Requisição:**
```bash
curl -X POST http://localhost:3000/pre-approve \
  -H "Content-Type: application/json" \
  -d '{
    "ideaDescription": "Criar um dashboard web para organizações não-governamentais acompanharem o impacto operacional de seus projetos. Incluir métricas de alcance, retorno social, eficiência de recursos e relatórios para stakeholders."
  }'
```

**Resposta Esperada (200 OK):**
```json
{
  "approved": true,
  "compatible": true,
  "opinion": "Excelente alinhamento com Business Management. O projeto combina gestão operacional com análise de impacto social, essencial para organizações. Implementação viável com tecnologias web modernas.",
  "course": {
    "id": "e2222222-2222-4222-8222-222222222222",
    "name": "Business Management",
    "description": "Operational and social impact projects."
  }
}
```

**Por que funciona:** Termos como "operational", "social impact", "gestão", "retorno" fazem match com Business Management.

---

### ❌ Teste 3: Sem compatibilidade

**Ideia proposta:** Receita de bolo de chocolate

**Requisição:**
```bash
curl -X POST http://localhost:3000/pre-approve \
  -H "Content-Type: application/json" \
  -d '{
    "ideaDescription": "Aplicativo para compartilhar receitas de bolos, doces e sobremesas com fotos passo a passo"
  }'
```

**Resposta Esperada (200 OK):**
```json
{
  "approved": false,
  "compatible": false,
  "opinion": "Não foi encontrado curso com descrição compatível para realizar a validação.",
  "course": null
}
```

**Por que falha:** Nenhum dos cursos (Systems Analysis ou Business Management) tem palavras-chave relevantes com "receita", "bolo" ou "culinária".

---

### ⚠️ Teste 4: Erro - Campo obrigatório ausente

**Requisição:**
```bash
curl -X POST http://localhost:3000/pre-approve \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Resposta Esperada (400 Bad Request):**
```json
{
  "error": "ideaDescription é obrigatória."
}
```

---

### 🚨 Teste 5: Erro - API Key Inválida

**Problema:**
```
ApiError: {"error":{"code":400,"message":"API key not valid. Please pass a valid API key."}}
```

**Solução:**
1. Verifique sua API key do Google Gemini em [console.cloud.google.com](https://console.cloud.google.com)
2. Atualize seu arquivo `.env`:
   ```
   GOOGLE_GENAI_API_KEY=sua_chave_valida_aqui
   ```
3. Reinicie o servidor:
   ```bash
   pnpm dev
   ```

```

**Razão**: Nenhum curso no banco tem palavras-chave como "receita", "culinária" ou "francesa". O algoritmo de matching procura por tokens >= 4 caracteres com relevância.

---

### Exemplo 2: Sucesso (Systems Analysis)

**Cenário**: Você tem um curso no banco com:
```sql
INSERT INTO courses (name, description) VALUES (
  'Systems Analysis',
  'Technology projects connected to community needs'
);
```

**Requisição:**
```bash
curl -X POST http://localhost:3000/pre-approve \
  -H "Content-Type: application/json" \
  -d '{
    "ideaDescription": "Desenvolver plataforma de gerenciamento de demandas tecnológicas para projetos comunitários, conectando organizações não-governamentais com desenvolvedores"
  }'
```

**Resposta (200 OK):**
```json
{
  "approved": true,
  "compatible": true,
  "opinion": "A ideia está bem alinhada ao curso Systems Analysis. Trata-se de um projeto tecnológico conectado a necessidades comunitárias, exatamente no escopo descrito. A implementação é viável com equipe adequada e escopo bem definido.",
  "course": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Systems Analysis",
    "description": "Technology projects connected to community needs"
  }
}
```

**Razão**: O texto contém múltiplos tokens relevantes:
- "technology" ✓
- "projects" ✓
- "community" ✓
- "gerenciamento" ✓
- "plataforma" ✓

O curso é encontrado e o Gemini valida a compatibilidade com o contexto do curso.

---

### Exemplo 3: Erro de Validação

**Requisição:**
```bash
curl -X POST http://localhost:3000/pre-approve \
  -H "Content-Type: application/json" \
  -d '{
    "ideaDescription": ""
  }'
```

**Resposta (400 Bad Request):**
---
```json
{
  "error": "ideaDescription é obrigatória."
}
```

---

## 🔗 Endpoints

### GET /health
{
  "approved": boolean,
  "compatible": boolean,
  "opinion": "string",
  "course": {
    "id": "uuid",
    "name": "string",
    "description": "string | null"
  } | null
}
```

**Error Response (400):**
```json
{
  "error": "string"
}
```

Observação: se a consulta ao Gemini falhar por chave inválida ou indisponibilidade, a API usa um fallback local baseado na similaridade com o curso encontrado e ainda responde com 200 quando houver match suficiente.

**Error Response (500):**
```json
{
  "error": "Erro ao processar pré-aprovação."
}
```

---

## 📚 Documentação Interativa

Acesse `http://localhost:3000/docs` para o Swagger UI onde pode testar os endpoints em tempo real.

---

## 🛠️ Stack Técnico

| Aspecto | Tecnologia |
|--------|-----------|
| Runtime | Node.js 18+ |
| Linguagem | TypeScript 6.x |
| Framework Web | Express 5.x |
| ORM | Prisma 7.x |
| IA | Google Gemini 2.5 Flash |
| Testes | Vitest 4.x |
| Lint | ESLint 10.x + TypeScript-ESLint |
| Docs | Swagger/OpenAPI 3.0.3 |
| Banco | PostgreSQL 12+ |

---

## 📦 Variáveis de Ambiente

```env
# Google Gemini API
API_KEY_GOOGLEGENAI=seu_token_aqui

# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Porta (opcional)
PORT=3000
```

---

## 🔒 Notas de Segurança

- Nunca commit `.env` com valores reais
- API Key do Gemini deve estar em `.env` local e variáveis de sistema em produção
- DATABASE_URL não deve ser exposto em logs ou respostas de erro

