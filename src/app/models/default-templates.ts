import { Template } from './interfaces';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'lunes-full-body-vertical',
    name: 'Lunes: Full Body (Vertical)',
    exercises: [
      { name: 'Dominadas o Jalón al pecho',          type: 'strength', tags: ['Back'] },
      { name: 'Press militar (mancuernas/máquina)',  type: 'strength', tags: ['Chest'] },
      { name: 'Elevaciones laterales',               type: 'strength', tags: ['Chest'] },
      { name: 'Prensa',                              type: 'strength', tags: ['Legs'] },
      { name: 'Curl de bíceps',                     type: 'strength', tags: ['Back'] },
    ],
  },
  {
    id: 'martes-recuperacion',
    name: 'Martes: Recuperación Activa',
    exercises: [
      { name: 'Trote suave (4 Km)',          type: 'cardio', tags: ['Cardio'] },
      { name: 'Práctica técnica de carrera', type: 'cardio', tags: ['Cardio'] },
    ],
  },
  {
    id: 'miercoles-pierna-core',
    name: 'Miércoles: Pierna y Core',
    exercises: [
      { name: 'Hip Thrust',                       type: 'strength', tags: ['Legs'] },
      { name: 'Curl Femoral',                     type: 'strength', tags: ['Legs'] },
      { name: 'Extensiones de Cuádriceps',        type: 'strength', tags: ['Legs'] },
      { name: 'Adductores y Abductores',          type: 'strength', tags: ['Legs'] },
      { name: 'Trabajo de Abs (Planchas, etc)',   type: 'strength', tags: [] },
    ],
  },
  {
    id: 'jueves-potencia',
    name: 'Jueves: Potencia y Prevención',
    exercises: [
      { name: 'Carrera a intervalos (4 Km)', type: 'cardio', tags: ['Cardio'] },
      { name: 'Elevaciones de punta (Aquiles)', type: 'strength', tags: ['Legs'] },
      { name: 'Isométricos de gemelo',          type: 'strength', tags: ['Legs'] },
    ],
  },
  {
    id: 'viernes-full-body-horizontal',
    name: 'Viernes: Full Body (Horizontal)',
    exercises: [
      { name: 'Press plano (máquina/mancuernas)',       type: 'strength', tags: ['Chest'] },
      { name: 'Remo en máquina (apoyo pecho)',          type: 'strength', tags: ['Back'] },
      { name: 'Flyes (Aperturas)',                      type: 'strength', tags: ['Chest'] },
      { name: 'Extensión de tríceps en polea',         type: 'strength', tags: ['Chest'] },
      { name: 'Peso muerto rumano o Curl femoral',     type: 'strength', tags: ['Legs'] },
    ],
  },
  {
    id: 'sabado-fondo',
    name: 'Sábado: Fondo',
    exercises: [
      { name: 'Correr al aire libre', type: 'cardio', tags: ['Cardio'] },
    ],
  },
  {
    id: 'protocolo-carrera',
    name: 'Protocolo: Calentamiento/Enfriamiento',
    exercises: [
      { name: 'Caminata de puntillas/talones',         type: 'cardio', tags: ['Cardio'] },
      { name: 'Balanceos de pierna',                   type: 'cardio', tags: ['Cardio'] },
      { name: 'Rodillas al pecho y talones a glúteos', type: 'cardio', tags: ['Cardio'] },
      { name: 'Estiramiento de isquiotibiales',        type: 'strength', tags: ['Legs'] },
      { name: 'Estiramiento de cuádriceps',            type: 'strength', tags: ['Legs'] },
      { name: 'Estiramiento de gemelos',               type: 'strength', tags: ['Legs'] },
    ],
  },
];
