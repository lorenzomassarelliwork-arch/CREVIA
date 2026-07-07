import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import type { ChatAudioAttachment } from '../types';

function createAttachmentId() {
  return `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const isRecordingRef = useRef(false);
  const [error, setError] = useState<'permission' | 'recording' | null>(null);

  useEffect(
    () => () => {
      if (isRecordingRef.current) void recorder.stop().catch(() => undefined);
      void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    },
    [recorder]
  );

  const startRecording = async () => {
    setError(null);
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('permission');
      return false;
    }

    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      isRecordingRef.current = true;
      return true;
    } catch {
      setError('recording');
      return false;
    }
  };

  const finishRecording = async (): Promise<ChatAudioAttachment | null> => {
    if (!isRecordingRef.current) return null;

    try {
      const durationMs = recorderState.durationMillis;
      await recorder.stop();
      isRecordingRef.current = false;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!recorder.uri) return null;
      const isWeb = Platform.OS === 'web';

      return {
        id: createAttachmentId(),
        kind: 'audio',
        uri: recorder.uri,
        fileName: `voice-${Date.now()}.${isWeb ? 'webm' : 'm4a'}`,
        mimeType: isWeb ? 'audio/webm' : 'audio/mp4',
        fileSize: null,
        durationMs,
      };
    } catch {
      setError('recording');
      return null;
    }
  };

  const cancelRecording = async () => {
    if (isRecordingRef.current) await recorder.stop().catch(() => undefined);
    isRecordingRef.current = false;
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(
      () => undefined
    );
  };

  return {
    cancelRecording,
    durationMs: recorderState.durationMillis,
    error,
    finishRecording,
    isRecording: recorderState.isRecording,
    startRecording,
  };
}
