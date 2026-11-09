import { CirclePlus, LayoutGrid, Maximize } from 'lucide-react';
import { Button } from '../ui/Button';

interface CanvasToolbarProps {
  onAddState: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
}

/** Ações rápidas sobre o canvas. */
export function CanvasToolbar({ onAddState, onAutoLayout, onFitView }: CanvasToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-surface/90 p-1 shadow-lg shadow-black/20 backdrop-blur">
      <Button variant="ghost" size="sm" onClick={onAddState} title="Adicionar estado (ou duplo clique no canvas)">
        <CirclePlus size={15} /> Estado
      </Button>
      <div className="mx-0.5 h-5 w-px bg-line" />
      <Button variant="ghost" size="icon-sm" onClick={onAutoLayout} aria-label="Organizar automaticamente" title="Organizar automaticamente">
        <LayoutGrid size={15} />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={onFitView} aria-label="Ajustar à tela" title="Ajustar à tela">
        <Maximize size={15} />
      </Button>
    </div>
  );
}
