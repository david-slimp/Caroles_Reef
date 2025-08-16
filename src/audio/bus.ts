export type BusName = 'master' | 'music' | 'sfx';
export class AudioBus {
  private v = 1;
  setVolume(n: number) {
    this.v = Math.max(0, Math.min(1, n));
  }
  getVolume() {
    return this.v;
  }
}
