import { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import type { MainTabParamList } from '../../../navigation/types';
import type { ColorPalette } from '../../../theme/colors';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
} from '../../../i18n/LocalizedText';

type SearchScreenProps = MaterialTopTabScreenProps<MainTabParamList, 'Search'>;

type PersonResult = {
  id: string;
  nome: string;
  ruolo: string;
  citta: string;
  tipo: 'persona';
};

type ProjectResult = {
  id: string;
  nome: string;
  settore: string;
  citta: string;
  tipo: 'progetto';
};

type SearchResult = PersonResult | ProjectResult;
type SearchFilter = 'tutti' | 'persone' | 'progetti';

const filtri: SearchFilter[] = ['tutti', 'persone', 'progetti'];

const utenti: PersonResult[] = [
  { id: '1', nome: 'Marco Rossi', ruolo: 'Sviluppatore', citta: 'Milano', tipo: 'persona' },
  { id: '2', nome: 'Sara Bianchi', ruolo: 'UX Designer', citta: 'Roma', tipo: 'persona' },
  { id: '3', nome: 'Luca Ferrari', ruolo: 'Data Analyst', citta: 'Torino', tipo: 'persona' },
  { id: '4', nome: 'Giulia Marino', ruolo: 'Marketing', citta: 'Napoli', tipo: 'persona' },
];

const progetti: ProjectResult[] = [
  { id: '5', nome: 'TechStart Milano', settore: 'Tecnologia', citta: 'Milano', tipo: 'progetto' },
  { id: '6', nome: 'GreenFuture', settore: 'Sostenibilità', citta: 'Bologna', tipo: 'progetto' },
  { id: '7', nome: 'DesignHub', settore: 'Design & UX', citta: 'Firenze', tipo: 'progetto' },
  { id: '8', nome: 'FinLab', settore: 'Fintech', citta: 'Milano', tipo: 'progetto' },
];

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const { colors } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState<string>('');
  const [filtro, setFiltro] = useState<SearchFilter>('tutti');

  const tuttiIDati: SearchResult[] = [...utenti, ...progetti];

  const risultati = tuttiIDati.filter((item) => {
    const matchQuery = item.nome.toLowerCase().includes(query.toLowerCase());
    if (filtro === 'tutti') return matchQuery;
    if (filtro === 'persone') return matchQuery && item.tipo === 'persona';
    return matchQuery && item.tipo === 'progetto';
  });

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textStrong} />
          </TouchableOpacity>
        )}
        <View style={[styles.searchBar, !navigation.canGoBack() && { marginLeft: 0 }] }>
          <Ionicons name="search-outline" size={18} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca persone o progetti..."
            placeholderTextColor={colors.gray}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtri */}
      <View style={styles.filtriContainer}>
        {filtri.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroButton, filtro === f && styles.filtroActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroText, filtro === f && styles.filtroTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Risultati */}
      <ScrollView contentContainerStyle={styles.risultati} showsVerticalScrollIndicator={false}>

        {query.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>Cerca su CREVIA</Text>
            <Text style={styles.emptySubtitle}>Trova persone, builders e progetti</Text>
          </View>
        )}

        {query.length > 0 && risultati.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>Nessun risultato</Text>
            <Text style={styles.emptySubtitle}>Prova con un altro termine</Text>
          </View>
        )}

        {risultati.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <View style={styles.cardAvatar}>
              {item.tipo === 'persona' ? (
                <Ionicons name="person" size={22} color={colors.primary} />
              ) : (
                <FontAwesome5 name="building" size={18} color={colors.primary} />
              )}
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNome}>{item.nome}</Text>
              <Text style={styles.cardSub}>
                {item.tipo === 'persona' ? item.ruolo : item.settore} • {item.citta}
              </Text>
            </View>
            <TouchableOpacity style={styles.connectButton}>
              <Text style={styles.connectText}>
                {item.tipo === 'persona' ? '+ Builder' : 'Unisciti'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

      </ScrollView>

    </View>
  );
}

const createStyles = (COLORS: ColorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 15,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.secondary,
  },
  filtriContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: COLORS.background,
  },
  filtroButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.border,
  },
  filtroActive: {
    backgroundColor: COLORS.primary,
  },
  filtroText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  filtroTextActive: {
    color: COLORS.white,
  },
  risultati: {
    padding: 20,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardNome: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  cardSub: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  connectText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
