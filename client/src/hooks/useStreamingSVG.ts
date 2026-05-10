import { useCallback, useRef, useState } from 'react';

type State = {
  svg: string;
  isStreaming: boolean;
  error: string | null;
};

export function useStreamingSVG() {
  const [state, setState] = useState<State>({
    svg: '',
    isStreaming: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (prompt: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ svg: '', isStreaming: true, error: null });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`request failed: HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          let eventName = 'message';
          let dataLine = '';
          for (const line of evt.split('\n')) {
            if (line.startsWith('event: ')) eventName = line.slice(7);
            else if (line.startsWith('data: ')) dataLine = line.slice(6);
          }
          if (!dataLine) continue;
          if (dataLine === '[DONE]') {
            setState((s) => ({ ...s, isStreaming: false }));
            return;
          }
          try {
            const parsed = JSON.parse(dataLine);
            if (eventName === 'error') {
              setState((s) => ({ ...s, isStreaming: false, error: parsed.message ?? 'stream error' }));
              return;
            }
            if (typeof parsed.text === 'string') {
              setState((s) => ({ ...s, svg: s.svg + parsed.text }));
            }
          } catch {
            // ignore malformed line
          }
        }
      }

      setState((s) => ({ ...s, isStreaming: false }));
    } catch (err) {
      if (controller.signal.aborted) return;
      setState((s) => ({
        ...s,
        isStreaming: false,
        error: err instanceof Error ? err.message : 'unknown error',
      }));
    }
  }, []);

  return { ...state, generate };
}
