export const SCHEMA_VERSION = 1;

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

export interface Exercise {
  id: string;
  name: string;
  icon?: IconId; // explicit override; otherwise derived from the name
}

export interface SetRecord {
  weight: number;
  reps?: number;
}

export interface Entry {
  exerciseId: string;
  weight: number; // headline weight; mirrors the heaviest set when sets exist
  logged: boolean; // in-progress bookkeeping; finished workouts contain only logged entries
  reps?: number;
  sets?: SetRecord[];
  note?: string;
  isPB: boolean; // stamped at log time; restamped on import
}

export interface Workout {
  id: string;
  startedAt: string; // ISO datetime
  finishedAt?: string; // absent = in progress
  templateId?: string;
  note?: string;
  entries: Entry[];
}

export interface Template {
  id: string;
  name: string;
  exerciseIds: string[];
}

export type WeightUnit = 'kg' | 'lb';

export type ThemeId = 'emerald' | 'volt' | 'inferno' | 'ice' | 'violet';

export interface Settings {
  weightStep: number; // in the display unit
  unit?: WeightUnit; // default 'kg'; weights are stored canonically in kg
  theme?: ThemeId; // default 'emerald'
}

export interface AppState {
  schemaVersion: typeof SCHEMA_VERSION;
  exercises: Exercise[];
  workouts: Workout[];
  templates: Template[];
  settings: Settings;
}

export function emptyState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    exercises: [],
    workouts: [],
    templates: [],
    settings: { weightStep: 2.5 },
  };
}
