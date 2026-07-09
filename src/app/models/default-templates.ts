import { Template } from './interfaces';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'lunes-full-body-vertical',
    nombre: 'Lunes: Full Body (Vertical)',
    ejercicios: [
      { nombre: 'Dominadas o Jalón al pecho',          tipo: 'fuerza', tags: ['Espalda', 'Bíceps'] },
      { nombre: 'Press militar (mancuernas/máquina)',  tipo: 'fuerza', tags: ['Hombros', 'Tríceps'] },
      { nombre: 'Elevaciones laterales',               tipo: 'fuerza', tags: ['Hombros'] },
      { nombre: 'Prensa',                              tipo: 'fuerza', tags: ['Piernas'] },
      { nombre: 'Curl de bíceps',                     tipo: 'fuerza', tags: ['Bíceps'] },
    ],
  },
  {
    id: 'martes-recuperacion',
    nombre: 'Martes: Recuperación Activa',
    ejercicios: [
      { nombre: 'Trote suave (4 Km)',          tipo: 'cardio', tags: ['Cardio'] },
      { nombre: 'Práctica técnica de carrera', tipo: 'cardio', tags: ['Cardio'] },
    ],
  },
  {
    id: 'miercoles-pierna-core',
    nombre: 'Miércoles: Pierna y Core',
    ejercicios: [
      { nombre: 'Hip Thrust',                       tipo: 'fuerza', tags: ['Glúteos', 'Piernas'] },
      { nombre: 'Curl Femoral',                     tipo: 'fuerza', tags: ['Piernas'] },
      { nombre: 'Extensiones de Cuádriceps',        tipo: 'fuerza', tags: ['Piernas'] },
      { nombre: 'Adductores y Abductores',          tipo: 'fuerza', tags: ['Piernas', 'Glúteos'] },
      { nombre: 'Trabajo de Abs (Planchas, etc)',   tipo: 'fuerza', tags: ['Core'] },
    ],
  },
  {
    id: 'jueves-potencia',
    nombre: 'Jueves: Potencia y Prevención',
    ejercicios: [
      { nombre: 'Carrera a intervalos (4 Km)', tipo: 'cardio', tags: ['Cardio'] },
      { nombre: 'Elevaciones de punta (Aquiles)', tipo: 'fuerza', tags: ['Piernas'] },
      { nombre: 'Isométricos de gemelo',          tipo: 'fuerza', tags: ['Piernas'] },
    ],
  },
  {
    id: 'viernes-full-body-horizontal',
    nombre: 'Viernes: Full Body (Horizontal)',
    ejercicios: [
      { nombre: 'Press plano (máquina/mancuernas)',       tipo: 'fuerza', tags: ['Pecho', 'Tríceps'] },
      { nombre: 'Remo en máquina (apoyo pecho)',          tipo: 'fuerza', tags: ['Espalda', 'Bíceps'] },
      { nombre: 'Flyes (Aperturas)',                      tipo: 'fuerza', tags: ['Pecho'] },
      { nombre: 'Extensión de tríceps en polea',         tipo: 'fuerza', tags: ['Tríceps'] },
      { nombre: 'Peso muerto rumano o Curl femoral',     tipo: 'fuerza', tags: ['Piernas', 'Glúteos'] },
    ],
  },
  {
    id: 'sabado-fondo',
    nombre: 'Sábado: Fondo',
    ejercicios: [
      { nombre: 'Correr al aire libre', tipo: 'cardio', tags: ['Cardio'] },
    ],
  },
  {
    id: 'protocolo-carrera',
    nombre: 'Protocolo: Calentamiento/Enfriamiento',
    ejercicios: [
      { nombre: 'Caminata de puntillas/talones',         tipo: 'cardio', tags: ['Cardio'] },
      { nombre: 'Balanceos de pierna',                   tipo: 'cardio', tags: ['Cardio'] },
      { nombre: 'Rodillas al pecho y talones a glúteos', tipo: 'cardio', tags: ['Cardio'] },
      { nombre: 'Estiramiento de isquiotibiales',        tipo: 'fuerza', tags: ['Piernas'] },
      { nombre: 'Estiramiento de cuádriceps',            tipo: 'fuerza', tags: ['Piernas'] },
      { nombre: 'Estiramiento de gemelos',               tipo: 'fuerza', tags: ['Piernas'] },
    ],
  },
];
