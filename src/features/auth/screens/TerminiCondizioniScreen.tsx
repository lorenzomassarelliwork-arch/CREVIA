import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { COLORS } from '../../../theme/colors'; // importazione dei colori dell'app

type TerminiCondizioniScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'TerminiCondizioni'
>;

export default function TerminiCondizioniScreen({
  navigation,
}: TerminiCondizioniScreenProps) {
  const [haLetto, setHaLetto] = useState<boolean>(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isAtBottom) setHaLetto(true);
  };

  const handleAccetta = () => {
    navigation.navigate('Register', { terminiAccettati: true });
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termini e Condizioni</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Avviso lettura */}
      {!haLetto && (
        <View style={styles.avviso}>
          <Ionicons name="information-circle-outline" size={18} color="#4F6EF7" />
          <Text style={styles.avvisoText}>Scorri fino in fondo per accettare</Text>
        </View>
      )}

      {/* Contenuto */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.aggiornamento}>Ultimo aggiornamento: Maggio 2026</Text>

        <Text style={styles.sezioneTitle}>1. Introduzione</Text>
        <Text style={styles.sezioneText}>
          Benvenuto su CREVIA. La presente applicazione è un hub che mette in contatto giovani
          in cerca di esperienza professionale con creatori di progetti e startup in fase embrionale.
          Utilizzando CREVIA, accetti i presenti Termini e Condizioni d'uso. Ti invitiamo a leggerli
          attentamente prima di procedere con la registrazione.
        </Text>
        <Text style={styles.sezioneText}>
          CREVIA si riserva il diritto di modificare i presenti termini in qualsiasi momento.
          Gli utenti verranno notificati di eventuali modifiche significative tramite email o
          notifica in-app. L'utilizzo continuato della piattaforma dopo tali modifiche costituisce
          accettazione dei nuovi termini.
        </Text>

        <Text style={styles.sezioneTitle}>2. Dati Personali</Text>
        <Text style={styles.sezioneText}>
          CREVIA raccoglie e tratta i dati personali degli utenti nel rispetto del Regolamento
          Europeo sulla Protezione dei Dati (GDPR - Reg. UE 2016/679). I dati raccolti durante
          la registrazione includono: nome, cognome, data di nascita, email, città di residenza
          e domicilio, settore di interesse e mansione attuale.
        </Text>
        <Text style={styles.sezioneText}>
          I dati personali vengono utilizzati esclusivamente per fornire i servizi della
          piattaforma, migliorare l'esperienza utente e, previo consenso esplicito, inviare
          comunicazioni via newsletter. I dati non vengono venduti a terzi in nessun caso.
          L'utente ha diritto di accesso, rettifica, cancellazione e portabilità dei propri dati
          in qualsiasi momento contattando il team CREVIA.
        </Text>

        <Text style={styles.sezioneTitle}>3. Utilizzo della Piattaforma</Text>
        <Text style={styles.sezioneText}>
          CREVIA è riservato a utenti maggiorenni (18 anni compiuti). L'utente si impegna a
          fornire informazioni veritiere e aggiornate durante la registrazione e nell'utilizzo
          della piattaforma. È vietato creare account falsi, impersonare altre persone o
          organizzazioni, o utilizzare la piattaforma per scopi illeciti.
        </Text>
        <Text style={styles.sezioneText}>
          Gli utenti sono responsabili di tutti i contenuti pubblicati sulla piattaforma.
          È vietato pubblicare contenuti offensivi, discriminatori, illegali o che violino
          diritti di terzi. CREVIA si riserva il diritto di rimuovere contenuti inappropriati
          e sospendere o eliminare account che violino queste regole senza preavviso.
        </Text>
        <Text style={styles.sezioneText}>
          La funzione di matching tra utenti e progetti è fornita a titolo indicativo.
          CREVIA non garantisce la compatibilità tra utenti e progetti né l'esito di eventuali
          collaborazioni nate attraverso la piattaforma.
        </Text>

        <Text style={styles.sezioneTitle}>4. Responsabilità</Text>
        <Text style={styles.sezioneText}>
          CREVIA non è responsabile per eventuali danni diretti o indiretti derivanti dall'utilizzo
          della piattaforma, inclusi ma non limitati a: perdita di dati, interruzioni del servizio,
          comportamenti scorretti di altri utenti o mancato raggiungimento di opportunità
          professionali.
        </Text>
        <Text style={styles.sezioneText}>
          CREVIA si impegna a garantire la disponibilità del servizio nella misura del possibile,
          ma non può essere ritenuta responsabile per interruzioni tecniche, manutenzioni
          programmate o eventi al di fuori del proprio controllo. Il servizio è fornito
          "così com'è" senza garanzie di alcun tipo.
        </Text>

        <Text style={styles.sezioneTitle}>5. Proprietà Intellettuale</Text>
        <Text style={styles.sezioneText}>
          Tutti i contenuti, il design, il logo e il nome CREVIA sono di proprietà esclusiva
          della società. È vietata qualsiasi riproduzione, distribuzione o utilizzo non
          autorizzato dei contenuti della piattaforma. Gli utenti mantengono la proprietà
          intellettuale dei contenuti da loro pubblicati, ma concedono a CREVIA una licenza
          non esclusiva per la loro visualizzazione all'interno della piattaforma.
        </Text>

        <Text style={styles.sezioneTitle}>6. Contatti</Text>
        <Text style={styles.sezioneText}>
          Per qualsiasi domanda relativa ai presenti Termini e Condizioni, alla Privacy Policy
          o all'utilizzo della piattaforma, puoi contattarci ai seguenti recapiti:
        </Text>
        <Text style={styles.sezioneText}>
          📧 Email: support@crevia.it{'\n'}
          🌐 Sito web: www.crevia.it{'\n'}
          📍 Sede legale: Italia
        </Text>
        <Text style={styles.sezioneText}>
          Il team CREVIA è disponibile dal lunedì al venerdì, dalle 9:00 alle 18:00.
          Ci impegniamo a rispondere entro 48 ore lavorative da ogni richiesta ricevuta.
        </Text>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Pulsante Ho compreso */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !haLetto && styles.buttonDisabled]}
          onPress={handleAccetta}
          disabled={!haLetto}
        >
          <Ionicons
            name={haLetto ? 'checkmark-circle-outline' : 'lock-closed-outline'}
            size={20}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>
            {haLetto ? 'Ho compreso e accetto' : 'Scorri per continuare'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 15,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  avviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  avvisoText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  aggiornamento: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 24,
  },
  sezioneTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 10,
    marginTop: 8,
  },
  sezioneText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 24,
    marginBottom: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background  ,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor:'#A0A0A0',
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
