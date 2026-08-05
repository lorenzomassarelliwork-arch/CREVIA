import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import type { ColorPalette } from '../../../theme/colors';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
} from '../../../i18n/LocalizedText';
import {
  emptySearchFilters,
  getPresetSearchState,
  searchDirectory,
} from '../../search/services/searchService';
import type {
  SearchFilters,
  SearchMansioneFilter,
  SearchResult,
  SearchResultType,
} from '../../search/services/searchService';

type SearchScreenProps = CompositeScreenProps<
  MaterialTopTabScreenProps<MainTabParamList, 'Search'>,
  NativeStackScreenProps<RootStackParamList>
>;

type TypeChip = {
  value: SearchResultType;
  label: string;
};

type MansioneChip = {
  value: SearchMansioneFilter;
  label: string;
};

const typeChips: TypeChip[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'user', label: 'Persone' },
  { value: 'project', label: 'Progetti' },
];

const mansioneChips: MansioneChip[] = [
  { value: 'all', label: 'Tutte' },
  { value: 'Studente', label: 'Studente' },
  { value: 'Lavoratore', label: 'Lavoratore' },
];

function hasActiveFilters(filters: SearchFilters) {
  return (
    filters.type !== 'all' ||
    filters.mansione !== 'all' ||
    Boolean(filters.settore.trim()) ||
    Boolean(filters.stato.trim()) ||
    Boolean(filters.citta.trim()) ||
    Boolean(filters.preset)
  );
}

function getActiveFilterCount(filters: SearchFilters) {
  const activeFilters = [
    filters.type !== 'all',
    filters.mansione !== 'all',
    filters.settore.trim(),
    filters.stato.trim(),
    filters.citta.trim(),
  ].filter(Boolean).length;

  return filters.preset ? Math.max(1, activeFilters) : activeFilters;
}

export default function SearchScreen({ navigation, route }: SearchScreenProps) {
  const { colors } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(emptySearchFilters);
  const [draftFilters, setDraftFilters] =
    useState<SearchFilters>(emptySearchFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const shouldSearch = query.trim().length > 0 || hasActiveFilters(filters);
  const activeFilterCount = getActiveFilterCount(filters);
  const activePreset = filters.preset
    ? getPresetSearchState(filters.preset)
    : null;

  useEffect(() => {
    const preset = route.params?.preset;
    if (!preset) return;

    const presetState = getPresetSearchState(preset);
    setQuery('');
    setFilters(presetState.filters);
    setDraftFilters(presetState.filters);
  }, [route.params?.preset, route.params?.presetAppliedAt]);

  useEffect(() => {
    let active = true;

    if (!shouldSearch) {
      setResults([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      searchDirectory(query, filters)
        .then((response) => {
          if (active) setResults(response.data);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters, query, shouldSearch]);

  const openFilters = () => {
    setDraftFilters(filters);
    setFilterModalVisible(true);
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setDraftFilters(emptySearchFilters);
    setFilters(emptySearchFilters);
  };

  const openResult = (item: SearchResult) => {
    if (item.type === 'user') {
      navigation.navigate('PublicUserProfile', { userId: item.id });
      return;
    }

    navigation.navigate('ProjectDetail', { projectId: item.id });
  };

  const setTypeFilter = (value: SearchResultType) => {
    setFilters((current) => ({ ...current, type: value, preset: null }));
  };

  const setDraftField = <K extends keyof SearchFilters>(
    field: K,
    value: SearchFilters[K]
  ) => {
    setDraftFilters((current) => ({ ...current, [field]: value, preset: null }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textStrong} />
          </TouchableOpacity>
        )}
        <View style={[styles.searchBar, !navigation.canGoBack() && { marginLeft: 0 }]}>
          <Ionicons name="search-outline" size={18} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca persone o progetti..."
            placeholderTextColor={colors.gray}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={openFilters}>
          <Ionicons
            name="options-outline"
            size={21}
            color={activeFilterCount > 0 ? colors.primary : colors.secondary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filtriContainer}>
        {typeChips.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.filtroButton, filters.type === item.value && styles.filtroActive]}
            onPress={() => setTypeFilter(item.value)}
          >
            <Text style={[styles.filtroText, filters.type === item.value && styles.filtroTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activePreset && (
        <View style={styles.presetContainer}>
          <View style={styles.presetPill}>
            <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
            <Text style={styles.presetText}>{activePreset.label}</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Ionicons name="close" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.risultati} showsVerticalScrollIndicator={false}>
        {!shouldSearch && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>Cerca su CREVIA</Text>
            <Text style={styles.emptySubtitle}>Trova persone, builders e progetti</Text>
          </View>
        )}

        {shouldSearch && isLoading && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {shouldSearch && !isLoading && results.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>Nessun risultato</Text>
            <Text style={styles.emptySubtitle}>Prova con un altro termine o filtro</Text>
          </View>
        )}

        {!isLoading && results.map((item) => (
          <TouchableOpacity
            key={`${item.type}-${item.id}`}
            style={styles.card}
            onPress={() => openResult(item)}
          >
            <View style={styles.cardAvatar}>
              {item.type === 'user' && item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.cardAvatarImage} />
              ) : item.type === 'user' ? (
                <Ionicons name="person" size={22} color={colors.primary} />
              ) : (
                <FontAwesome5 name="building" size={18} color={colors.primary} />
              )}
              {item.type === 'user' && item.isOnline && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNome}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.subtitle}</Text>
              <Text style={styles.cardMeta}>
                {item.type === 'user'
                  ? `${item.mansione} - ${item.settore}`
                  : `${item.builders ?? 0} builders`}
              </Text>
            </View>
            <View style={styles.openButton}>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filtri</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Mansione</Text>
            <View style={styles.sheetChips}>
              {mansioneChips.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.sheetChip,
                    draftFilters.mansione === item.value && styles.sheetChipActive,
                  ]}
                  onPress={() => setDraftField('mansione', item.value)}
                >
                  <Text
                    style={[
                      styles.sheetChipText,
                      draftFilters.mansione === item.value && styles.sheetChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Settore</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Es. Tecnologia, Design, Fintech"
              placeholderTextColor={colors.gray}
              value={draftFilters.settore}
              onChangeText={(value) => setDraftField('settore', value)}
            />

            <Text style={styles.filterLabel}>Stato</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Es. Italia"
              placeholderTextColor={colors.gray}
              value={draftFilters.stato}
              onChangeText={(value) => setDraftField('stato', value)}
            />

            <Text style={styles.filterLabel}>Citta</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Es. Milano"
              placeholderTextColor={colors.gray}
              value={draftFilters.citta}
              onChangeText={(value) => setDraftField('citta', value)}
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Applica</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (
  colors: ColorPalette,
  topInset: number,
  bottomInset: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Math.max(topInset, 24) + 14,
      paddingBottom: 15,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      backgroundColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      gap: 8,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.secondary,
    },
    filterButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    filterBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: 'bold',
    },
    filtriContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 10,
      backgroundColor: colors.background,
    },
    presetContainer: {
      paddingHorizontal: 20,
      paddingBottom: 8,
      backgroundColor: colors.background,
    },
    presetPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    presetText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: 'bold',
    },
    filtroButton: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.border,
    },
    filtroActive: {
      backgroundColor: colors.primary,
    },
    filtroText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    filtroTextActive: {
      color: colors.white,
    },
    risultati: {
      padding: 20,
      paddingBottom: 88 + Math.max(bottomInset, 10),
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
      color: colors.secondary,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.gray,
      textAlign: 'center',
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    cardAvatar: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardAvatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    onlineDot: {
      position: 'absolute',
      right: 5,
      bottom: 5,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.confirm,
      borderWidth: 1,
      borderColor: colors.cardBackground,
    },
    cardInfo: {
      flex: 1,
    },
    cardNome: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    cardSub: {
      fontSize: 13,
      color: colors.gray,
      marginTop: 2,
    },
    cardMeta: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 4,
      fontWeight: '600',
    },
    openButton: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    filterSheet: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 20,
      paddingBottom: 24 + Math.max(bottomInset, 10),
      gap: 12,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    sheetTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    filterLabel: {
      fontSize: 13,
      fontWeight: 'bold',
      color: colors.secondary,
      marginTop: 4,
    },
    sheetChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sheetChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    sheetChipActive: {
      backgroundColor: colors.primary,
    },
    sheetChipText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    sheetChipTextActive: {
      color: colors.white,
    },
    filterInput: {
      minHeight: 44,
      borderRadius: 12,
      backgroundColor: colors.inputSurface,
      color: colors.secondary,
      paddingHorizontal: 12,
      fontSize: 14,
    },
    sheetActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    resetButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
    applyButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
