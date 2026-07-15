import { useMemo, useRef } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import type { ChatAudioAttachment } from '../types';
import createStyles from './AudioAttachmentPlayer.styles';

type AudioAttachmentPlayerProps = {
  attachment: ChatAudioAttachment;
  isOwn: boolean;
};

const WAVEFORM_BAR_COUNT = 38;

function createWaveform(seed: string, samples?: number[]) {
  if (samples && samples.length > 0) {
    return Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
      const sampleIndex = Math.min(
        samples.length - 1,
        Math.floor((index * samples.length) / WAVEFORM_BAR_COUNT)
      );
      const normalizedSample = Math.min(1, Math.max(0, samples[sampleIndex] ?? 0));
      return Math.round(6 + normalizedSample * 17);
    });
  }

  let state = 0;

  for (let index = 0; index < seed.length; index += 1) {
    state = (state * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
    state = (state * 1664525 + 1013904223) >>> 0;
    const randomHeight = state / 0xffffffff;
    const envelope = 0.78 + Math.sin((index / (WAVEFORM_BAR_COUNT - 1)) * Math.PI) * 0.22;

    return Math.round((6 + randomHeight * 17) * envelope);
  });
}

function formatDuration(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  return `${minutes}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

export default function AudioAttachmentPlayer({
  attachment,
  isOwn,
}: AudioAttachmentPlayerProps) {
  const { colors, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const waveformWidth = useRef(0);
  const waveform = useMemo(
    () =>
      createWaveform(
        `${attachment.id}-${attachment.durationMs}`,
        attachment.waveform
      ),
    [attachment.durationMs, attachment.id, attachment.waveform]
  );
  const player = useAudioPlayer(attachment.uri, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const fallbackDuration = Math.max(attachment.durationMs / 1000, 0);
  const totalDuration =
    Number.isFinite(status.duration) && status.duration > 0 ? status.duration : fallbackDuration;
  const statusCurrentTime = Number.isFinite(status.currentTime) ? status.currentTime : 0;
  const currentTime = Math.min(Math.max(statusCurrentTime, 0), totalDuration);
  const progress = totalDuration > 0 ? Math.min(currentTime / totalDuration, 1) : 0;

  const togglePlayback = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || status.currentTime >= totalDuration) {
      await player.seekTo(0);
    }
    player.play();
  };

  const handleWaveformLayout = (event: LayoutChangeEvent) => {
    waveformWidth.current = event.nativeEvent.layout.width;
  };

  const handleWaveformPress = (event: GestureResponderEvent) => {
    if (waveformWidth.current <= 0 || totalDuration <= 0) {
      return;
    }

    const nextProgress = Math.min(
      Math.max(event.nativeEvent.locationX / waveformWidth.current, 0),
      1
    );
    void player.seekTo(nextProgress * totalDuration);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.7}
        style={[styles.playButton, isOwn && styles.playButtonOwn]}
        onPress={() => void togglePlayback()}
      >
        <Ionicons
          name={status.playing ? 'pause' : 'play'}
          size={17}
          color={isOwn ? colors.primary : colors.white}
        />
      </TouchableOpacity>
      <View style={styles.trackColumn}>
        <Pressable
          accessibilityHint={
            language === 'it'
              ? "Tocca un punto della forma d'onda per spostare la riproduzione"
              : 'Tap the waveform to seek through the audio message'
          }
          accessibilityLabel={
            language === 'it' ? 'Posizione del messaggio audio' : 'Audio message position'
          }
          accessibilityRole="adjustable"
          accessibilityValue={{
            min: 0,
            max: Math.round(totalDuration),
            now: Math.round(currentTime),
            text: `${formatDuration(currentTime)} ${
              language === 'it' ? 'di' : 'of'
            } ${formatDuration(totalDuration)}`,
          }}
          hitSlop={{ top: 6, bottom: 6 }}
          style={styles.waveform}
          onLayout={handleWaveformLayout}
          onPress={handleWaveformPress}
        >
          {waveform.map((height, index) => {
            const isPlayed = progress > index / waveform.length;

            return (
              <View
                key={`${attachment.id}-wave-${index}`}
                style={[
                  styles.waveformBar,
                  isOwn && styles.waveformBarOwn,
                  isPlayed && styles.waveformBarPlayed,
                  isPlayed && isOwn && styles.waveformBarPlayedOwn,
                  { height },
                ]}
              />
            );
          })}
        </Pressable>
        <Text style={[styles.duration, isOwn && styles.durationOwn]}>
          {formatDuration(currentTime)} / {formatDuration(totalDuration)}
        </Text>
      </View>
    </View>
  );
}
