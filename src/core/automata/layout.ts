import type { AutomatonLayout, Point, StateName } from './types';

/** Distância mínima recomendada entre estados no editor. */
export const STATE_SPACING = 180;

/**
 * Distribui os estados em uma linha (até 4 estados) ou em um círculo,
 * preservando a ordem de declaração. Usado quando uma especificação
 * importada não informa posições.
 */
export function autoLayout(states: readonly StateName[]): AutomatonLayout {
  const layout: AutomatonLayout = {};
  const n = states.length;
  if (n === 0) return layout;

  if (n <= 4) {
    states.forEach((state, i) => {
      layout[state] = { x: i * STATE_SPACING, y: 0 };
    });
    return layout;
  }

  const radius = Math.max(160, (n * STATE_SPACING) / (2 * Math.PI));
  states.forEach((state, i) => {
    const angle = Math.PI + (2 * Math.PI * i) / n;
    layout[state] = {
      x: Math.round(radius + radius * Math.cos(angle)),
      y: Math.round(radius + radius * Math.sin(angle)),
    };
  });
  return layout;
}

/** Completa um layout parcial, posicionando estados sem coordenadas. */
export function completeLayout(states: readonly StateName[], layout: AutomatonLayout): AutomatonLayout {
  const missing = states.filter((s) => !layout[s]);
  if (missing.length === 0) return { ...layout };

  const placed = Object.values(layout);
  const maxY = placed.length > 0 ? Math.max(...placed.map((p) => p.y)) : -STATE_SPACING;
  const result: AutomatonLayout = { ...layout };
  missing.forEach((state, i) => {
    result[state] = { x: i * STATE_SPACING, y: maxY + STATE_SPACING };
  });
  return result;
}

/** Sugere uma posição livre para um novo estado, à direita dos existentes. */
export function nextFreePosition(layout: AutomatonLayout): Point {
  const points = Object.values(layout);
  if (points.length === 0) return { x: 0, y: 0 };
  const maxX = Math.max(...points.map((p) => p.x));
  const rightmost = points.find((p) => p.x === maxX) as Point;
  return { x: maxX + STATE_SPACING, y: rightmost.y };
}
