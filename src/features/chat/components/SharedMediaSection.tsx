import { useMemo, useState } from 'react';
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { CHAT_COPY } from '../chatCopy';
import type { ChatMediaItem } from '../types';
import AudioAttachmentPlayer from './AudioAttachmentPlayer';
import createStyles from './SharedMediaSection.styles';

type SharedMediaSectionProps = {
  media: ChatMediaItem[];
};

export default function SharedMediaSection({ media }: SharedMediaSectionProps) {
  const { colors, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = CHAT_COPY[language];
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const formatMediaDate = (value: string) =>
    new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-US', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(value));

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{copy.sharedMedia}</Text>
        <Text style={styles.sectionCount}>{media.length}</Text>
      </View>

      {media.length === 0 ? (
        <View style={styles.emptyMedia}>
          <Ionicons name="images-outline" size={34} color={colors.gray} />
          <Text style={styles.emptyMediaText}>{copy.noSharedMedia}</Text>
        </View>
      ) : (
        <View style={styles.mediaGrid}>
          {media.map((item) =>
            item.attachment.kind === 'image' ? (
              <TouchableOpacity
                key={`${item.messageId}-${item.attachment.id}`}
                accessibilityRole="imagebutton"
                activeOpacity={0.8}
                style={styles.imageTile}
                onPress={() => setPreviewImageUri(item.attachment.uri)}
              >
                <Image source={{ uri: item.attachment.uri }} style={styles.mediaImage} />
                <Text style={styles.mediaDate}>{formatMediaDate(item.sentAt)}</Text>
              </TouchableOpacity>
            ) : (
              <View
                key={`${item.messageId}-${item.attachment.id}`}
                style={styles.audioTile}
              >
                <AudioAttachmentPlayer attachment={item.attachment} isOwn={false} />
                <Text style={styles.audioDate}>{formatMediaDate(item.sentAt)}</Text>
              </View>
            )
          )}
        </View>
      )}

      <Modal
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
        visible={previewImageUri !== null}
      >
        <View style={styles.previewContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.previewClose}
            onPress={() => setPreviewImageUri(null)}
          >
            <Ionicons name="close" size={24} color={colors.textStrong} />
          </TouchableOpacity>
          {previewImageUri && (
            <Image
              resizeMode="contain"
              source={{ uri: previewImageUri }}
              style={styles.previewImage}
            />
          )}
        </View>
      </Modal>
    </>
  );
}
