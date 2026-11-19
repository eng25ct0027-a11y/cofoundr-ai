import { useCallback, useEffect } from 'react';

export function useInterval(callback, delay) {
  const memoized = useCallback(callback, [callback]);

  useEffect(() => {
    if (delay === null) return undefined;
    const id = setInterval(memoized, delay);
    return () => clearInterval(id);
  }, [memoized, delay]);
}
