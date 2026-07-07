import { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import type { ChatAudioAttachment } from '../types';
import createStyles from './AudioAttachmentPlayer.styles';

type AudioAttachmentPlayerProps = {
  attachment: ChatAudioAttachment;
  isOwn: boolean;
};

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  return `${minutes}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

export default function AudioAttachmentPlayer({
  attachment,
  isOwn,
}: AudioAttachmentPlayerProps) {
  const { colors } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const player = useAudioPlayer(attachment.uri);
  const status = useAudioPlayerStatus(player);
  const totalDuration = status.duration || attachment.durationMs / 1000;
  const progress = totalDuration > 0 ? Math.min(status.currentTime / totalDuration, 1) : 0;

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
        <View style={[styles.track, isOwn && styles.trackOwn]}>
          <View
            style={[
              styles.progress,
              isOwn && styles.progressOwn,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.duration, isOwn && styles.durationOwn]}>
          {formatDuration(status.playing ? status.currentTime : totalDuration)}
        </Text>
      </View>
    </View>
  );
}
