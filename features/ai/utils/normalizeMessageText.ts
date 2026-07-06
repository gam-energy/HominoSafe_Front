/**
 * Normalizes chat message content from REST history, WebSocket payloads,
 * and legacy stored JSON strings into plain display text.
 */
export function normalizeMessageText(input: unknown): string {
  if (input == null) return '';

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return normalizeMessageText(JSON.parse(trimmed));
      } catch {
        return input;
      }
    }

    return input;
  }

  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;

    if (typeof obj.message === 'string') return obj.message;

    if (typeof obj.content === 'string') return obj.content;

    if (
      obj.content &&
      typeof obj.content === 'object' &&
      'message' in (obj.content as object)
    ) {
      return String((obj.content as { message: unknown }).message);
    }

    if (Array.isArray(obj.parts)) {
      const first = obj.parts[0] as { text?: unknown } | undefined;
      if (first?.text != null) return normalizeMessageText(first.text);
    }
  }

  return String(input);
}
