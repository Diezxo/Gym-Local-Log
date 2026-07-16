// ─── Exercise Types ───
export type ExerciseType = 'strength' | 'cardio';

// ─── Muscle / Type Tags ───
// We keep the actual string values in Spanish so the UI doesn't look weird if we don't have i18n yet,
// or we can translate them if requested. The user said "todos esos nombres de archivos y clases, metodos en ingles".
// Let's keep the internal type values in English, but the UI might need to map them if they want it in Spanish.
// Wait, the user said "pon todos esos nombres de archivos y clases, metodos en ingles".
// Let's translate the string literals too, it's safer for a pure English codebase. We can localize later.
export type MuscleTag =
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Arms'
  | 'Core'
  | 'Cardio'
  | 'Warmup';

export const MUSCLE_TAGS: MuscleTag[] = [
  'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio', 'Warmup',
];

// Colors for each tag
export const TAG_COLORS: Record<MuscleTag, { bg: string; text: string; border: string }> = {
  'Chest':   { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  'Back':    { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  'Legs':    { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  'Arms':    { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  'Core':    { bg: 'rgba(236,72,153,0.12)',  text: '#f472b6', border: 'rgba(236,72,153,0.25)' },
  'Cardio':  { bg: 'rgba(34,211,238,0.12)',  text: '#22d3ee', border: 'rgba(34,211,238,0.25)' },
  'Warmup':  { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.25)' },
};

// ─── Units ───
export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';
export type Language = 'es' | 'en';

// ─── Sets and Logs ───
export interface StrengthSet {
  setNumber: number;
  reps: number;
  weight: number; // Stored universally in kg in DB
}

export interface CardioLog {
  distanceMeters: number; // Stored universally in meters in DB
  timeMinutes: number;
  technicalNotes?: string;
}

// ─── Base Exercise (for templates) ───
export interface BaseExercise {
  name: string;
  type: ExerciseType;
  tags?: MuscleTag[]; // Muscle groups / type
}

// ─── Template ───
export interface Template {
  id: string;
  name: string;
  exercises: BaseExercise[];
}

// ─── Individual Exercise Log ───
export interface ExerciseLog {
  name: string;
  type: ExerciseType;
  tags?: MuscleTag[]; // Copied from template when logging
  sets?: StrengthSet[];
  cardio?: CardioLog;
}

// ─── Daily Log ───
export interface DailyLog {
  date: string; // Format YYYY-MM-DD
  templateId: string;
  exercises: ExerciseLog[];
  notes?: string;
}

// ─── Monthly Archive ───
export interface MonthlyArchive {
  monthId: string; // Format YYYY-MM
  schemaVersion?: number; // 2 = English schema, kg/m base
  logs: DailyLog[];
}

// ─── User Settings ───
export interface UserSettings {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  language: Language;
  weightIncrement: number; // default 2.5
  restTime: number; // default 90 (seconds)
}

export const DEFAULT_SETTINGS: UserSettings = {
  weightUnit: 'kg',
  distanceUnit: 'km',
  language: 'es',
  weightIncrement: 2.5,
  restTime: 90,
};

// ─── Progression Suggestion ───
export interface Suggestion {
  suggestedWeight: number; // In user's unit
  suggestedReps: number;
  isLoadAlert: boolean;
  referenceText: string;
}
