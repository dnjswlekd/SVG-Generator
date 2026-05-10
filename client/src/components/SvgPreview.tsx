type Props = {
  svg: string;
  isStreaming: boolean;
};

export default function SvgPreview({ svg, isStreaming }: Props) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2 text-xs text-neutral-400">
        <span>Preview</span>
        {isStreaming && <span className="text-neutral-500">streaming…</span>}
      </div>
      <div className="flex flex-1 items-center justify-center bg-neutral-950 p-4">
        {svg ? (
          <div
            className="flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:max-h-full [&>svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-neutral-800 text-sm text-neutral-600">
            SVG preview placeholder
          </div>
        )}
      </div>
    </div>
  );
}
