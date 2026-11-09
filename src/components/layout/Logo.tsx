/** Marca do Automata Studio: dois estados ligados, o segundo final. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect width="32" height="32" rx="8" className="fill-surface-3" />
          <circle cx="10.5" cy="16" r="4.6" stroke="var(--as-accent)" strokeWidth="1.8" />
          <circle cx="22" cy="16" r="4.6" stroke="var(--as-accent)" strokeWidth="1.8" />
          <circle cx="22" cy="16" r="2.3" stroke="var(--as-accent)" strokeWidth="1.4" />
          <path d="M15.3 16h1.6" stroke="var(--as-accent)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <div className="leading-tight">
          <p className="text-[14px] font-semibold tracking-tight text-fg">Automata Studio</p>
          <p className="text-[10.5px] text-fg-subtle">Simulador de AFD e AFND</p>
        </div>
      </div>
    </div>
  );
}
