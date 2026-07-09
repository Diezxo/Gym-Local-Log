// ─── Tipos de Ejercicio ───
export type TipoEjercicio = 'fuerza' | 'cardio';

// ─── Tags Musculares / de Tipo ───
export type MuscleTag =
  | 'Pecho'
  | 'Espalda'
  | 'Piernas'
  | 'Cardio';

export const MUSCLE_TAGS: MuscleTag[] = [
  'Pecho', 'Espalda', 'Piernas', 'Cardio',
];

// Colores para cada tag
export const TAG_COLORS: Record<MuscleTag, { bg: string; text: string; border: string }> = {
  'Pecho':     { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  'Espalda':   { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  'Piernas':   { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  'Cardio':    { bg: 'rgba(34,211,238,0.12)',  text: '#22d3ee', border: 'rgba(34,211,238,0.25)' },
};

// ─── Unidades ───
export type UnidadPeso = 'kg' | 'lb';
export type UnidadDistancia = 'km' | 'mi';
export type Idioma = 'es' | 'en';

// ─── Series y Logs ───
export interface SerieFuerza {
  numero: number;
  reps: number;
  peso: number;
}

export interface LogCardio {
  distanciaKm: number;
  tiempoMinutos: number;
  notasTecnica?: string;
}

// ─── Ejercicio Base (para templates) ───
export interface EjercicioBase {
  nombre: string;
  tipo: TipoEjercicio;
  tags?: MuscleTag[]; // Grupos musculares / tipo
}

// ─── Template / Plantilla ───
export interface Template {
  id: string;
  nombre: string;
  ejercicios: EjercicioBase[];
}

// ─── Log de un Ejercicio Individual ───
export interface EjercicioLog {
  nombre: string;
  tipo: TipoEjercicio;
  tags?: MuscleTag[]; // Copiado del template al registrar
  series?: SerieFuerza[];
  cardio?: LogCardio;
}

// ─── Log Diario ───
export interface LogDiario {
  fecha: string; // Formato YYYY-MM-DD
  templateId: string;
  ejercicios: EjercicioLog[];
  notas?: string;
}

// ─── Archivo Mensual ───
export interface ArchivoMensual {
  mesId: string; // Formato YYYY-MM
  logs: LogDiario[];
}

// ─── Configuración de Usuario ───
export interface UserSettings {
  unidadPeso: UnidadPeso;
  unidadDistancia: UnidadDistancia;
  idioma: Idioma;
  incrementoPeso: number; // default 2.5
  tiempoDescanso: number; // default 90 (segundos)
}

export const DEFAULT_SETTINGS: UserSettings = {
  unidadPeso: 'kg',
  unidadDistancia: 'km',
  idioma: 'es',
  incrementoPeso: 2.5,
  tiempoDescanso: 90,
};

// ─── Sugerencia de Progresión ───
export interface Sugerencia {
  pesoSugerido: number;
  repsSugeridas: number;
  esAlertaCarga: boolean;
  textoReferencia: string;
}
