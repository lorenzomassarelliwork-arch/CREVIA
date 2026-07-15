import { StyleSheet } from 'react-native';

import type { ColorPalette } from '../../../theme/colors';

export default function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      width: 210,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 3,
    },
    playButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
      backgroundColor: colors.primary,
    },
    playButtonOwn: { backgroundColor: colors.white },
    trackColumn: { flex: 1, minWidth: 0 },
    waveform: {
      height: 26,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    waveformBar: {
      width: 2,
      minHeight: 4,
      borderRadius: 2,
      backgroundColor: colors.toggleTrackOff,
    },
    waveformBarOwn: { backgroundColor: colors.toggleTrackOn },
    waveformBarPlayed: { backgroundColor: colors.primary },
    waveformBarPlayedOwn: { backgroundColor: colors.white },
    duration: {
      color: colors.textMuted,
      fontSize: 10,
      fontVariant: ['tabular-nums'],
      marginTop: 3,
    },
    durationOwn: { color: colors.white, opacity: 0.8 },
  });
}
