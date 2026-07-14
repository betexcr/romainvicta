import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_TRACKS = [
  '/audio/theme.mp3',
  '/audio/campaign1.mp3',
  '/audio/campaign2.mp3',
  '/audio/campaign3.mp3',
  '/audio/campaign4.mp3',
];

/**
 * Ambient soundtrack with gesture unlock + playlist shuffle.
 * @param {{ audioOn: boolean, onBlocked?: () => void }} opts
 */
export function useAmbientAudio({ audioOn, onBlocked }) {
  const audioElRef = useRef(null);
  const audioTracksRef = useRef(DEFAULT_TRACKS);
  const audioIdxRef = useRef(-1);
  const audioOnRef = useRef(true);
  const audioStartedRef = useRef(false);
  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;
  audioOnRef.current = audioOn;

  const playNextTrack = useCallback(() => {
    const tracks = audioTracksRef.current;
    let next = Math.floor(Math.random() * tracks.length);
    if (next === audioIdxRef.current) next = (next + 1) % tracks.length;
    audioIdxRef.current = next;
    const a = audioElRef.current;
    if (!a) return;
    a.src = tracks[next];
    a.play().catch(() => {
      onBlockedRef.current?.();
    });
  }, []);

  useEffect(() => {
    if (!audioElRef.current) {
      const a = new Audio();
      a.volume = 0.35;
      a.addEventListener('ended', () => {
        if (audioOnRef.current) playNextTrack();
      });
      a.addEventListener('error', () => {
        if (audioOnRef.current) playNextTrack();
      });
      audioElRef.current = a;
    }
    const tryPlay = () => {
      if (!audioOnRef.current || audioStartedRef.current) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      const a = audioElRef.current;
      if (!a) return;
      audioStartedRef.current = true;
      playNextTrack();
    };
    const onInteract = () => {
      tryPlay();
      if (
        audioElRef.current &&
        audioElRef.current.paused &&
        audioOnRef.current &&
        !(typeof document !== 'undefined' && document.hidden)
      ) {
        audioElRef.current.play().catch(() => {});
      }
    };
    const onVisibility = () => {
      const a = audioElRef.current;
      if (!a) return;
      if (document.hidden) {
        a.pause();
      } else if (audioOnRef.current && a.src) {
        a.play().catch(() => {});
      }
    };
    tryPlay();
    document.addEventListener('mousedown', onInteract);
    document.addEventListener('click', onInteract);
    document.addEventListener('keydown', onInteract);
    document.addEventListener('touchstart', onInteract);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('mousedown', onInteract);
      document.removeEventListener('click', onInteract);
      document.removeEventListener('keydown', onInteract);
      document.removeEventListener('touchstart', onInteract);
      document.removeEventListener('visibilitychange', onVisibility);
      const a = audioElRef.current;
      if (a) {
        a.pause();
        a.removeAttribute('src');
        try {
          a.load();
        } catch (e) {}
      }
      audioElRef.current = null;
      audioStartedRef.current = false;
    };
  }, [playNextTrack]);

  useEffect(() => {
    const a = audioElRef.current;
    if (!a) return;
    if (audioOn) {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (a.paused && a.src) {
        a.play().catch(() => {});
      } else if (!a.src) {
        audioStartedRef.current = false;
      }
    } else {
      a.pause();
    }
  }, [audioOn]);

  return { playNextTrack };
}
