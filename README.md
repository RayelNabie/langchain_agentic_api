# langchain_llm_api

Express + TypeScript backend that exposes a `/chat` endpoint with modular support for Azure OpenAI via LangChain. Modularity is achieved by using a Adapter pattern, makes changing to another LLM like claude easier since the abstractionlayer ensures the logic doesnt need changing, only the adapter. Supports single-turn chat, streaming, and session-based conversation history stored in PostgreSQL.

## Stack

- **Runtime**: Node.js 24, TypeScript (ESM)
- **Framework**: Express 5
- **LLM**: Azure OpenAI via `@langchain/openai`
- **History**: PostgreSQL (`@langchain/community` `PostgresChatMessageHistory`)
- **Docs**: Swagger UI at `/api-docs`
- **Tests**: Vitest
- **Container**: Docker + Docker Compose (dev + prod)

## Project structure

```
src/
├── app.ts                          # Entry point
├── data/                           # DB connection, config, chat history
├── http/
│   ├── chat/                       # ChatController + routes
│   ├── documentation/              # Swagger spec + routes
│   └── routes.ts                   # Root router
├── llm/
│   ├── factories/azure/            # Azure OpenAI factory
│   ├── LangChainAdapter.ts         # LlmAdapter implementation
│   └── types.ts                    # LlmAdapter interface
└── services/
    └── ChatService.ts              # Thin facade over LlmAdapter
```

## Getting started

### Prerequisites

- Docker + Docker Compose
- An Azure OpenAI resource with a deployed chat model

### 1. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_INSTANCE_NAME=
AZURE_OPENAI_API_DEPLOYMENT_NAME=
AZURE_OPENAI_API_VERSION=2025-03-01-preview
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=

DB_HOST=postgres
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
```

### 2. Run (development)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Hot-reload via nodemon. App available at `http://localhost:3000`.

### 3. Run (production)

```bash
docker compose up --build
```

## API

### `POST /chat`

| Field       | Type    | Required | Description                    |
| ----------- | ------- | -------- | ------------------------------ |
| `prompt`    | string  | yes      | The message to send            |
| `sessionId` | string  | no       | Session ID to maintain history |
| `stream`    | boolean | no       | Stream response via SSE        |

**JSON response**

```json
{
  "answer": "...",
  "metadata": {},
  "usage": { "input_tokens": 10, "output_tokens": 42, "total_tokens": 52 }
}
```

**Streaming response** (`stream: true`)

```
data: {"content":"The","metadata":{}}
data: {"content":" answer","metadata":{}}
event: end
data: [DONE]
```

### `GET /api-docs`

Swagger UI.

### `GET /api-docs.json`

Raw OpenAPI JSON.

## Development

```bash
yarn install
yarn dev        # nodemon + ts-node
yarn build      # tsc
yarn lint       # eslint
yarn test       # vitest (watch)
yarn test run   # vitest (single run)
```

## License

MIT
