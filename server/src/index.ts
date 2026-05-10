import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
loadEnv({ path: envPath });
const apiKey = process.env.ANTHROPIC_API_KEY;

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT =
  'You are an SVG character designer. Output ONLY valid SVG code, no markdown fences, no explanation. Use viewBox="0 0 200 200" by default.';

if (!apiKey) {
  console.warn('warning: ANTHROPIC_API_KEY is not set — /api/generate will fail until you add it to server/.env');
}

const anthropic = new Anthropic({ apiKey });

const MOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <radialGradient id="head" cx="38%" cy="32%" r="78%">
      <stop offset="0%" stop-color="#fff2c2"/>
      <stop offset="55%" stop-color="#ffce5c"/>
      <stop offset="100%" stop-color="#a86a1a"/>
    </radialGradient>
    <linearGradient id="ear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd87a"/>
      <stop offset="100%" stop-color="#8a5414"/>
    </linearGradient>
    <radialGradient id="innerEar" cx="50%" cy="65%" r="60%">
      <stop offset="0%" stop-color="#fbc6c6"/>
      <stop offset="100%" stop-color="#a04848"/>
    </radialGradient>
    <radialGradient id="iris" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#a8e6c4"/>
      <stop offset="60%" stop-color="#2f7a55"/>
      <stop offset="100%" stop-color="#0e2f1f"/>
    </radialGradient>
    <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff8fa0" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#ff8fa0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="nose" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#ff9b88"/>
      <stop offset="100%" stop-color="#9c3a26"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="4"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="rim" cx="50%" cy="100%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <g filter="url(#shadow)">
    <path d="M50 82 L66 32 L92 78 Z" fill="url(#ear)"/>
    <path d="M150 82 L134 32 L108 78 Z" fill="url(#ear)"/>
    <path d="M60 76 L68 48 L82 74 Z" fill="url(#innerEar)"/>
    <path d="M140 76 L132 48 L118 74 Z" fill="url(#innerEar)"/>

    <ellipse cx="100" cy="112" rx="64" ry="60" fill="url(#head)"/>
    <ellipse cx="100" cy="155" rx="50" ry="14" fill="url(#rim)"/>

    <ellipse cx="72" cy="128" rx="15" ry="9" fill="url(#cheek)"/>
    <ellipse cx="128" cy="128" rx="15" ry="9" fill="url(#cheek)"/>

    <ellipse cx="80" cy="106" rx="11" ry="13" fill="#ffffff"/>
    <ellipse cx="120" cy="106" rx="11" ry="13" fill="#ffffff"/>
    <ellipse cx="80" cy="108" rx="8" ry="11" fill="url(#iris)"/>
    <ellipse cx="120" cy="108" rx="8" ry="11" fill="url(#iris)"/>
    <ellipse cx="80" cy="110" rx="2.5" ry="7" fill="#0a1410"/>
    <ellipse cx="120" cy="110" rx="2.5" ry="7" fill="#0a1410"/>
    <circle cx="83" cy="103" r="2.2" fill="#ffffff"/>
    <circle cx="123" cy="103" r="2.2" fill="#ffffff"/>
    <circle cx="78" cy="112" r="0.9" fill="#ffffff" opacity="0.8"/>
    <circle cx="118" cy="112" r="0.9" fill="#ffffff" opacity="0.8"/>

    <path d="M100 124 Q92 124 96 132 Q100 137 104 132 Q108 124 100 124 Z" fill="url(#nose)"/>

    <path d="M100 137 Q90 150 80 140" stroke="#2a1810" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M100 137 Q110 150 120 140" stroke="#2a1810" stroke-width="2.5" fill="none" stroke-linecap="round"/>

    <path d="M62 128 Q46 124 34 120" stroke="#2a1810" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.65"/>
    <path d="M62 134 Q46 137 34 142" stroke="#2a1810" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.65"/>
    <path d="M138 128 Q154 124 166 120" stroke="#2a1810" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.65"/>
    <path d="M138 134 Q154 137 166 142" stroke="#2a1810" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.65"/>
  </g>
</svg>`;

async function streamMockSVG(stream: { writeSSE: (m: { data: string; event?: string }) => Promise<void> }) {
  const CHUNK = 14;
  for (let i = 0; i < MOCK_SVG.length; i += CHUNK) {
    await stream.writeSSE({ data: JSON.stringify({ text: MOCK_SVG.slice(i, i + CHUNK) }) });
    await new Promise((r) => setTimeout(r, 18));
  }
}

const app = new Hono();

app.post('/api/generate', async (c) => {
  const { prompt } = await c.req.json<{ prompt?: string }>();
  if (!prompt || typeof prompt !== 'string') {
    return c.json({ error: 'prompt is required' }, 400);
  }

  return streamSSE(c, async (stream) => {
    try {
      if (process.env.MOCK_STREAM === '1') {
        await streamMockSVG(stream);
        await stream.writeSSE({ data: '[DONE]' });
        return;
      }

      const claudeStream = anthropic.messages.stream({
        model: 'claude-sonnet-4-5',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      for await (const event of claudeStream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          await stream.writeSSE({ data: JSON.stringify({ text: event.delta.text }) });
        }
      }

      await stream.writeSSE({ data: '[DONE]' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      await stream.writeSSE({ event: 'error', data: JSON.stringify({ message }) });
    }
  });
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`server listening on http://localhost:${port}`);
