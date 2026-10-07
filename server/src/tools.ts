import { tool } from 'ai';
import { z } from 'zod';

/**
 * A fake weather lookup. Swap the body for a real API call when you need one —
 * the tool definition itself stays the same.
 */
export const weather = tool({
  description: 'Get the current weather for a city.',
  inputSchema: z.object({
    city: z.string().describe('The city to get the weather for'),
  }),
  execute: async ({ city }) => ({
    city,
    temperatureC: Math.round(5 + Math.random() * 25),
    conditions: ['sunny', 'cloudy', 'rainy', 'windy'][Math.floor(Math.random() * 4)],
  }),
});

export const calculator = tool({
  description:
    'Evaluate an arithmetic expression. Supports + - * / % ^ and parentheses, e.g. "(17 * 23) / 4".',
  inputSchema: z.object({
    expression: z.string().describe('The arithmetic expression to evaluate'),
  }),
  execute: async ({ expression }) => {
    try {
      return { expression, result: evaluate(expression) };
    } catch (error) {
      // Returned, not thrown: the model sees this and can correct itself.
      return { expression, error: error instanceof Error ? error.message : String(error) };
    }
  },
});

/**
 * A recursive-descent parser for plain arithmetic.
 *
 * Deliberately NOT `eval()` / `new Function()`: the expression comes from model
 * output, which is attacker-influenceable via the user's prompt. This grammar
 * can only ever produce a number.
 */
function evaluate(input: string): number {
  let pos = 0;

  const skipSpace = () => {
    while (pos < input.length && /\s/.test(input[pos]!)) pos++;
  };

  const peek = (): string | undefined => {
    skipSpace();
    return input[pos];
  };

  const eat = (char: string): boolean => {
    if (peek() === char) {
      pos++;
      return true;
    }
    return false;
  };

  // expression := term (('+' | '-') term)*
  const parseExpression = (): number => {
    let left = parseTerm();
    for (;;) {
      if (eat('+')) left += parseTerm();
      else if (eat('-')) left -= parseTerm();
      else return left;
    }
  };

  // term := factor (('*' | '/' | '%') factor)*
  const parseTerm = (): number => {
    let left = parseFactor();
    for (;;) {
      if (eat('*')) left *= parseFactor();
      else if (eat('/')) {
        const divisor = parseFactor();
        if (divisor === 0) throw new Error('Division by zero');
        left /= divisor;
      } else if (eat('%')) {
        const divisor = parseFactor();
        if (divisor === 0) throw new Error('Division by zero');
        left %= divisor;
      } else return left;
    }
  };

  // factor := ('+' | '-') factor | base ('^' factor)?
  const parseFactor = (): number => {
    if (eat('+')) return parseFactor();
    if (eat('-')) return -parseFactor();

    const base = parseBase();
    // Right-associative, so recurse into parseFactor rather than looping.
    if (eat('^')) return base ** parseFactor();
    return base;
  };

  // base := '(' expression ')' | number
  const parseBase = (): number => {
    if (eat('(')) {
      const value = parseExpression();
      if (!eat(')')) throw new Error(`Expected ')' at position ${pos}`);
      return value;
    }

    skipSpace();
    const start = pos;
    while (pos < input.length && /[\d.]/.test(input[pos]!)) pos++;
    if (start === pos) throw new Error(`Expected a number at position ${pos}`);

    const value = Number(input.slice(start, pos));
    if (!Number.isFinite(value)) throw new Error(`Invalid number: ${input.slice(start, pos)}`);
    return value;
  };

  const result = parseExpression();
  skipSpace();
  if (pos < input.length) throw new Error(`Unexpected character '${input[pos]}' at position ${pos}`);
  if (!Number.isFinite(result)) throw new Error('Result is not a finite number');
  return result;
}
