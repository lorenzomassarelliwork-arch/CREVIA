import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { CHAT_COPY } from '../chatCopy';
import type { ChatDocumentAttachment, ChatMediaItem } from '../types';
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

  const formatFileSize = (fileSize: number | null) => {
    if (!fileSize) return '';
    if (fileSize < 1024 * 1024) {
      return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
    }
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openDocument = async (attachment: ChatDocumentAttachment) => {
    try {
      await Linking.openURL(attachment.uri);
    } catch {
      Alert.alert(attachment.fileName, copy.sendError);
    }
  };

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
            ) : item.attachment.kind === 'document' ? (
              <TouchableOpacity
                key={`${item.messageId}-${item.attachment.id}`}
                accessibilityRole="button"
                activeOpacity={0.78}
                style={styles.documentTile}
                onPress={() =>
                  void openDocument(item.attachment as ChatDocumentAttachment)
                }
              >
                <View style={styles.documentIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.documentCopy}>
                  <Text numberOfLines={1} style={styles.documentName}>
                    {item.attachment.fileName}
                  </Text>
                  <Text numberOfLines={1} style={styles.documentMeta}>
                    {formatFileSize(item.attachment.fileSize) ||
                      item.attachment.mimeType}
                  </Text>
                </View>
                <Text style={styles.audioDate}>{formatMediaDate(item.sentAt)}</Text>
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
