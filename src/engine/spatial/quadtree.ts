export type Point = { x: number; y: number; ref?: unknown };
export class Quadtree {
  insert(__p: Point) {}
  query(__x: number, __y: number, __r: number): Point[] {
    return [];
  }
  clear() {}
}
