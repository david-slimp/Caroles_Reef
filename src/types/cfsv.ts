// src/types/cfsv.ts

// --- Core IDs (short, player-facing) ---------------------------------------
export type ClassId =
  | 'Rayfin'   // bony ray-finned fish (guppy, seahorse, reef fish)
  | 'Cart'     // cartilaginous fish (sharks, rays)
  | 'Crust'    // crustaceans (shrimp, crabs, lobsters)
  | 'Ceph'     // cephalopods (squid, octopus, cuttle)
  | 'Jelly'    // cnidarians & friends (jellies, siphonophores)
  | 'Eel'      // eels
  | 'Echin'    // echinoderms (sea stars)
  | 'Coral'    // corals (kept for future)
  | 'Mythic';  // fantasy (mermaids, etc.)

export type FamilyId =
  | 'Livebearer'  // guppy/molly/platy
  | 'ReefFish'    // generic reef bony fish
  | 'Pipe'        // seahorses/pipefish family
  | 'SharkRay'    // sharks + rays (cartilaginous)
  | 'TenFoot'     // decapods (shrimp, crabs, lobsters)
  | 'Squid'       // cephalopods bucket
  | 'Cnidarian'   // jellies, man-o’-war (game bucket)
  | 'Moray'       // moray eels
  | 'Seastar'     // starfish
  | 'Merfolk';    // mermaids (fantasy)

// Free text for species/variety (keep short, Camel or Snake case)
export type SpeciesId = string;  // e.g., 'Guppy', 'Seahorse', 'Shark', 'MantaRay'
export type VarietyId = string;  // e.g., 'Yellow_Striped', 'Blood_Red', 'Green_Mottled'

export type CFSV = [ClassId, FamilyId, SpeciesId, VarietyId];

export function cfsvTag([c,f,s,v]: CFSV) {
  return `${c}/${f}/${s}/${v}`;
}
export function parseCFSV(tag: string): CFSV {
  const [c,f,s,v] = tag.split('/') as CFSV;
  return [c,f,s,v];
}

// --- Canonical Class↔Family mapping (light validation) ----------------------
export const FAMILY_TO_CLASS: Record<FamilyId, ClassId> = {
  Livebearer: 'Rayfin',
  ReefFish:   'Rayfin',
  Pipe:       'Rayfin',

  SharkRay:   'Cart',

  TenFoot:    'Crust',

  Squid:      'Ceph',

  Cnidarian:  'Jelly',

  Moray:      'Eel',

  Seastar:    'Echin',

  Merfolk:    'Mythic',
};

export function isValidCFSV([cls, fam]: CFSV): boolean {
  return FAMILY_TO_CLASS[fam] === cls;
}

// --- Breeding rule (your game design) --------------------------------------
// Same Class AND same Family → allowed (species/variety can differ)
export function canBreed(a: CFSV, b: CFSV) {
  return a[0] === b[0] && a[1] === b[1];
}

// --- Examples you can use immediately --------------------------------------
// (These are examples; feel free to change varieties/colors.)

// From earlier:
export const Guppy_Yellow_Striped: CFSV =
  ['Rayfin','Livebearer','Guppy','Yellow_Striped'];

// New examples requested:

// Seahorse
export const Seahorse_Golden: CFSV =
  ['Rayfin','Pipe','Seahorse','Golden'];

// Shark (generic reefy small shark)
export const Shark_Blacktip: CFSV =
  ['Cart','SharkRay','Shark','Blacktip'];

// Manta ray
export const MantaRay_Reef_Spotted: CFSV =
  ['Cart','SharkRay','MantaRay','Reef_Spotted'];

// Portuguese man-o’-war (we’ll treat it as a “jelly” bucket for gameplay)
export const ManOWar_Ocean_Blue: CFSV =
  ['Jelly','Cnidarian','ManOWar','Ocean_Blue'];

// Moray eel
export const MorayEel_Green_Mottled: CFSV =
  ['Eel','Moray','MorayEel','Green_Mottled'];

// Starfish (sea star)
export const Starfish_Sunburst: CFSV =
  ['Echin','Seastar','Starfish','Sunburst'];

// Mermaid (fantasy)
export const Mermaid_Coral_Pink: CFSV =
  ['Mythic','Merfolk','Mermaid','Coral_Pink'];

// Extra from earlier shrimp work (for reference):
export const FireShrimp_Blood_Red: CFSV =
  ['Crust','TenFoot','FireShrimp','Blood_Red'];

// Quick sanity check helper you can call at load time (optional)
export function assertCFSVValid(tag: CFSV) {
  if (!isValidCFSV(tag)) {
    throw new Error(`Invalid CFSV combo ${cfsvTag(tag)}: Family ${tag[1]} must belong to Class ${FAMILY_TO_CLASS[tag[1]]}`);
  }
}

