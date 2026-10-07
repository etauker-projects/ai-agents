# ai-agents

A hello-world AI agent: a Node.js/TypeScript backend running an agent built on the
[Vercel AI SDK](https://ai-sdk.dev), and a minimal React chat interface.

The agent streams its reply, calls tools, and the UI renders both the text and the
tool invocations — so the agent loop is visible rather than implied.

```
server/   Hono HTTP server, the agent, and its tools
web/      Vite + React chat UI (useChat)
```

## Setup

Requires **Node 22+** (`ai@7` declares `engines: node >=22`). With nvm:

```sh
nvm use          # picks up .nvmrc
```

Then:

```sh
cp .env.example .env    # add your ANTHROPIC_API_KEY
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend on
port 3000, so there is no CORS configuration to deal with.

To run the two halves separately: `npm run dev:server` / `npm run dev:web`.

## Checking the backend without the UI

```sh
curl -N -X POST localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"What is 17 * 23?"}]}]}'
```

You should see a chunked SSE stream containing tool-call and tool-result events.

## Where to go next

- **Add a tool** — `server/src/tools.ts`. Define it with `tool({ description, inputSchema, execute })`
  and register it in the `tools` map in `server/src/agent.ts`. The UI needs a matching
  `tool-<name>` case in `web/src/App.tsx` to render it; unknown parts are ignored, not crashed on.
- **Change the model or behaviour** — `server/src/agent.ts`. `claude-opus-5` is the default;
  `claude-sonnet-5` or `claude-haiku-4-5` are cheaper for fast iteration. `stopWhen: stepCountIs(5)`
  caps how many tool round-trips the agent may take.
- **Show the model's reasoning** — uncomment the `providerOptions` note in `agent.ts` and render
  `part.type === 'reasoning'` in the UI.

## Notes

- The calculator tool parses arithmetic with a small recursive-descent parser rather than `eval()`.
  Tool inputs come from model output, which the user's prompt can influence — don't hand them to an
  interpreter.
- This is a toy. If it grows into something real, look at Anthropic's server-side `fallbacks`
  parameter for Opus 5 (routes safety refusals to another model); the AI SDK provider abstraction
  doesn't expose it, so it would need a direct Anthropic SDK call or a custom fetch.
