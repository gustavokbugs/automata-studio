import { describe, expect, it } from 'vitest';
import { edgeGeometry, loopGeometry, NODE_SIZE } from './geometry';

describe('geometria das arestas', () => {
  it('aresta reta começa e termina na borda dos círculos', () => {
    const g = edgeGeometry({ x: 0, y: 0 }, { x: 200, y: 0 }, false);
    expect(g.path).toBe(`M ${NODE_SIZE / 2} 0 L ${200 - NODE_SIZE / 2 - 1} 0`);
    expect(g.label.y).toBe(0);
  });

  it('arestas opostas curvam para lados diferentes', () => {
    const ab = edgeGeometry({ x: 0, y: 0 }, { x: 200, y: 0 }, true);
    const ba = edgeGeometry({ x: 200, y: 0 }, { x: 0, y: 0 }, true);
    expect(ab.path).toContain(' Q ');
    expect(Math.sign(ab.label.y)).toBe(-Math.sign(ba.label.y));
  });

  it('laço fica acima do estado', () => {
    const g = loopGeometry({ x: 100, y: 100 });
    expect(g.path.startsWith('M ')).toBe(true);
    expect(g.label.x).toBe(100);
    expect(g.label.y).toBeLessThan(100 - NODE_SIZE / 2);
  });
});
