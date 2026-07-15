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

const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

const WAVEFORM_SAMPLE_COUNT = 38;

function createAttachmentId() {
  return `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildWaveform(samples: number[]) {
  if (samples.length === 0) return undefined;

  return Array.from({ length: WAVEFORM_SAMPLE_COUNT }, (_, index) => {
    const start = Math.floor((index * samples.length) / WAVEFORM_SAMPLE_COUNT);
    const end = Math.max(
      start + 1,
      Math.floor(((index + 1) * samples.length) / WAVEFORM_SAMPLE_COUNT)
    );
    const bucket = samples.slice(start, Math.min(end, samples.length));
    const value =
      bucket.length > 0
        ? Math.max(...bucket)
        : samples[samples.length - 1] ?? 0.12;
    return Math.round(value * 1000) / 1000;
  });
}

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 200);
  const isRecordingRef = useRef(false);
  const waveformSamplesRef = useRef<number[]>([]);
  const [error, setError] = useState<'permission' | 'recording' | null>(null);

  useEffect(
    () => () => {
      if (isRecordingRef.current) void recorder.stop().catch(() => undefined);
      void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    },
    [recorder]
  );

  useEffect(() => {
    if (!isRecordingRef.current || typeof recorderState.metering !== 'number') return;

    const normalizedLevel = Math.min(
      1,
      Math.max(0.08, (recorderState.metering + 55) / 55)
    );
    waveformSamplesRef.current.push(normalizedLevel);
  }, [recorderState.metering]);

  const startRecording = async () => {
    setError(null);
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('permission');
      return false;
    }

    try {
      waveformSamplesRef.current = [];
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
        waveform: buildWaveform(waveformSamplesRef.current),
      };
    } catch {
      setError('recording');
      return null;
    }
  };

  const cancelRecording = async () => {
    if (isRecordingRef.current) await recorder.stop().catch(() => undefined);
    isRecordingRef.current = false;
    waveformSamplesRef.current = [];
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
