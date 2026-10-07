import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createAgentUIStreamResponse } from 'ai';
import { agent } from './agent.js';

// Fail here rather than with an opaque 401 in the middle of a stream.
if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    'ANTHROPIC_API_KEY is not set.\n' +
      'Copy .env.example to .env and add your key: cp .env.example .env',
  );
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true }));

app.post('/api/chat', async (c) => {
  const { messages } = await c.req.json();

  // Returns a streaming web Response that @ai-sdk/react's useChat understands.
  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    // The SDK masks errors as "An error occurred." by default, which is no help
    // while you are building. Surface the real message locally; keep it hidden in
    // production so provider errors don't leak to the browser.
    onError: (error) => {
      console.error(error);
      if (isProduction) return 'An error occurred.';
      return error instanceof Error ? error.message : String(error);
    },
  });
});

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server listening on http://localhost:${info.port}`);
});
