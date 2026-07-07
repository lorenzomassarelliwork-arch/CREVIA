import { RegisterForm } from '../features/auth/validators/authValidator';
import type { AppLanguage } from '../theme/AppPreferencesProvider';

/**
 * Interfacce per i modelli dati
 */
export interface Profilo {
  nome: string;
  ruolo: string;
  bio: string;
  foto: string | null;
  collegamenti: number;
  seguaci: number;
  dataNascita: string;
  nazione: string;
  citta: string;
  settore: string;
  privacyDataNascita: boolean;
  privacyNazione: boolean;
  privacyCitta: boolean;
}

export interface Esperienza {
  id: string;
  titolo: string;
  progetto: string;
  inizio: Date;
  fine: Date | null;
  inCorso: boolean;
}

export interface Progetto {
  id: string;
  nome: string;
  settore: string;
  citta: string;
  bio: string;
  foto: string | null;
  collaboratori: string;
  ruoloUtente: string;
}

export interface Post {
  id: string;
  azienda: string;
  settore: string;
  descrizione: string;
  tempo: string;
  builders: number;
  language?: AppLanguage;
}

/**
 * Interfaccia standard per le risposte API
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// --- DATI MOCK ---
const _profilo: Profilo = {
  nome: 'Lorenzo Rossi',
  ruolo: 'Sviluppatore Mobile',
  bio: 'Appassionato di tecnologia e sviluppo mobile. Cerco opportunità per crescere e collaborare con startup innovative.',
  foto: null,
  collegamenti: 24,
  seguaci: 12,
  dataNascita: '15/05/2002',
  nazione: 'Italia',
  citta: 'Milano',
  settore: 'Tecnologia',
  privacyDataNascita: true,
  privacyNazione: true,
  privacyCitta: true,
};

const _esperienze: Esperienza[] = [
  {
    id: '1',
    titolo: 'Sviluppatore Frontend',
    progetto: 'TechStart Milano',
    inizio: new Date(2024, 0, 1),
    fine: null,
    inCorso: true,
  },
  {
    id: '2',
    titolo: 'UI Designer',
    progetto: 'DesignHub',
    inizio: new Date(2023, 2, 1),
    fine: new Date(2023, 11, 31),
    inCorso: false,
  },
];

const _progetti: Progetto[] = [
  {
    id: '1',
    nome: 'TechStart Milano',
    settore: 'Tecnologia',
    citta: 'Milano',
    bio: 'La community dei giovani innovatori a Milano.',
    foto: null,
    collaboratori: 'Lorenzo Rossi (Creatore), Marco Rossi',
    ruoloUtente: 'Founder',
  },
  {
    id: '2',
    nome: 'DesignHub',
    settore: 'Design & UX',
    citta: 'Roma',
    bio: 'Spazio creativo per designer under 25.',
    foto: null,
    collaboratori: 'Sara Bianchi (Creatore), Lorenzo Rossi',
    ruoloUtente: 'Seguace',
  },
];

export const getProfilo = async (): Promise<ApiResponse<Profilo>> => {
  return { data: _profilo, error: null };
};

export const updateProfilo = async (nuoviDati: Partial<Profilo>): Promise<ApiResponse<Partial<Profilo>>> => {
  return { data: nuoviDati, error: null };
};

export const getEsperienze = async (): Promise<ApiResponse<Esperienza[]>> => {
  return { data: _esperienze, error: null };
};

export const addEsperienza = async (esperienza: Omit<Esperienza, 'id'>): Promise<ApiResponse<Esperienza>> => {
  const nuova: Esperienza = { ...esperienza, id: Date.now().toString() };
  return { data: nuova, error: null };
};

export const updateEsperienza = async (esperienza: Esperienza): Promise<ApiResponse<Esperienza>> => {
  return { data: esperienza, error: null };
};

export const deleteEsperienza = async (id: string): Promise<ApiResponse<string>> => {
  return { data: id, error: null };
};

export const getProgetti = async (): Promise<ApiResponse<Progetto[]>> => {
  return { data: _progetti, error: null };
};

export const addProgetto = async (progetto: Omit<Progetto, 'id'>): Promise<ApiResponse<Progetto>> => {
  const nuovo: Progetto = { ...progetto, id: Date.now().toString() };
  return { data: nuovo, error: null };
};

export const updateProgetto = async (progetto: Progetto): Promise<ApiResponse<Progetto>> => {
  return { data: progetto, error: null };
};

export const deleteProgetto = async (id: string): Promise<ApiResponse<string>> => {
  return { data: id, error: null };
};

export const resetPassword = async (email: string): Promise<ApiResponse<{ email: string }>> => {
  return { data: { email }, error: null };
};

export const getFeed = async (): Promise<ApiResponse<Post[]>> => {
  return {
    data: [
      {
        id: '1',
        azienda: 'TechStart Milano',
        settore: 'Tecnologia',
        descrizione: 'Cerchiamo un giovane sviluppatore appassionato di AI per collaborare al lancio della nostra piattaforma.',
        tempo: '2 ore fa',
        builders: 12,
        language: 'it',
      },
      {
        id: '2',
        azienda: 'GreenFuture',
        settore: 'Sostenibilità',
        descrizione: 'Startup in fase embrionale cerca collaboratori creativi per sviluppare soluzioni green nel settore energetico.',
        tempo: '5 ore fa',
        builders: 8,
        language: 'it',
      },
      {
        id: '3',
        azienda: 'DesignHub',
        settore: 'Design & UX',
        descrizione: 'Progetto innovativo nel mondo del design cerca talenti under 25 con voglia di fare esperienza reale.',
        tempo: '1 giorno fa',
        builders: 24,
        language: 'it',
      },
      {
        id: '4',
        azienda: 'FinLab',
        settore: 'Fintech',
        descrizione: 'Cerchiamo giovani appassionati di finanza e tecnologia per rivoluzionare i pagamenti digitali.',
        tempo: '2 giorni fa',
        builders: 6,
        language: 'it',
      },
    ],
    error: null,
  };
};

export const login = async (email: string, password: string): Promise<ApiResponse<{ email: string }>> => {
  return { data: { email }, error: null };
};

export const register = async (datiUtente: RegisterForm): Promise<ApiResponse<RegisterForm>> => {
  return { data: datiUtente, error: null };
};
