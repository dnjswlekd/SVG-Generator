import { useState } from 'react';

type Props = {
  onGenerate: (prompt: string) => void;
  isStreaming: boolean;
  error: string | null;
};

export default function PromptInput({ onGenerate, isStreaming, error }: Props) {
  const [prompt, setPrompt] = useState('');

  const submit = () => {
    const trimmed = prompt.trim();
    if (!trimmed || isStreaming) return;
    onGenerate(trimmed);
  };

  return (
    <div className="flex flex-col gap-2 border-b border-neutral-800 p-3">
      <label className="text-xs text-neutral-400">Prompt</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        className="h-24 resize-none rounded-md border border-neutral-800 bg-neutral-900 p-2 text-sm outline-none focus:border-neutral-600"
        placeholder="만들고 싶은 SVG를 설명해주세요... (⌘/Ctrl + Enter)"
      />
      {error && <div className="text-xs text-red-400">{error}</div>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
          disabled={isStreaming || prompt.trim().length === 0}
        >
          {isStreaming ? 'Generating…' : 'Generate'}
        </button>
      </div>
    </div>
  );
}
