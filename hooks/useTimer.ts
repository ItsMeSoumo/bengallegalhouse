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
  onExpire: () => void
): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep the callback ref fresh
  onExpireRef.current = onExpire;

  // Sync initial duration when totalSeconds prop changes before starting
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(totalSeconds);
    }
  }, [totalSeconds, isRunning]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeLeft(totalSeconds);
    setIsRunning(false);
  }, [totalSeconds, clearTimer]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          // Use setTimeout to avoid calling onExpire during render
          setTimeout(() => onExpireRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { timeLeft, isRunning, start, pause, reset };
}
