import { Template } from './interfaces';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'lunes-full-body-vertical',
    nombre: 'Lunes: Full Body (Vertical)',
    ejercicios: [
      { nombre: 'Dominadas o Jalón al pecho', tipo: 'fuerza' },
      { nombre: 'Press militar (mancuernas/máquina)', tipo: 'fuerza' },
      { nombre: 'Elevaciones laterales', tipo: 'fuerza' },
      { nombre: 'Prensa', tipo: 'fuerza' },
      { nombre: 'Curl de bíceps', tipo: 'fuerza' }
    ]
  },
  {
    id: 'martes-recuperacion',
    nombre: 'Martes: Recuperación Activa',
    ejercicios: [
      { nombre: 'Trote suave (4 Km)', tipo: 'cardio' },
      { nombre: 'Práctica técnica de carrera', tipo: 'cardio' }
    ]
  },
  {
    id: 'miercoles-pierna-core',
    nombre: 'Miércoles: Pierna y Core',
    ejercicios: [
      { nombre: 'Hip Thrust', tipo: 'fuerza' },
      { nombre: 'Curl Femoral', tipo: 'fuerza' },
      { nombre: 'Extensiones de Cuádriceps', tipo: 'fuerza' },
      { nombre: 'Adductores y Abductores', tipo: 'fuerza' },
      { nombre: 'Trabajo de Abs (Planchas, etc)', tipo: 'fuerza' }
    ]
  },
  {
    id: 'jueves-potencia',
    nombre: 'Jueves: Potencia y Prevención',
    ejercicios: [
      { nombre: 'Carrera a intervalos (4 Km)', tipo: 'cardio' },
      { nombre: 'Elevaciones de punta (Aquiles)', tipo: 'fuerza' },
      { nombre: 'Isométricos de gemelo', tipo: 'fuerza' }
    ]
  },
  {
    id: 'viernes-full-body-horizontal',
    nombre: 'Viernes: Full Body (Horizontal)',
    ejercicios: [
      { nombre: 'Press plano (máquina/mancuernas)', tipo: 'fuerza' },
      { nombre: 'Remo en máquina (apoyo pecho)', tipo: 'fuerza' },
      { nombre: 'Flyes (Aperturas)', tipo: 'fuerza' },
      { nombre: 'Extensión de tríceps en polea', tipo: 'fuerza' },
      { nombre: 'Peso muerto rumano o Curl femoral', tipo: 'fuerza' }
    ]
  },
  {
    id: 'sabado-fondo',
    nombre: 'Sábado: Fondo',
    ejercicios: [
      { nombre: 'Correr al aire libre', tipo: 'cardio' }
    ]
  },
  {
    id: 'protocolo-carrera',
    nombre: 'Protocolo: Calentamiento/Enfriamiento',
    ejercicios: [
      { nombre: 'Caminata de puntillas/talones', tipo: 'cardio' },
      { nombre: 'Balanceos de pierna', tipo: 'cardio' },
      { nombre: 'Rodillas al pecho y talones a glúteos', tipo: 'cardio' },
      { nombre: 'Estiramiento de isquiotibiales', tipo: 'fuerza' },
      { nombre: 'Estiramiento de cuádriceps', tipo: 'fuerza' },
      { nombre: 'Estiramiento de gemelos', tipo: 'fuerza' }
    ]
  }
];
