import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave: () => Promise<void>;
}

export function useAutoSave({ delay = 2000, onSave }: UseAutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const triggerSave = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsSaving(true);
    try {
      await onSave();
      if (isMountedRef.current) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [onSave]);

  const scheduleAutoSave = useCallback(() => {
    setHasUnsavedChanges(true);

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      triggerSave();
    }, delay);
  }, [delay, triggerSave]);

  const saveNow = useCallback(async () => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    await triggerSave();
  }, [triggerSave]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    scheduleAutoSave,
    saveNow,
  };
}
