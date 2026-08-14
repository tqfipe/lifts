import { normalizeName } from './normalize';
import type { Exercise } from './types';

export type IconId =
  | 'barbell'
  | 'dumbbell'
  | 'sled'
  | 'rack'
  | 'cable-row'
  | 'pulldown'
  | 'bench'
  | 'curl'
  | 'pushdown'
  | 'fly'
  | 'leg-machine'
  | 'calf'
  | 'weight';

export interface CatalogEntry {
  name: string;
  icon: IconId;
}

export const CATALOG: CatalogEntry[] = [
  { name: 'Leg press', icon: 'sled' },
  { name: 'Hack squat', icon: 'sled' },
  { name: 'Squat', icon: 'rack' },
  { name: 'RDL', icon: 'barbell' },
  { name: 'Deadlift', icon: 'barbell' },
  { name: 'Hip thrust', icon: 'barbell' },
  { name: 'Row', icon: 'cable-row' },
  { name: 'Lat pulldown', icon: 'pulldown' },
  { name: 'Pull-up', icon: 'pulldown' },
  { name: 'Bench press', icon: 'bench' },
  { name: 'Incline press', icon: 'bench' },
  { name: 'Machine press', icon: 'bench' },
  { name: 'Shoulder press', icon: 'dumbbell' },
  { name: 'Lat raises', icon: 'dumbbell' },
  { name: 'Reverse fly', icon: 'fly' },
  { name: 'Chest fly', icon: 'fly' },
  { name: 'Hamstring curl', icon: 'leg-machine' },
  { name: 'Leg extension', icon: 'leg-machine' },
  { name: 'Calf raise', icon: 'calf' },
  { name: 'Preacher curl', icon: 'curl' },
  { name: 'Biceps curl', icon: 'curl' },
  { name: 'Triceps pushdown', icon: 'pushdown' },
];

/* order matters: first match wins */
const KEYWORDS: [RegExp, IconId][] = [
  [/pulldown|pull-?up|chin/, 'pulldown'],
  [/leg press|hack/, 'sled'],
  [/hamstring|leg curl|leg extension/, 'leg-machine'],
  [/squat/, 'rack'],
  [/deadlift|rdl|hip thrust/, 'barbell'],
  [/row/, 'cable-row'],
  [/calf/, 'calf'],
  [/shoulder|overhead|ohp|raise/, 'dumbbell'],
  [/fly|rear delt/, 'fly'],
  [/pushdown|triceps/, 'pushdown'],
  [/curl/, 'curl'],
  [/bench|press/, 'bench'],
  [/dumbbell/, 'dumbbell'],
];

export function iconForName(name: string): IconId {
  const n = normalizeName(name);
  if (!n) return 'weight';
  const exact = CATALOG.find((c) => normalizeName(c.name) === n);
  if (exact) return exact.icon;
  for (const [re, icon] of KEYWORDS) if (re.test(n)) return icon;
  return 'weight';
}

/** Catalog entries the user hasn't created yet (for the picker's "Common" section). */
export function commonNotIn(exercises: Exercise[]): CatalogEntry[] {
  const have = new Set(exercises.map((e) => normalizeName(e.name)));
  return CATALOG.filter((c) => !have.has(normalizeName(c.name)));
}

export interface Glyph {
  paths: string[];
  circles?: [number, number, number][];
}

/* 24x24 stroke glyphs, drawn for stroke-width 1.7, round caps */
export const GLYPHS: Record<IconId, Glyph> = {
  barbell: {
    paths: ['M2.5 12h19', 'M6.5 6.5v11', 'M17.5 6.5v11', 'M9.5 8.5v7', 'M14.5 8.5v7'],
  },
  dumbbell: {
    paths: ['M8 12h8', 'M6 8v8', 'M18 8v8', 'M3.5 10v4', 'M20.5 10v4'],
  },
  sled: {
    paths: ['M3 20h18', 'M18.5 5.5L6.5 17.5', 'M15 3.5l5.5 5.5', 'M6.5 17.5l-2-2', 'M9 13l3 3'],
  },
  rack: {
    paths: ['M6 4v16', 'M18 4v16', 'M3.5 9h17', 'M4 20h4', 'M16 20h4'],
  },
  'cable-row': {
    paths: ['M6 12h8', 'M16 8.5v7', 'M19 10.5v3', 'M6 12l-2.5 6'],
    circles: [[4.5, 10.5, 2]],
  },
  pulldown: {
    paths: ['M12 4v5', 'M4.5 10.5C7 8.5 17 8.5 19.5 10.5', 'M4.5 10.5L3 13.5', 'M19.5 10.5L21 13.5'],
    circles: [[12, 3, 1]],
  },
  bench: {
    paths: ['M3 15h18', 'M6.5 15v4.5', 'M17.5 15v4.5', 'M5 8h14', 'M8 6v4', 'M16 6v4'],
  },
  curl: {
    paths: ['M3 13h4l2.5-2.5L12 13l2.5-2.5L17 13h4', 'M5.5 10v6', 'M18.5 10v6'],
  },
  pushdown: {
    paths: ['M12 3v5', 'M7 8.5h10', 'M12 8.5V15', 'M9.5 13.5L12 16l2.5-2.5', 'M12 16v4'],
  },
  fly: {
    paths: ['M4.5 6c0 6 3 10 7.5 11.5', 'M19.5 6c0 6-3 10-7.5 11.5'],
    circles: [
      [4.5, 4.5, 1.3],
      [19.5, 4.5, 1.3],
    ],
  },
  'leg-machine': {
    paths: ['M3 10h10', 'M5 10v9', 'M13 10l4.5 6'],
    circles: [[18.5, 17.7, 2.2]],
  },
  calf: {
    paths: ['M3 19.5h18', 'M6.5 19.5L17 12.5', 'M17 12.5v7', 'M9 15.5l2 3'],
  },
  weight: {
    paths: ['M8.7 9.7c-.6-4.5 7.2-4.5 6.6 0'],
    circles: [[12, 14.5, 5.7]],
  },
};
