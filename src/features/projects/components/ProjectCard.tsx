import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import type { ColorPalette } from '../../../theme/colors';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { LocalizedText as Text } from '../../../i18n/LocalizedText';
import { TranslatedContent } from '../../../i18n/TranslatedContent';
import type { Post } from '../../../api/api';

export type ProjectCardPost = Post;

type ProjectCardProps = {
  post: ProjectCardPost;
};

export default function ProjectCard({ post }: ProjectCardProps) {
  const { colors } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardAvatar}>
          <FontAwesome5 name="building" size={18} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardAzienda}>{post.azienda}</Text>
          <Text style={styles.cardSettore}>{post.settore}</Text>
        </View>
        <Text style={styles.cardTempo}>{post.tempo}</Text>
      </View>
      <TranslatedContent
        contentId={`post:${post.id}`}
        sourceLanguage={post.language ?? 'it'}
        text={post.descrizione}
        style={styles.cardDescrizione}
      />
      <View style={styles.cardFooter}>
        <View style={styles.buildersContainer}>
          <Ionicons name="people-outline" size={16} color={colors.gray} />
          <Text style={styles.buildersText}>{post.builders} builders</Text>
        </View>
        <TouchableOpacity style={styles.candidatiButton}>
          <Text style={styles.candidatiText}>Unisciti</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardAzienda: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  cardSettore: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
  },
  cardTempo: {
    fontSize: 12,
    color: colors.gray,
  },
  cardDescrizione: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buildersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buildersText: {
    fontSize: 13,
    color: colors.gray,
  },
  candidatiButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  candidatiText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
