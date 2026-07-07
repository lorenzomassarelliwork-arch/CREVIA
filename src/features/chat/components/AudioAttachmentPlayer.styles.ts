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
    trackColumn: { flex: 1 },
    track: {
      height: 4,
      overflow: 'hidden',
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    trackOwn: { backgroundColor: colors.toggleTrackOn },
    progress: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
    progressOwn: { backgroundColor: colors.white },
    duration: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
    durationOwn: { color: colors.white, opacity: 0.8 },
  });
}
