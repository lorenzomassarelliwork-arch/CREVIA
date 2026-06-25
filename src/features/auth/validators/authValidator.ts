//--------------------------PER IL LOGIN--------------------------
export type RegisterForm = {
  nome: string;
  cognome: string;
  genere: string;
  dataNascita: string;
  email: string;
  mansione: string;
  settore: string;
  statoResidenza: string;
  cittaResidenza: string;
  statoDomicilio: string;
  cittaDomicilio: string;
  newsletter: boolean;
};

export type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;

export function validateLogin(email: string, password: string): string | null {
  if (!email.trim() || !password.trim()) {
    return "Inserisci email e password";
  }

  return null;
}

//--------------------------PER LA REGISTRAZIONE--------------------------
export function calcolaEta(dataStr: string): number {
  const [day, month, year] = dataStr.split('/');

  const nascita = new Date(`${year}-${month}-${day}`);
  const oggi = new Date();

  let eta = oggi.getFullYear() - nascita.getFullYear();

  const m = oggi.getMonth() - nascita.getMonth();

  if (
    m < 0 ||
    (m === 0 && oggi.getDate() < nascita.getDate())
  ) {
    eta--;
  }

  return eta;
}

export function validateRegister(form: RegisterForm): RegisterErrors {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const errors: RegisterErrors = {};

  if (!form.nome.trim()) {
    errors.nome = 'Inserisci il tuo nome';
  }

  if (!form.cognome.trim()) {
    errors.cognome = 'Inserisci il tuo cognome';
  }

  if (!form.dataNascita.trim()) {
    errors.dataNascita =
      'Inserisci la tua data di nascita';
  } else if (calcolaEta(form.dataNascita) < 18) {
    errors.dataNascita =
      'Devi avere almeno 18 anni per iscriverti';
  }

  if (!form.email.trim()) {
    errors.email = 'Inserisci la tua email';
  } else if (!emailRegex.test(form.email)) {
    errors.email =
      'Inserisci un formato email valido';
  }

  if (!form.mansione) {
    errors.mansione =
      'Seleziona cosa fai nella vita';
  }

  if (!form.statoResidenza) {
    errors.statoResidenza =
      'Seleziona lo stato di residenza';
  }

  if (!form.cittaResidenza) {
    errors.cittaResidenza =
      'Seleziona la città di residenza';
  }

  if (!form.statoDomicilio) {
    errors.statoDomicilio =
      'Seleziona lo stato di domicilio';
  }

  if (!form.cittaDomicilio) {
    errors.cittaDomicilio =
      'Seleziona la città di domicilio';
  }

  return errors;
}
