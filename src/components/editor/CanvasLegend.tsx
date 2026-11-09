/** Legenda visual da notação usada no grafo. */
export function CanvasLegend() {
  return (
    <div className="hidden items-center gap-3.5 rounded-xl border border-line bg-surface/90 px-3 py-2 text-[11px] text-fg-muted shadow-lg shadow-black/20 backdrop-blur md:flex">
      <span className="flex items-center gap-1.5">
        <svg width="20" height="10" viewBox="0 0 20 10" aria-hidden className="text-fg-subtle">
          <path d="M0 5 H14" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13 1 L19 5 L13 9 Z" fill="currentColor" />
        </svg>
        inicial
      </span>
      <span className="flex items-center gap-1.5">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-fg-subtle">
          <span className="h-2 w-2 rounded-full border-[1.5px] border-fg-subtle" />
        </span>
        final
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-accent shadow-[0_0_0_3px_var(--as-accent-soft)]" />
        ativo
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-dashed border-danger" />
        descartado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-success shadow-[0_0_0_3px_var(--as-success-soft)]" />
        aceito
      </span>
    </div>
  );
}
