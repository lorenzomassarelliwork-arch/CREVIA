import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  PanResponder,
  ScrollView,
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

type MediaCategory = ChatMediaItem['attachment']['kind'];

const MEDIA_CATEGORIES: MediaCategory[] = ['audio', 'image', 'document'];
const SWIPE_START_DISTANCE = 6;
const SWIPE_CHANGE_DISTANCE = 24;
const SWIPE_CHANGE_VELOCITY = 0.2;

export default function SharedMediaSection({ media }: SharedMediaSectionProps) {
  const { colors, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = CHAT_COPY[language];
  const [selectedCategory, setSelectedCategory] =
    useState<MediaCategory>('audio');
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const selectedCategoryRef = useRef<MediaCategory>('audio');
  const contentWidthRef = useRef(0);
  const mediaPagerRef = useRef<ScrollView>(null);

  const mediaByCategory = useMemo(
    () => ({
      audio: media.filter((item) => item.attachment.kind === 'audio'),
      image: media.filter((item) => item.attachment.kind === 'image'),
      document: media.filter((item) => item.attachment.kind === 'document'),
    }),
    [media]
  );

  const categoryLabels: Record<MediaCategory, string> = {
    audio: 'Audio',
    image: copy.photo,
    document: language === 'it' ? 'Documenti' : 'Documents',
  };

  const emptyCategoryLabels: Record<MediaCategory, string> = {
    audio:
      language === 'it' ? 'Nessun audio condiviso' : 'No shared audio',
    image:
      language === 'it' ? 'Nessuna foto condivisa' : 'No shared photos',
    document:
      language === 'it'
        ? 'Nessun documento condiviso'
        : 'No shared documents',
  };

  const updateSelectedCategory = useCallback((category: MediaCategory) => {
    selectedCategoryRef.current = category;
    setSelectedCategory(category);
  }, []);

  const selectCategory = useCallback(
    (category: MediaCategory, animated = true) => {
      const nextIndex = MEDIA_CATEGORIES.indexOf(category);
      if (nextIndex < 0) return;

      updateSelectedCategory(category);
      if (contentWidthRef.current > 0) {
        mediaPagerRef.current?.scrollTo({
          x: contentWidthRef.current * nextIndex,
          animated,
        });
      }
    },
    [updateSelectedCategory]
  );

  useEffect(() => {
    if (contentWidth > 0) {
      selectCategory(selectedCategoryRef.current, false);
    }
  }, [contentWidth, selectCategory]);

  const categoryTabsSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > SWIPE_START_DISTANCE &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > SWIPE_START_DISTANCE &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          const currentIndex = MEDIA_CATEGORIES.indexOf(
            selectedCategoryRef.current
          );
          const direction = gesture.dx < 0 ? 1 : -1;
          const nextIndex = currentIndex + direction;
          const shouldChangeCategory =
            nextIndex >= 0 &&
            nextIndex < MEDIA_CATEGORIES.length &&
            (Math.abs(gesture.dx) >= SWIPE_CHANGE_DISTANCE ||
              Math.abs(gesture.vx) >= SWIPE_CHANGE_VELOCITY);

          if (shouldChangeCategory) {
            selectCategory(MEDIA_CATEGORIES[nextIndex]);
          }
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [selectCategory]
  );

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

  const renderCategoryContent = (category: MediaCategory) => {
    const categoryMedia = mediaByCategory[category];

    if (categoryMedia.length === 0) {
      return (
        <View style={styles.emptyMedia}>
          <Ionicons
            name={
              category === 'audio'
                ? 'mic-outline'
                : category === 'image'
                  ? 'images-outline'
                  : 'document-text-outline'
            }
            size={34}
            color={colors.gray}
          />
          <Text style={styles.emptyMediaText}>
            {emptyCategoryLabels[category]}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.mediaGrid}>
        {categoryMedia.map((item) =>
          item.attachment.kind === 'image' ? (
            <TouchableOpacity
              key={`${item.messageId}-${item.attachment.id}`}
              accessibilityRole="imagebutton"
              activeOpacity={0.8}
              style={styles.imageTile}
              onPress={() => setPreviewImageUri(item.attachment.uri)}
            >
              <Image
                source={{ uri: item.attachment.uri }}
                style={styles.mediaImage}
              />
              <Text style={styles.mediaDate}>
                {formatMediaDate(item.sentAt)}
              </Text>
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
              <Text style={styles.audioDate}>
                {formatMediaDate(item.sentAt)}
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              key={`${item.messageId}-${item.attachment.id}`}
              style={styles.audioTile}
            >
              <AudioAttachmentPlayer attachment={item.attachment} isOwn={false} />
              <Text style={styles.audioDate}>
                {formatMediaDate(item.sentAt)}
              </Text>
            </View>
          )
        )}
      </View>
    );
  };

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{copy.sharedMedia}</Text>
        <Text style={styles.sectionCount}>{media.length}</Text>
      </View>

      <View style={styles.categoryGestureArea}>
        <View
          style={styles.categoryTabs}
          {...categoryTabsSwipeResponder.panHandlers}
        >
          {MEDIA_CATEGORIES.map((category) => {
            const isSelected = category === selectedCategory;

            return (
              <TouchableOpacity
                key={category}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                activeOpacity={0.76}
                style={[
                  styles.categoryTab,
                  isSelected && styles.categoryTabSelected,
                ]}
                onPress={() => selectCategory(category)}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.categoryTabLabel,
                    isSelected && styles.categoryTabLabelSelected,
                  ]}
                >
                  {categoryLabels[category]}
                </Text>
                <Text
                  style={[
                    styles.categoryTabCount,
                    isSelected && styles.categoryTabCountSelected,
                  ]}
                >
                  {mediaByCategory[category].length}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={styles.categoryViewport}
          onLayout={(event) => {
            const nextWidth = event.nativeEvent.layout.width;
            contentWidthRef.current = nextWidth;
            setContentWidth(nextWidth);
          }}
        >
          <ScrollView
            ref={mediaPagerRef}
            horizontal
            pagingEnabled
            directionalLockEnabled
            nestedScrollEnabled
            decelerationRate="fast"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              if (contentWidthRef.current === 0) return;

              const nextIndex = Math.round(
                event.nativeEvent.contentOffset.x / contentWidthRef.current
              );
              const nextCategory = MEDIA_CATEGORIES[nextIndex];
              if (nextCategory) updateSelectedCategory(nextCategory);
            }}
          >
            {MEDIA_CATEGORIES.map((category) => (
              <View
                key={category}
                style={[styles.categoryPage, { width: contentWidth }]}
              >
                {renderCategoryContent(category)}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

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
