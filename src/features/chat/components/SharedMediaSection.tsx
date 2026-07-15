import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  PanResponder,
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
const BACK_GESTURE_EDGE = 48;
const SWIPE_START_DISTANCE = 6;
const SWIPE_CHANGE_DISTANCE = 38;
const SWIPE_CHANGE_VELOCITY = 0.34;

export default function SharedMediaSection({ media }: SharedMediaSectionProps) {
  const { colors, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = CHAT_COPY[language];
  const [selectedCategory, setSelectedCategory] =
    useState<MediaCategory>('audio');
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const selectedCategoryRef = useRef<MediaCategory>('audio');
  const contentWidthRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const swipeTranslateX = useRef(new Animated.Value(0)).current;
  const swipeOpacity = useRef(new Animated.Value(1)).current;

  const settleSwipe = useCallback(() => {
    Animated.parallel([
      Animated.spring(swipeTranslateX, {
        toValue: 0,
        speed: 24,
        bounciness: 2,
        useNativeDriver: true,
      }),
      Animated.timing(swipeOpacity, {
        toValue: 1,
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      isTransitioningRef.current = false;
    });
  }, [swipeOpacity, swipeTranslateX]);

  const animateToCategory = useCallback(
    (nextIndex: number, direction: 1 | -1, gestureDistance = 0) => {
      if (
        isTransitioningRef.current ||
        nextIndex < 0 ||
        nextIndex >= MEDIA_CATEGORIES.length
      ) {
        settleSwipe();
        return;
      }

      const nextCategory = MEDIA_CATEGORIES[nextIndex];
      if (nextCategory === selectedCategoryRef.current) {
        settleSwipe();
        return;
      }

      isTransitioningRef.current = true;
      const width = Math.max(contentWidthRef.current, 280);
      const baseExitDistance = Math.min(140, Math.max(96, width * 0.34));
      const exitDistance = Math.max(baseExitDistance, Math.abs(gestureDistance));
      const exitTarget = direction === 1 ? -exitDistance : exitDistance;

      Animated.parallel([
        Animated.timing(swipeTranslateX, {
          toValue: exitTarget,
          duration: 90,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(swipeOpacity, {
          toValue: 0,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) {
          settleSwipe();
          return;
        }

        swipeTranslateX.setValue(direction === 1 ? 44 : -44);
        swipeOpacity.setValue(0);
        selectedCategoryRef.current = nextCategory;
        setSelectedCategory(nextCategory);

        requestAnimationFrame(settleSwipe);
      });
    },
    [settleSwipe, swipeOpacity, swipeTranslateX]
  );

  const shouldHandleMediaSwipe = useCallback(
    (gesture: { dx: number; dy: number; x0: number }) => {
      const isNavigationBackGesture =
        gesture.x0 <= BACK_GESTURE_EDGE && gesture.dx > 0;

      return (
        !isTransitioningRef.current &&
        !isNavigationBackGesture &&
        Math.abs(gesture.dx) > SWIPE_START_DISTANCE &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.08
      );
    },
    []
  );

  const mediaSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          shouldHandleMediaSwipe(gesture),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          shouldHandleMediaSwipe(gesture),
        onPanResponderGrant: () => {
          swipeTranslateX.stopAnimation();
          swipeOpacity.stopAnimation();
          swipeOpacity.setValue(1);
        },
        onPanResponderMove: (_, gesture) => {
          const currentIndex = MEDIA_CATEGORIES.indexOf(
            selectedCategoryRef.current
          );
          const isPastFirstCategory = currentIndex === 0 && gesture.dx > 0;
          const isPastLastCategory =
            currentIndex === MEDIA_CATEGORIES.length - 1 && gesture.dx < 0;
          const resistance =
            isPastFirstCategory || isPastLastCategory ? 0.18 : 1;
          const maxDistance = Math.max(contentWidthRef.current, 280);
          const translatedDistance = Math.max(
            -maxDistance,
            Math.min(maxDistance, gesture.dx * resistance)
          );

          swipeTranslateX.setValue(translatedDistance);
        },
        onPanResponderRelease: (_, gesture) => {
          const projectedDistance = gesture.dx + gesture.vx * 72;
          const direction: 1 | -1 = projectedDistance < 0 ? 1 : -1;
          const currentIndex = MEDIA_CATEGORIES.indexOf(
            selectedCategoryRef.current
          );
          const nextIndex = currentIndex + direction;
          const canChangeCategory =
            nextIndex >= 0 && nextIndex < MEDIA_CATEGORIES.length;
          const shouldChangeCategory =
            canChangeCategory &&
            (Math.abs(gesture.dx) >= SWIPE_CHANGE_DISTANCE ||
              Math.abs(gesture.vx) >= SWIPE_CHANGE_VELOCITY);

          if (shouldChangeCategory) {
            animateToCategory(nextIndex, direction, gesture.dx);
            return;
          }

          settleSwipe();
        },
        onPanResponderTerminate: settleSwipe,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [
      animateToCategory,
      settleSwipe,
      shouldHandleMediaSwipe,
      swipeOpacity,
      swipeTranslateX,
    ]
  );

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

  const selectedMedia = mediaByCategory[selectedCategory];

  const selectCategory = (category: MediaCategory) => {
    const currentIndex = MEDIA_CATEGORIES.indexOf(selectedCategoryRef.current);
    const nextIndex = MEDIA_CATEGORIES.indexOf(category);
    if (nextIndex === currentIndex) return;

    animateToCategory(nextIndex, nextIndex > currentIndex ? 1 : -1);
  };

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

      <View style={styles.categoryGestureArea} {...mediaSwipeResponder.panHandlers}>
        <View style={styles.categoryTabs}>
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
            contentWidthRef.current = event.nativeEvent.layout.width;
          }}
        >
          <Animated.View
            style={[
              styles.categoryContent,
              {
                opacity: swipeOpacity,
                transform: [{ translateX: swipeTranslateX }],
              },
            ]}
          >
            {selectedMedia.length === 0 ? (
              <View style={styles.emptyMedia}>
                <Ionicons
                  name={
                    selectedCategory === 'audio'
                      ? 'mic-outline'
                      : selectedCategory === 'image'
                        ? 'images-outline'
                        : 'document-text-outline'
                  }
                  size={34}
                  color={colors.gray}
                />
                <Text style={styles.emptyMediaText}>
                  {emptyCategoryLabels[selectedCategory]}
                </Text>
              </View>
            ) : (
              <View style={styles.mediaGrid}>
                {selectedMedia.map((item) =>
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
                        void openDocument(
                          item.attachment as ChatDocumentAttachment
                        )
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
                      <AudioAttachmentPlayer
                        attachment={item.attachment}
                        isOwn={false}
                      />
                      <Text style={styles.audioDate}>
                        {formatMediaDate(item.sentAt)}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}
          </Animated.View>
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
