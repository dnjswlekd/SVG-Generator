export default function CodeEditor() {
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2 text-xs text-neutral-400">
        <span>Code</span>
        <span className="text-neutral-600">Monaco placeholder</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto bg-neutral-900 p-3 font-mono text-xs text-neutral-500">
        {`<!-- 여기에 Monaco 에디터가 들어갑니다 -->`}
      </div>
    </div>
  );
}
