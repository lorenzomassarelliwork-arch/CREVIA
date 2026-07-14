import type { AppLanguage } from '../../theme/AppPreferencesProvider';

export const CHAT_COPY: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptyDescription: string;
    noResultsTitle: string;
    noResultsDescription: string;
    loadError: string;
    sendError: string;
    retry: string;
    messagePlaceholder: string;
    send: string;
    yesterday: string;
    online: string;
    offline: string;
    typing: string;
    participants: string;
    participant: string;
    reply: string;
    replyingTo: string;
    you: string;
    photo: string;
    document: string;
    voiceMessage: string;
    addAttachment: string;
    addPhoto: string;
    takePhoto: string;
    addDocument: string;
    startRecording: string;
    stopRecording: string;
    cancelRecording: string;
    mediaPermissionError: string;
    cameraPermissionError: string;
    microphonePermissionError: string;
    createNew: string;
    newConversation: string;
    newConversationDescription: string;
    newGroup: string;
    newGroupDescription: string;
    chooseAction: string;
    searchUsers: string;
    noUsers: string;
    groupName: string;
    groupNamePlaceholder: string;
    createGroup: string;
    selectAtLeastTwo: string;
    selected: string;
    createConversationError: string;
    groupInfo: string;
    groupPhoto: string;
    changeGroupPhoto: string;
    mainLabel: string;
    makeMain: string;
    removeMain: string;
    leaveGroup: string;
    leaveGroupTitle: string;
    leaveGroupMessage: string;
    leftGroupNotice: string;
    readOnlyConversation: string;
    deleteChat: string;
    deleteChatTitle: string;
    deleteChatMessage: string;
    delete: string;
    cancel: string;
    groupInfoError: string;
    contactInfo: string;
    sharedMedia: string;
    noSharedMedia: string;
    blockUser: string;
    unblockUser: string;
    blockUserTitle: string;
    blockUserMessage: string;
    reportUser: string;
    reportUserTitle: string;
    reportUserMessage: string;
    reportedUser: string;
    blockedUserNotice: string;
    addParticipants: string;
    addSelectedParticipants: string;
    noUsersToAdd: string;
    removeParticipant: string;
    removeParticipantTitle: string;
    removeParticipantMessage: string;
    manageParticipant: string;
  }
> = {
  it: {
    title: 'Chat',
    subtitle: 'Le tue conversazioni',
    searchPlaceholder: 'Cerca nelle chat...',
    emptyTitle: 'Nessuna conversazione',
    emptyDescription: 'Quando inizierai a scrivere a qualcuno, la chat apparirà qui.',
    noResultsTitle: 'Nessuna chat trovata',
    noResultsDescription: 'Prova a cercare un altro nome o messaggio.',
    loadError: 'Non siamo riusciti a caricare le chat.',
    sendError: 'Messaggio non inviato. Riprova.',
    retry: 'Riprova',
    messagePlaceholder: 'Scrivi un messaggio...',
    send: 'Invia messaggio',
    yesterday: 'Ieri',
    online: 'Online',
    offline: 'Offline',
    typing: 'Sta scrivendo...',
    participants: 'partecipanti',
    participant: 'partecipante',
    reply: 'Rispondi',
    replyingTo: 'Risposta a',
    you: 'Tu',
    photo: 'Foto',
    document: 'Documento',
    voiceMessage: 'Messaggio vocale',
    addAttachment: 'Aggiungi allegato',
    addPhoto: 'Aggiungi una foto',
    takePhoto: 'Scatta una foto',
    addDocument: 'Aggiungi documento',
    startRecording: 'Registra un messaggio vocale',
    stopRecording: 'Termina registrazione',
    cancelRecording: 'Annulla registrazione',
    mediaPermissionError: 'Serve il permesso per accedere alle foto.',
    cameraPermissionError: 'Serve il permesso per usare la fotocamera.',
    microphonePermissionError: 'Serve il permesso per usare il microfono.',
    createNew: 'Nuova conversazione',
    newConversation: 'Nuova chat',
    newConversationDescription: 'Scrivi a un utente con cui non hai ancora parlato.',
    newGroup: 'Nuovo gruppo',
    newGroupDescription: 'Crea una conversazione con più persone.',
    chooseAction: 'Cosa vuoi creare?',
    searchUsers: 'Cerca utenti...',
    noUsers: 'Nessun utente trovato',
    groupName: 'Nome del gruppo',
    groupNamePlaceholder: 'Es. Team nuovo progetto',
    createGroup: 'Crea gruppo',
    selectAtLeastTwo: 'Seleziona almeno 2 persone',
    selected: 'selezionati',
    createConversationError: 'Non siamo riusciti a creare la conversazione.',
    groupInfo: 'Info gruppo',
    groupPhoto: 'Immagine del gruppo',
    changeGroupPhoto: 'Modifica immagine',
    mainLabel: 'Main',
    makeMain: 'Nomina Main',
    removeMain: 'Rimuovi Main',
    leaveGroup: 'Abbandona il gruppo',
    leaveGroupTitle: 'Abbandonare il gruppo?',
    leaveGroupMessage: 'Potrai ancora vedere la cronologia, ma non inviare nuovi messaggi.',
    leftGroupNotice: 'Hai abbandonato questo gruppo',
    readOnlyConversation: 'La chat resta visibile, ma non puoi più inviare messaggi.',
    deleteChat: 'Elimina chat',
    deleteChatTitle: 'Eliminare questa chat?',
    deleteChatMessage: 'La conversazione verrà rimossa dalla tua lista.',
    delete: 'Elimina',
    cancel: 'Annulla',
    groupInfoError: 'Non siamo riusciti ad aggiornare il gruppo.',
    contactInfo: 'Info contatto',
    sharedMedia: 'Media condivisi',
    noSharedMedia: 'Nessun media condiviso',
    blockUser: 'Blocca utente',
    unblockUser: 'Sblocca utente',
    blockUserTitle: 'Bloccare questo utente?',
    blockUserMessage: 'Non potrai inviare nuovi messaggi finché non lo sblocchi.',
    reportUser: 'Segnala utente',
    reportUserTitle: 'Segnalare questo utente?',
    reportUserMessage: 'La segnalazione verrà inviata al team di Crevia.',
    reportedUser: 'Utente segnalato',
    blockedUserNotice: 'Hai bloccato questo utente. Sbloccalo per inviare messaggi.',
    addParticipants: 'Aggiungi partecipanti',
    addSelectedParticipants: 'Aggiungi selezionati',
    noUsersToAdd: 'Non ci sono altri utenti da aggiungere',
    removeParticipant: 'Rimuovi dal gruppo',
    removeParticipantTitle: 'Rimuovere questo partecipante?',
    removeParticipantMessage: 'Non potrà più inviare nuovi messaggi nel gruppo.',
    manageParticipant: 'Gestisci partecipante',
  },
  en: {
    title: 'Chat',
    subtitle: 'Your conversations',
    searchPlaceholder: 'Search chats...',
    emptyTitle: 'No conversations yet',
    emptyDescription: 'When you message someone, the conversation will appear here.',
    noResultsTitle: 'No chats found',
    noResultsDescription: 'Try searching for another name or message.',
    loadError: 'We could not load your chats.',
    sendError: 'Message not sent. Try again.',
    retry: 'Try again',
    messagePlaceholder: 'Write a message...',
    send: 'Send message',
    yesterday: 'Yesterday',
    online: 'Online',
    offline: 'Offline',
    typing: 'Typing...',
    participants: 'members',
    participant: 'member',
    reply: 'Reply',
    replyingTo: 'Replying to',
    you: 'You',
    photo: 'Photo',
    document: 'Document',
    voiceMessage: 'Voice message',
    addAttachment: 'Add attachment',
    addPhoto: 'Add a photo',
    takePhoto: 'Take a photo',
    addDocument: 'Add document',
    startRecording: 'Record a voice message',
    stopRecording: 'Stop recording',
    cancelRecording: 'Cancel recording',
    mediaPermissionError: 'Photo library permission is required.',
    cameraPermissionError: 'Camera permission is required.',
    microphonePermissionError: 'Microphone permission is required.',
    createNew: 'New conversation',
    newConversation: 'New chat',
    newConversationDescription: 'Message someone you have not chatted with yet.',
    newGroup: 'New group',
    newGroupDescription: 'Start a conversation with multiple people.',
    chooseAction: 'What would you like to create?',
    searchUsers: 'Search users...',
    noUsers: 'No users found',
    groupName: 'Group name',
    groupNamePlaceholder: 'E.g. New project team',
    createGroup: 'Create group',
    selectAtLeastTwo: 'Select at least 2 people',
    selected: 'selected',
    createConversationError: 'We could not create the conversation.',
    groupInfo: 'Group info',
    groupPhoto: 'Group image',
    changeGroupPhoto: 'Change image',
    mainLabel: 'Main',
    makeMain: 'Make Main',
    removeMain: 'Remove Main',
    leaveGroup: 'Leave group',
    leaveGroupTitle: 'Leave this group?',
    leaveGroupMessage: 'You will still see the history, but you cannot send new messages.',
    leftGroupNotice: 'You left this group',
    readOnlyConversation: 'The chat remains visible, but you can no longer send messages.',
    deleteChat: 'Delete chat',
    deleteChatTitle: 'Delete this chat?',
    deleteChatMessage: 'The conversation will be removed from your list.',
    delete: 'Delete',
    cancel: 'Cancel',
    groupInfoError: 'We could not update the group.',
    contactInfo: 'Contact info',
    sharedMedia: 'Shared media',
    noSharedMedia: 'No shared media',
    blockUser: 'Block user',
    unblockUser: 'Unblock user',
    blockUserTitle: 'Block this user?',
    blockUserMessage: 'You cannot send new messages until you unblock them.',
    reportUser: 'Report user',
    reportUserTitle: 'Report this user?',
    reportUserMessage: 'The report will be sent to the Crevia team.',
    reportedUser: 'User reported',
    blockedUserNotice: 'You blocked this user. Unblock them to send messages.',
    addParticipants: 'Add participants',
    addSelectedParticipants: 'Add selected',
    noUsersToAdd: 'There are no more users to add',
    removeParticipant: 'Remove from group',
    removeParticipantTitle: 'Remove this participant?',
    removeParticipantMessage: 'They will no longer be able to send new group messages.',
    manageParticipant: 'Manage participant',
  },
};
