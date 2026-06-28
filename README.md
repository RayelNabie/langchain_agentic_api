# AI Scrum Assistant — Backend

Express + TypeScript backend met een autonome LangChain-agent die productdocumentatie doorzoekt via RAG en taken aanmaakt op een Planka Kanban-bord.

## Stack

- **Runtime**: Node.js 24, TypeScript (ESM, strict)
- **Framework**: Express 5
- **LLM**: Azure OpenAI via `@langchain/openai` — model factory pattern zodat de provider makkelijk te wisselen is
- **RAG**: pgvector (cosine similarity), per-board + globale documenten
- **History**: PostgreSQL via `@langchain/community` `PostgresChatMessageHistory`
- **Kanban**: Planka REST API
- **Docs**: Swagger UI op `/api-docs`
- **Container**: Docker + Docker Compose

## Projectstructuur

```
src/
├── app.ts                        # Entry point (top-level await)
├── data/                         # DB pool, config, chat history, tool logs
├── http/
│   ├── chat/                     # ChatController, routes, types
│   ├── documentation/            # Swagger spec + routes
│   ├── documents/                # Document upload controller + routes
│   └── planka/
│       └── routes.ts             # PlankaHttp base class (HTTP transport)
├── llm/
│   ├── Agent.ts                  # Handmatige LangChain tool loop
│   ├── tools.ts                  # AgentTools: 3 tools
│   ├── azure.ts                  # Azure embeddings + chat model factory
│   ├── systemPrompt.ts           # System prompt builder
│   └── types.ts
├── planka/
│   ├── Planka.ts                 # extends PlankaHttp, business logic
│   └── types.ts
└── rag/
    ├── retriever.ts              # pgvector similarity search
    └── ingest.ts                 # CLI: embed + opslaan in DB
```

## Aan de slag

### Vereisten

- Docker + Docker Compose
- Azure OpenAI resource met een chat model en een embeddings model

### 1. Omgeving configureren

```bash
cp .env.example .env
```

`.env` invullen:

```env
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_INSTANCE_NAME=
AZURE_OPENAI_API_DEPLOYMENT_NAME=
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=
AZURE_OPENAI_API_VERSION=2025-03-01-preview

PLANKA_BASE_URL=http://planka:1337
PLANKA_TOKEN=

DB_HOST=postgres
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
```

### 2. Opstarten (development)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Backend beschikbaar op `http://localhost:3000`. Planka op `http://localhost:3333`.

### 3. Opstarten (productie)

```bash
docker compose up --build
```

### 4. Documenten inladen

```bash
# Zet .txt-bestanden in de documents/ map, dan:
yarn ingest
```

## API

### `POST /chat`

Stuur een prompt naar de LangChain-agent. De agent kiest zelfstandig uit drie tools:
- `search_product_docs` — RAG op productdocumentatie
- `create_planka_task` — user story aanmaken op het Kanban-bord
- `analyze_team_workload` — werklastanalyse per teamlid

| Veld        | Type    | Vereist | Beschrijving                                      |
|-------------|---------|---------|---------------------------------------------------|
| `prompt`    | string  | ja      | Bericht voor de agent                             |
| `sessionId` | string  | nee     | UUID voor persistente chatgeschiedenis            |
| `stream`    | boolean | nee     | `true` = Server-Sent Events, `false` = JSON       |
| `boardId`   | string  | nee     | Planka board-ID (vereist voor Planka-tools)       |
| `listId`    | string  | nee     | Planka lijst-ID voor nieuwe kaarten               |
| `settings`  | object  | nee     | Bepaalt verplichte velden voor story-aanmaak      |

`settings` properties:

| Veld                        | Type    | Beschrijving                                             |
|-----------------------------|---------|----------------------------------------------------------|
| `requireDescription`        | boolean | Agent vraagt beschrijving vóór aanmaken                  |
| `requireAcceptanceCriteria` | boolean | Agent vraagt acceptatiecriteria vóór aanmaken            |
| `requireDueDate`            | boolean | Agent vraagt deadline vóór aanmaken                      |
| `autoAssign`                | boolean | Wijst automatisch het teamlid met minste taken toe       |

**JSON response** (`stream: false`):

```json
{
  "answer": "De story is aangemaakt.",
  "toolCalls": [{ "tool": "create_planka_task", "input": {}, "output": "...", "status": "success" }],
  "sources": [{ "content": "...", "source": "epics.txt" }]
}
```

**SSE response** (`stream: true`): `token` → `tool_start` / `tool_end` paren → `done` → `event: end`

### `POST /documents`

Upload een document als productcontext voor een board.

| Veld      | Type   | Vereist | Beschrijving                                  |
|-----------|--------|---------|-----------------------------------------------|
| `source`  | string | ja      | Bestandsnaam (getoond als bronvermelding)      |
| `content` | string | ja      | Volledige tekst van het document              |
| `boardId` | string | nee     | Board-ID; weglaten voor globale documenten    |

### `GET /api-docs`

Swagger UI met volledige API-documentatie.

## Development

```bash
yarn install
yarn dev        # ts-node + nodemon
yarn build      # tsc
yarn test       # vitest (watch)
yarn test --run # vitest (single run)
```
