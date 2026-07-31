"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useTimer(
  totalSeconds: number,
  onExpire: () => void,
  hardEndTimestamp?: number
): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep callback reference updated safely in an effect
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Sync initial duration when totalSeconds prop changes before starting
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft((prev) => (prev !== totalSeconds ? totalSeconds : prev));
    }
  }, [totalSeconds, isRunning]);

  const start = useCallback(() => {
    if (isRunning) return;
    endTimeRef.current = Date.now() + (timeLeft > 0 ? timeLeft : totalSeconds) * 1000;
    setIsRunning(true);
  }, [isRunning, timeLeft, totalSeconds]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    clearTimer();
    if (endTimeRef.current) {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
    }
    endTimeRef.current = null;
    setIsRunning(false);
  }, [isRunning, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    endTimeRef.current = null;
    setTimeLeft(totalSeconds);
    setIsRunning(false);
  }, [totalSeconds, clearTimer]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    }

    const updateTimer = () => {
      const now = Date.now();

      // Enforce strict expiration at hardEndTimestamp
      if (hardEndTimestamp && now >= hardEndTimestamp) {
        clearTimer();
        endTimeRef.current = null;
        setIsRunning(false);
        setTimeout(() => {
          onExpireRef.current();
        }, 0);
        return;
      }

      if (!endTimeRef.current) return;
      let remainingSeconds = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

      if (hardEndTimestamp) {
        const secondsUntilHardEnd = Math.max(0, Math.ceil((hardEndTimestamp - now) / 1000));
        remainingSeconds = Math.min(remainingSeconds, secondsUntilHardEnd);
      }

      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearTimer();
        endTimeRef.current = null;
        setIsRunning(false);
        setTimeout(() => {
          onExpireRef.current();
        }, 0);
      }
    };

    // Immediate check on start/resume
    updateTimer();

    timerRef.current = setInterval(updateTimer, 500);

    return clearTimer;
  }, [isRunning, clearTimer, hardEndTimestamp]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { timeLeft, isRunning, start, pause, reset };
}

