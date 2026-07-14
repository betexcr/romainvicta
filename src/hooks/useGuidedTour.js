import { useEffect, useRef, useState } from 'react';

/**
 * Guided tour step state + auto-advance timer.
 * @param {{ findItem: (id: string) => object|null, setCat, setSel, setYear, setPlaying, setSideOpen }} deps
 */
export function useGuidedTour({
  findItem,
  setCat,
  setSel,
  setYear,
  setPlaying,
  setSideOpen,
}) {
  const [tourActive, setTourActive] = useState(null);
  const [tourStep, setTourStep] = useState(0);
  const [tourPaused, setTourPaused] = useState(false);
  const tourTimerRef = useRef(null);

  const applyStep = (step) => {
    if (!step) return;
    const it = findItem(step.eventId);
    setCat(it?.cat || 'expansion');
    setSel(step.eventId);
    setYear(step.year);
  };

  const startTour = (tour) => {
    setTourActive(tour);
    setTourStep(0);
    setTourPaused(false);
    setPlaying(false);
    setSideOpen(true);
    applyStep(tour.steps[0]);
  };

  const advanceTour = (dir) => {
    if (!tourActive || typeof tourActive === 'string') return;
    const ns = tourStep + dir;
    if (ns < 0) return;
    if (ns >= tourActive.steps.length) {
      setTourActive(null);
      return;
    }
    setTourStep(ns);
    applyStep(tourActive.steps[ns]);
  };

  useEffect(() => {
    if (!tourActive || typeof tourActive === 'string' || tourPaused) return;
    clearTimeout(tourTimerRef.current);
    const step = tourActive.steps[tourStep];
    if (!step) return;
    tourTimerRef.current = setTimeout(
      () => advanceTour(1),
      step.durationMs || 6000,
    );
    return () => clearTimeout(tourTimerRef.current);
    // advanceTour closes over tourActive/tourStep; intentional re-bind each step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourActive, tourStep, tourPaused]);

  return {
    tourActive,
    setTourActive,
    tourStep,
    setTourStep,
    tourPaused,
    setTourPaused,
    startTour,
    advanceTour,
  };
}
