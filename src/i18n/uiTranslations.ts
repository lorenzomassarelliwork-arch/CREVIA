import type { AppLanguage } from '../theme/AppPreferencesProvider';

const IT_TO_EN: Record<string, string> = {
  'Per te': 'For you',
  'Unisciti': 'Join',
  'Cerca': 'Search',
  'Profilo': 'Profile',
  'Cerca persone o progetti...': 'Search people or projects...',
  'Tutti': 'All',
  'Persone': 'People',
  'Progetti': 'Projects',
  'Cerca su CREVIA': 'Search CREVIA',
  'Trova persone, builders e progetti': 'Find people, builders and projects',
  'Nessun risultato': 'No results',
  'Prova con un altro termine': 'Try another search term',
  '+ Builder': '+ Builder',
  'Trova il progetto giusto per te': 'Find the right project for you',
  'Password dimenticata?': 'Forgot your password?',
  'Accedi': 'Sign in',
  'Sei un nuovo utente?': 'New to Crevia?',
  'Registrati': 'Sign up',
  'Inserisci la tua email e ti invieremo un link per reimpostare la password.':
    'Enter your email and we will send you a password reset link.',
  'Invia link di reset': 'Send reset link',
  'Torna al': 'Back to',
  'Email inviata!': 'Email sent!',
  'Abbiamo inviato il link per reimpostare la password a':
    'We sent the password reset link to',
  'Torna al Login': 'Back to sign in',
  'Crea il tuo account': 'Create your account',
  'Nome *': 'First name *',
  'Cognome *': 'Last name *',
  'Genere': 'Gender',
  'Uomo': 'Man',
  'Donna': 'Woman',
  'Non binario': 'Non-binary',
  'Preferisco non dirlo': 'Prefer not to say',
  'Data di nascita *': 'Date of birth *',
  'Seleziona data': 'Select date',
  'Cosa fai nella vita? *': 'What do you do? *',
  '🎓 Studente': '🎓 Student',
  '💼 Lavoratore': '💼 Worker',
  'Stato di residenza *': 'Country of residence *',
  'Città di residenza *': 'City of residence *',
  'Stato di domicilio *': 'Domicile country *',
  'Città di domicilio *': 'Domicile city *',
  'Seleziona città': 'Select city',
  'Prima seleziona lo stato': 'Select a country first',
  'Cerca stato...': 'Search country...',
  'Cerca città...': 'Search city...',
  'Voglio iscrivermi alla newsletter di CREVIA':
    'I want to subscribe to the CREVIA newsletter',
  'Ho letto e accetto i': 'I have read and accept the',
  'di CREVIA *': 'of CREVIA *',
  'Devi leggere e accettare i termini e condizioni':
    'You must read and accept the terms and conditions',
  'Settore di interesse (facoltativo)': 'Field of interest (optional)',
  'Seleziona stato': 'Select country',
  'Termini e Condizioni': 'Terms and Conditions',
  'Crea account': 'Create account',
  'Hai già un account?': 'Already have an account?',
  'Mio Profilo': 'My Profile',
  'Foto caricata': 'Photo uploaded',
  'Nome e Cognome': 'Full name',
  'Qualifica / Ruolo': 'Title / Role',
  'Biografia': 'Bio',
  'Annulla': 'Cancel',
  'Collegamenti': 'Connections',
  'Seguaci': 'Followers',
  'Dati Personali Anagrafici': 'Personal Details',
  "L'icona indica lo stato di visibilità pubblica del dato":
    'The icon shows whether the information is publicly visible',
  'Data di Nascita': 'Date of birth',
  'Nazione': 'Country',
  'Città di Residenza': 'City of residence',
  'Esperienze': 'Experience',
  'Aggiungi contenuto': 'Add content',
  'Scegli se creare un nuovo progetto o una nuova esperienza professionale.':
    'Choose whether to create a project or add professional experience.',
  'Nuovo progetto': 'New project',
  'Nuova esperienza': 'New experience',
  'Aggiorna Foto Profilo': 'Update profile photo',
  'Scatta Nuova Foto': 'Take a new photo',
  'Seleziona dalla Galleria': 'Choose from gallery',
  'Nuovo Progetto': 'New Project',
  'Nome del Progetto *': 'Project name *',
  'Nome': 'Name',
  'Settore di Interesse *': 'Field of interest *',
  'Settore': 'Field',
  'Città di Riferimento *': 'Reference city *',
  'Città': 'City',
  'Collaboratori': 'Collaborators',
  'Crea e apri progetto': 'Create and open project',
  'Modifica Progetto': 'Edit Project',
  'Nome Progetto': 'Project name',
  'Salva Modifiche': 'Save changes',
  'Elimina Progetto': 'Delete project',
  'Modifica Esperienza': 'Edit Experience',
  'Mansione / Ruolo *': 'Position / Role *',
  'Settore *': 'Field *',
  'Progetto di riferimento *': 'Related project *',
  'Nome progetto': 'Project name',
  'Società / Progetto *': 'Company / Project *',
  'Breve descrizione': 'Short description',
  'Collaborazione in corso': 'Ongoing collaboration',
  'Data di Inizio *': 'Start date *',
  'Data di Fine *': 'End date *',
  'Elimina Esperienza': 'Delete experience',
  'Sei sicuro di voler eliminare definitivamente questo progetto?':
    'Are you sure you want to permanently delete this project?',
  'Sei sicuro di voler eliminare definitivamente questa esperienza?':
    'Are you sure you want to permanently delete this experience?',
  'Elimina': 'Delete',
  'Scorri fino in fondo per accettare': 'Scroll to the bottom to accept',
  'Ultimo aggiornamento: Maggio 2026': 'Last updated: May 2026',
  '1. Introduzione': '1. Introduction',
  '2. Dati Personali': '2. Personal Data',
  '3. Utilizzo della Piattaforma': '3. Use of the Platform',
  '4. Responsabilità': '4. Liability',
  '5. Proprietà Intellettuale': '5. Intellectual Property',
  '6. Contatti': '6. Contacts',
  'Ho compreso e accetto': 'I understand and accept',
  'Scorri per continuare': 'Scroll to continue',
  'Chiudi': 'Close',
  "Benvenuto su CREVIA. La presente applicazione è un hub che mette in contatto giovani in cerca di esperienza professionale con creatori di progetti e startup in fase embrionale. Utilizzando CREVIA, accetti i presenti Termini e Condizioni d'uso. Ti invitiamo a leggerli attentamente prima di procedere con la registrazione.":
    'Welcome to CREVIA. This application connects young people seeking professional experience with project creators and early-stage startups. By using CREVIA, you accept these Terms and Conditions. Please read them carefully before registering.',
  "CREVIA si riserva il diritto di modificare i presenti termini in qualsiasi momento. Gli utenti verranno notificati di eventuali modifiche significative tramite email o notifica in-app. L'utilizzo continuato della piattaforma dopo tali modifiche costituisce accettazione dei nuovi termini.":
    'CREVIA may amend these terms at any time. Users will be notified of significant changes by email or in-app notification. Continued use of the platform after a change constitutes acceptance of the updated terms.',
  'CREVIA raccoglie e tratta i dati personali degli utenti nel rispetto del Regolamento Europeo sulla Protezione dei Dati (GDPR - Reg. UE 2016/679). I dati raccolti durante la registrazione includono: nome, cognome, data di nascita, email, città di residenza e domicilio, settore di interesse e mansione attuale.':
    'CREVIA collects and processes personal data in compliance with the European General Data Protection Regulation (GDPR - EU Regulation 2016/679). Registration data includes name, surname, date of birth, email, city of residence, field of interest and current position.',
  "I dati personali vengono utilizzati esclusivamente per fornire i servizi della piattaforma, migliorare l'esperienza utente e, previo consenso esplicito, inviare comunicazioni via newsletter. I dati non vengono venduti a terzi in nessun caso. L'utente ha diritto di accesso, rettifica, cancellazione e portabilità dei propri dati in qualsiasi momento contattando il team CREVIA.":
    'Personal data is used only to provide platform services, improve the user experience and, with explicit consent, send newsletters. Data is never sold to third parties. Users may request access, correction, deletion and portability of their data by contacting the CREVIA team.',
  "CREVIA è riservato a utenti maggiorenni (18 anni compiuti). L'utente si impegna a fornire informazioni veritiere e aggiornate durante la registrazione e nell'utilizzo della piattaforma. È vietato creare account falsi, impersonare altre persone o organizzazioni, o utilizzare la piattaforma per scopi illeciti.":
    'CREVIA is intended for adults aged 18 or over. Users must provide truthful, current information during registration and while using the platform. Fake accounts, impersonation and unlawful use are prohibited.',
  'Gli utenti sono responsabili di tutti i contenuti pubblicati sulla piattaforma. È vietato pubblicare contenuti offensivi, discriminatori, illegali o che violino diritti di terzi. CREVIA si riserva il diritto di rimuovere contenuti inappropriati e sospendere o eliminare account che violino queste regole senza preavviso.':
    'Users are responsible for all content they publish. Offensive, discriminatory, illegal content or content that violates third-party rights is prohibited. CREVIA may remove inappropriate content and suspend or delete accounts that breach these rules without notice.',
  "La funzione di matching tra utenti e progetti è fornita a titolo indicativo. CREVIA non garantisce la compatibilità tra utenti e progetti né l'esito di eventuali collaborazioni nate attraverso la piattaforma.":
    'Matching between users and projects is provided for guidance only. CREVIA does not guarantee compatibility or the outcome of collaborations started through the platform.',
  "CREVIA non è responsabile per eventuali danni diretti o indiretti derivanti dall'utilizzo della piattaforma, inclusi ma non limitati a: perdita di dati, interruzioni del servizio, comportamenti scorretti di altri utenti o mancato raggiungimento di opportunità professionali.":
    'CREVIA is not liable for direct or indirect damage arising from use of the platform, including data loss, service interruptions, misconduct by other users or missed professional opportunities.',
  'CREVIA si impegna a garantire la disponibilità del servizio nella misura del possibile, ma non può essere ritenuta responsabile per interruzioni tecniche, manutenzioni programmate o eventi al di fuori del proprio controllo. Il servizio è fornito "così com\'è" senza garanzie di alcun tipo.':
    'CREVIA aims to keep the service available but is not liable for technical interruptions, scheduled maintenance or events beyond its control. The service is provided “as is” without warranties.',
  "Tutti i contenuti, il design, il logo e il nome CREVIA sono di proprietà esclusiva della società. È vietata qualsiasi riproduzione, distribuzione o utilizzo non autorizzato dei contenuti della piattaforma. Gli utenti mantengono la proprietà intellettuale dei contenuti da loro pubblicati, ma concedono a CREVIA una licenza non esclusiva per la loro visualizzazione all'interno della piattaforma.":
    'All CREVIA content, design, logos and names are owned exclusively by the company. Unauthorized reproduction, distribution or use is prohibited. Users retain ownership of their content while granting CREVIA a non-exclusive license to display it on the platform.',
  "Per qualsiasi domanda relativa ai presenti Termini e Condizioni, alla Privacy Policy o all'utilizzo della piattaforma, puoi contattarci ai seguenti recapiti:":
    'For questions about these Terms and Conditions, the Privacy Policy or use of the platform, contact us at:',
  'Sito web: www.crevia.it': 'Website: www.crevia.it',
  'Sede legale: Italia': 'Registered office: Italy',
  'Il team CREVIA è disponibile dal lunedì al venerdì, dalle 9:00 alle 18:00. Ci impegniamo a rispondere entro 48 ore lavorative da ogni richiesta ricevuta.':
    'The CREVIA team is available Monday to Friday, 9:00 to 18:00. We aim to reply within 48 business hours.',
  'Inserisci email e password': 'Enter email and password',
  'Email o password non corretti': 'Incorrect email or password',
  'Inserisci la tua email': 'Enter your email',
  'Inserisci un formato email valido': 'Enter a valid email address',
  'Inserisci il tuo nome': 'Enter your first name',
  'Inserisci il tuo cognome': 'Enter your last name',
  'Inserisci la tua data di nascita': 'Enter your date of birth',
  'Devi avere almeno 18 anni per iscriverti': 'You must be at least 18 to sign up',
  'Seleziona cosa fai nella vita': 'Select your current role',
  'Seleziona lo stato di residenza': 'Select your country of residence',
  'Seleziona la città di residenza': 'Select your city of residence',
  'Seleziona lo stato di domicilio': 'Select your domicile country',
  'Seleziona la città di domicilio': 'Select your domicile city',
  'Errore durante la registrazione. Riprova.': 'Registration failed. Try again.',
};

const EN_TO_IT = Object.fromEntries(
  Object.entries(IT_TO_EN).map(([italian, english]) => [english, italian])
);

export function translateUi(value: string, language: AppLanguage): string {
  const trimmed = value.trim();
  if (!trimmed) return value;
  const normalized = trimmed.replace(/\s+/g, ' ');

  const translated = language === 'en' ? IT_TO_EN[normalized] : EN_TO_IT[normalized];
  if (!translated) return value;

  return value.replace(trimmed, translated);
}
