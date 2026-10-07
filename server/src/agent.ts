import { ToolLoopAgent, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { calculator, weather } from './tools.js';

/**
 * The agent. `ToolLoopAgent` runs the reason -> call tool -> observe loop for us;
 * `stopWhen` caps how many times round it can go before it must answer.
 *
 * Opus 5 runs adaptive thinking by default with the reasoning summary omitted, so
 * there is no `thinking` config here. To show reasoning in the UI, add:
 *   providerOptions: { anthropic: { thinking: { type: 'adaptive', display: 'summarized' } } }
 * and render parts with `part.type === 'reasoning'` in web/src/App.tsx.
 */
export const agent = new ToolLoopAgent({
  model: anthropic('claude-opus-5'),
  instructions: [
    'You are a helpful assistant with access to tools.',
    'Use the tools when they are relevant rather than guessing or doing arithmetic in your head.',
    'Keep answers short and conversational.',
  ].join(' '),
  tools: { weather, calculator },
  stopWhen: stepCountIs(5),
});
