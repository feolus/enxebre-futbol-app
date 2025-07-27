import type { Player, PlayerEvaluation, TrainingSession, CalendarEvent } from '../types';

const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const mockPlayers: Player[] = [
  {
    id: 'p1',
    name: 'Álex López',
    lastName: 'López',
    nickname: 'El Mago',
    idNumber: '12345678A',
    jerseyNumber: 10,
    position: 'Delantero',
    photoUrl: 'https://picsum.photos/seed/p1/200/200',
    previousClub: 'Juveniles FC',
    observations: 'Gran potencial en jugadas a balón parado.',
    password: 'player123',
    documents: {
        dniFrontUrl: '#',
        dniBackUrl: '#',
        idPhotoUrl: '#'
    },
    personalInfo: { age: 24, height: "185cm", weight: "80kg" },
    medicalInfo: { status: 'Activo', notes: 'Sin problemas.' }
    contactInfo: { email: 'alex.l@example.com', phone: '123-456-7890' },
    parentInfo: { fatherNamePhone: 'Juan López - 555-0101', motherNamePhone: 'Ana Pérez - 555-0102', parentEmail: 'padres.lopez@example.com' },
  },
  {
    id: 'p2',
    name: 'Benito García',
    lastName: 'García',
    nickname: 'Ben',
    idNumber: '87654321B',
    jerseyNumber: 8,
    position: 'Mediocampista',
    photoUrl: 'https://picsum.photos/seed/p2/200/200',
    previousClub: 'CD Valiente',
    observations: 'Excelente visión de juego.',
    password: 'player123',
    documents: {
        dniFrontUrl: '#',
        dniBackUrl: '#',
        idPhotoUrl: '#'
    },
    personalInfo: { age: 22, height: "178cm", weight: "75kg" },
    medicalInfo: { status: 'Activo', notes: 'Esguince leve de tobillo el mes pasado, totalmente recuperado.' },
    contactInfo: { email: 'benito.g@example.com', phone: '123-456-7891' },
    parentInfo: { fatherNamePhone: 'Luis García - 555-0201', motherNamePhone: 'María Torres - 555-0202', parentEmail: 'padres.garcia@example.com' },
  },
  {
    id: 'p3',
    name: 'Carla Díaz',
    lastName: 'Díaz',
    nickname: 'La Roca',
    idNumber: '11223344C',
    jerseyNumber: 4,
    position: 'Defensa',
    photoUrl: 'https://picsum.photos/seed/p3/200/200',
    previousClub: 'Unión Deportiva',
    observations: 'Fuerte en el uno contra uno.',
    password: 'player123',
    documents: {
        dniFrontUrl: '#',
        dniBackUrl: '#',
        idPhotoUrl: '#'
    },
    personalInfo: { age: 26, height: "180cm", weight: "78kg" },
    medicalInfo: { status: 'Lesionado', notes: 'Distensión de isquiotibiales. Recuperación prevista: 2 semanas.' },
    contactInfo: { email: 'carla.d@example.com', phone: '123-456-7892' },
    parentInfo: { fatherNamePhone: 'Pedro Díaz - 555-0301', motherNamePhone: 'Sara Ramos - 555-0302', parentEmail: 'padres.diaz@example.com' },
  },
  {
    id: 'p4',
    name: 'David Egea',
    lastName: 'Egea',
    nickname: 'El Muro',
    idNumber: '44556677D',
    jerseyNumber: 1,
    position: 'Portero',
    photoUrl: 'https://picsum.photos/seed/p4/200/200',
    previousClub: 'CF Metrópolis',
    observations: 'Buenos reflejos y liderazgo.',
    password: 'player123',
    documents: {
        dniFrontUrl: '#',
        dniBackUrl: '#',
        idPhotoUrl: '#'
    },
    personalInfo: { age: 28, height: "190cm", weight: "85kg" },
    medicalInfo: { status: 'Activo', notes: 'Sin problemas.' },
    contactInfo: { email: 'david.e@example.com', phone: '123-456-7893' },
    parentInfo: { fatherNamePhone: 'Jorge Egea - 555-0401', motherNamePhone: 'Laura Sanz - 555-0402', parentEmail: 'padres.egea@example.com' },
  },
  {
    id: 'p5',
    name: 'Eva Gallardo',
    lastName: 'Gallardo',
    nickname: 'Speedy',
    idNumber: '99887766E',
    jerseyNumber: 7,
    position: 'Mediocampista',
    photoUrl: 'https://picsum.photos/seed/p5/200/200',
    previousClub: 'Sporting Capital',
    observations: 'Muy rápida y con gran resistencia.',
    password: 'player123',
    documents: {
        dniFrontUrl: '#',
        dniBackUrl: '#',
        idPhotoUrl: '#'
    },
    personalInfo: { age: 23, height: "175cm", weight: "68kg" },
    medicalInfo: { status: 'Activo', notes: 'En plena forma.' },
    contactInfo: { email: 'eva.g@example.com', phone: '123-456-7894' },
    parentInfo: { fatherNamePhone: 'Miguel Gallardo - 555-0501', motherNamePhone: 'Isabel Romero - 555-0502', parentEmail: 'padres.gallardo@example.com' },
  }
];


export const mockEvaluations: PlayerEvaluation[] = [
  { id: 'e1', playerId: 'p1', date: '2024-05-01', metrics: { agility: 17.5, speed: 4.6, endurance: 4250, flexibility: 15 } },
  { id: 'e2', playerId: 'p1', date: '2024-06-01', metrics: { agility: 17.2, speed: 4.5, endurance: 4400, flexibility: 16 } },
  { id: 'e3', playerId: 'p1', date: '2024-07-01', metrics: { agility: 17.0, speed: 4.45, endurance: 4500, flexibility: 16 } },
  { id: 'e4', playerId: 'p2', date: '2024-05-01', metrics: { agility: 18.2, speed: 4.7, endurance: 4600, flexibility: 20 } },
  { id: 'e5', playerId: 'p2', date: '2024-06-01', metrics: { agility: 18.0, speed: 4.65, endurance: 4650, flexibility: 21 } },
  { id: 'e6', playerId: 'p2', date: '2024-07-01', metrics: { agility: 17.8, speed: 4.6, endurance: 4750, flexibility: 22 } },
  { id: 'e7', playerId: 'p3', date: '2024-05-01', metrics: { agility: 19.0, speed: 5.0, endurance: 4000, flexibility: 14 } },
  { id: 'e8', playerId: 'p3', date: '2024-06-01', metrics: { agility: 18.8, speed: 4.9, endurance: 4100, flexibility: 14 } },
  { id: 'e9', playerId: 'p3', date: '2024-07-01', metrics: { agility: 19.5, speed: 5.1, endurance: 3900, flexibility: 12 } },
  { id: 'e10', playerId: 'p4', date: '2024-05-01', metrics: { agility: 20.5, speed: 5.5, endurance: 3750, flexibility: 10 } },
  { id: 'e11', playerId: 'p4', date: '2024-06-01', metrics: { agility: 20.1, speed: 5.4, endurance: 3800, flexibility: 11 } },
  { id: 'e12', playerId: 'p4', date: '2024-07-01', metrics: { agility: 19.8, speed: 5.35, endurance: 3900, flexibility: 12 } },
  { id: 'e13', playerId: 'p5', date: '2024-05-01', metrics: { agility: 16.5, speed: 4.5, endurance: 4700, flexibility: 25 } },
  { id: 'e14', playerId: 'p5', date: '2024-06-01', metrics: { agility: 16.2, speed: 4.45, endurance: 4750, flexibility: 25 } },
  { id: 'e15', playerId: 'p5', date: '2024-07-01', metrics: { agility: 16.0, speed: 4.4, endurance: 4800, flexibility: 26 } },
];

export const mockTrainingSessions: TrainingSession[] = [
  {
    id: 'ts1',
    date: toYYYYMMDD(new Date(new Date().setDate(new Date().getDate() + 1))), 
    title: 'Resistencia y Agilidad',
    warmup: [{ id: 'w1', name: 'Estiramientos Dinámicos', duration: '15 min', description: 'Balanceo de piernas, giros de torso, círculos con los brazos.' }],
    mainExercises: [
      { id: 'm1', name: 'Ejercicios de Conos', sets: 5, reps: '4 conos', description: 'Sprint adelante, desplazamiento lateral, retroceso, desplazamiento lateral.' },
      { id: 'm2', name: 'Sprints Interválicos', sets: 8, reps: '100m', description: 'Sprint de 100m, descanso de 30s.' }
    ],
    cooldown: [{ id: 'c1', name: 'Estiramientos Estáticos', duration: '10 min', description: 'Mantener cada estiramiento por 30 segundos.' }]
  },
  {
    id: 'ts2',
    date: toYYYYMMDD(new Date(new Date().setDate(new Date().getDate() + 3))),
    title: 'Fuerza y Potencia',
    warmup: [{ id: 'w2', name: 'Trote Ligero y Activación', duration: '15 min', description: 'Trote de 5 mins, luego puentes de glúteos y caminata con bandas.' }],
    mainExercises: [
      { id: 'm3', name: 'Sentadillas', sets: 4, reps: '8-10', description: 'Enfocarse en la técnica, bajar profundo.' },
      { id: 'm4', name: 'Press de Banca', sets: 4, reps: '8-10', description: 'Movimientos controlados.' },
      { id: 'm5', name: 'Saltos Pliométricos', sets: 5, reps: '5 saltos', description: 'Saltos al cajón, enfocarse en la potencia explosiva.' }
    ],
    cooldown: [{ id: 'c2', name: 'Rodillo de Espuma', duration: '10 min', description: 'Trabajar cuádriceps, isquiotibiales y espalda.' }]
  }
];

const getISODate = (dayOffset: number): string => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);
    return toYYYYMMDD(date);
};

export const mockCalendarEvents: Omit<CalendarEvent, 'id'>[] = [
    {
        date: getISODate(-12),
        type: 'matchResult',
        title: 'Resultado: vs Montaña FC',
        opponent: 'Montaña FC',
        result: '2-2',
        locationType: 'away',
        squad: { calledUp: ['p1', 'p2', 'p3', 'p4', 'p5'], notCalledUp: [] }
    },
    {
        date: getISODate(-5),
        type: 'matchResult',
        title: 'Resultado: vs Viejos Rivales',
        opponent: 'Viejos Rivales',
        result: '3-1',
        locationType: 'home',
        scorers: ['p1', 'p1', 'p5'],
        assists: ['p2', 'p5'], 
        squad: {
            calledUp: ['p1', 'p2', 'p4', 'p5'],
            notCalledUp: ['p3']
        }
    },
    {
        date: getISODate(-2),
        type: 'training',
        title: 'Entrenamiento Táctico',
        trainingSessionId: 'ts2',
        playerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
    },
    {
        date: getISODate(-1),
        endDate: getISODate(10), 
        type: 'injury',
        title: 'Lesión: Carla Díaz',
        playerId: 'p3',
        reason: 'Distensión de isquiotibiales.'
    },
    {
        date: getISODate(1),
        type: 'training',
        title: 'Resistencia y Agilidad',
        trainingSessionId: 'ts1',
        playerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
    },
    {
        date: getISODate(2),
        type: 'personal',
        title: 'Ausencia: Benito García',
        playerIds: ['p2'],
        reason: 'Asuntos personales'
    },
    {
        date: getISODate(5),
        type: 'match',
        title: `vs CF Ciudad`,
        time: '17:00',
        opponent: 'CF Ciudad',
        venue: 'Estadio Local',
        meetingPoint: 'Entrada principal del estadio',
        meetingTime: '15:30',
        squad: {
            calledUp: ['p1', 'p2', 'p4', 'p5'],
            notCalledUp: ['p3']
        },
        locationType: 'home'
    }
];