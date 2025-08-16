export interface Genes {
  speed: number;
  senseRadius: number;
  hungerDrive: number;
  rarityGene: number;
  colorHue: number;
  patternType: string;
  finShape?: string;
  eyeType?: string;
}
export interface Phenotype {
  visual: Record<string, unknown>;
  behavior: Record<string, unknown>;
}
export interface Creature {
  id: string;
  species: string;
  name?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: number;
  size: number;
  age: number;
  sex: 'M' | 'F';
  shiny?: boolean;
  favorite?: boolean;
  state?: string;
  drag?: boolean;
  _breedCd?: number;
  genes: Genes;
  phenotype?: Phenotype;
  parents?: { ma: string; pa: string } | null;
  selected?: boolean;
}
