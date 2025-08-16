export class EventBus {
  map: Record<string, Set<(p?: unknown) => void>> = {};
  on(e: string, h: (p?: unknown) => void) {
    (this.map[e] ??= new Set()).add(h);
    return () => this.off(e, h);
  }
  off(e: string, h: (p?: unknown) => void) {
    this.map[e]?.delete(h);
  }
  emit(e: string, p?: unknown) {
    this.map[e]?.forEach(fn => fn(p));
  }
}
