import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../../../theme/colors'; // Importa dal percorso corretto
import type { Post } from '../../../api/api';

export type ProjectCardPost = Post;

type ProjectCardProps = {
  post: ProjectCardPost;
};

export default function ProjectCard({ post }: ProjectCardProps) {
  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardAvatar}>
          <FontAwesome5 name="building" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardAzienda}>{post.azienda}</Text>
          <Text style={styles.cardSettore}>{post.settore}</Text>
        </View>
        <Text style={styles.cardTempo}>{post.tempo}</Text>
      </View>
      <Text style={styles.cardDescrizione}>{post.descrizione}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.buildersContainer}>
          <Ionicons name="people-outline" size={16} color={COLORS.gray} />
          <Text style={styles.buildersText}>{post.builders} builders</Text>
        </View>
        <TouchableOpacity style={styles.candidatiButton}>
          <Text style={styles.candidatiText}>Unisciti</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    shadowColor: COLORS.primary,
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
    backgroundColor: '#E8EDFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardAzienda: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  cardSettore: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
  },
  cardTempo: {
    fontSize: 12,
    color: COLORS.gray,
  },
  cardDescrizione: {
    fontSize: 14,
    color: COLORS.secondary,
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
    color: COLORS.gray,
  },
  candidatiButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  candidatiText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
