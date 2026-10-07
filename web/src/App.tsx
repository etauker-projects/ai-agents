import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';

export function App() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const [input, setInput] = useState('');

  const busy = status !== 'ready';

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput('');
  };

  return (
    <main className="app">
      <header className="header">
        <h1>ai-agents</h1>
        <p>Ask about the weather, or for some arithmetic — the agent has a tool for each.</p>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <p className="empty">Try: “What is 17 * 23, and what is the weather in Berlin?”</p>
        )}
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {status === 'submitted' && <div className="thinking">thinking…</div>}
        {error && <div className="error">{error.message}</div>}
      </div>

      <form className="composer" onSubmit={submit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Say something…"
          autoFocus
        />
        <button type="submit" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}

function Message({ message }: { message: UIMessage }) {
  return (
    <div className={`message ${message.role}`}>
      <span className="role">{message.role === 'user' ? 'you' : 'agent'}</span>
      <div className="body">
        {message.parts.map((part, index) => (
          <Part key={index} part={part} />
        ))}
      </div>
    </div>
  );
}

function Part({ part }: { part: UIMessage['parts'][number] }) {
  if (part.type === 'text') {
    return <p className="text">{part.text}</p>;
  }

  // Tool parts are typed as `tool-${toolName}` — one per tool defined on the agent.
  if (part.type === 'tool-weather' || part.type === 'tool-calculator') {
    const name = part.type.slice('tool-'.length);
    switch (part.state) {
      case 'input-streaming':
      case 'input-available':
        return (
          <pre className="tool pending">
            {name}({JSON.stringify(part.input ?? {})}) …
          </pre>
        );
      case 'output-available':
        return (
          <pre className="tool">
            {name}({JSON.stringify(part.input)}) → {JSON.stringify(part.output)}
          </pre>
        );
      case 'output-error':
        return (
          <pre className="tool error">
            {name} failed: {part.errorText}
          </pre>
        );
      default:
        return null;
    }
  }

  return null;
}
