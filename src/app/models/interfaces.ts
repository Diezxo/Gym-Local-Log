// ─── Tipos de Ejercicio ───
export type TipoEjercicio = 'fuerza' | 'cardio';

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
