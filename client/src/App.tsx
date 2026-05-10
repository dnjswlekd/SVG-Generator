import { useStreamingSVG } from './hooks/useStreamingSVG';
import PromptInput from './components/PromptInput';
import CodeEditor from './components/CodeEditor';
import SvgPreview from './components/SvgPreview';

export default function App() {
  const { svg, isStreaming, error, generate } = useStreamingSVG();

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex h-12 items-center border-b border-neutral-800 px-4 text-sm font-medium">
        GrowthNote
      </header>
      <main className="flex flex-1 min-h-0">
        <section className="flex w-1/2 min-w-0 flex-col border-r border-neutral-800">
          <PromptInput onGenerate={generate} isStreaming={isStreaming} error={error} />
          <CodeEditor />
        </section>
        <section className="flex w-1/2 min-w-0">
          <SvgPreview svg={svg} isStreaming={isStreaming} />
        </section>
      </main>
    </div>
  );
}
