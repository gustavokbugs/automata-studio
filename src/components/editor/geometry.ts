import type { Point } from '../../core/automata/types';

/** Diâmetro dos nós de estado, em pixels. */
export const NODE_SIZE = 64;
const RADIUS = NODE_SIZE / 2;

/** Caminho SVG de uma aresta e a posição do seu rótulo. */
export interface EdgeGeometry {
  path: string;
  label: Point;
}

const round = (n: number) => Math.round(n * 100) / 100;
const fmt = (p: Point) => `${round(p.x)} ${round(p.y)}`;

/** Ponto na circunferência de raio `r` em torno de `c`, na direção de `towards`. */
function pointOnCircle(c: Point, towards: Point, r: number): Point {
  const dx = towards.x - c.x;
  const dy = towards.y - c.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: c.x + (dx / len) * r, y: c.y + (dy / len) * r };
}

/**
 * Laço (self-loop) desenhado acima do estado: uma curva cúbica que sai e
 * volta à circunferência do nó.
 */
export function loopGeometry(center: Point): EdgeGeometry {
  const height = RADIUS + 58;
  const angle = (deg: number) => (deg * Math.PI) / 180;
  const start = { x: center.x + RADIUS * Math.cos(angle(-125)), y: center.y + RADIUS * Math.sin(angle(-125)) };
  const end = { x: center.x + RADIUS * Math.cos(angle(-55)), y: center.y + RADIUS * Math.sin(angle(-55)) };
  const c1 = { x: center.x - 50, y: center.y - height };
  const c2 = { x: center.x + 50, y: center.y - height };
  // Ponto médio da curva de Bézier cúbica (t = 0,5).
  const mid = {
    x: 0.125 * start.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * end.x,
    y: 0.125 * start.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * end.y,
  };
  return {
    path: `M ${fmt(start)} C ${fmt(c1)}, ${fmt(c2)}, ${fmt(end)}`,
    label: { x: round(mid.x), y: round(mid.y - 12) },
  };
}

/**
 * Aresta entre dois estados distintos. Quando existe a aresta inversa
 * (`curved`), a curva é deslocada para a esquerda do sentido origem → destino,
 * de modo que A → B e B → A fiquem em lados opostos.
 */
export function edgeGeometry(source: Point, target: Point, curved: boolean): EdgeGeometry {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.hypot(dx, dy) || 1;
  const normal = { x: dy / len, y: -dx / len };
  const bend = curved ? Math.min(34, len / 4) * 2 : 0;
  const control = {
    x: (source.x + target.x) / 2 + normal.x * bend,
    y: (source.y + target.y) / 2 + normal.y * bend,
  };
  const start = pointOnCircle(source, control, RADIUS);
  const end = pointOnCircle(target, control, RADIUS + 1);
  // Ponto médio da curva de Bézier quadrática (t = 0,5).
  const label = {
    x: 0.25 * start.x + 0.5 * control.x + 0.25 * end.x,
    y: 0.25 * start.y + 0.5 * control.y + 0.25 * end.y,
  };
  return {
    path: curved ? `M ${fmt(start)} Q ${fmt(control)} ${fmt(end)}` : `M ${fmt(start)} L ${fmt(end)}`,
    label: { x: round(label.x), y: round(label.y) },
  };
}
