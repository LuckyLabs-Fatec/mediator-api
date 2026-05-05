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

## 📝 Exemplos de Uso

### Exemplo 1: Falha (sem curso compatível)

**Requisição:**
```bash
curl -X POST http://localhost:3000/pre-approve \
  -H "Content-Type: application/json" \
  -d '{
    "ideaDescription": "Aplicação para organizar receitas de culinária francesa"
  }'
```

**Resposta (200 OK):**
```json
{
  "approved": false,
  "compatible": false,
  "opinion": "Não foi encontrado curso com descrição compatível para realizar a validação.",
  "course": null
}
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
```json
{
  "error": "ideaDescription é obrigatória."
}
```

---

## 🔗 Endpoints

### GET /health
Verifica disponibilidade da API.

```bash
curl http://localhost:3000/health
```

Resposta:
```json
{ "status": "ok" }
```

### POST /pre-approve
Avalia ideia com base na descrição do curso e parecer do Gemini.

**Request Body:**
```json
{
  "ideaDescription": "string (obrigatório, não vazio)"
}
```

**Success Response (200):**
```json
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

