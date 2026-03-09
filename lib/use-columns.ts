import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export function getColumnCount(width: number): number {
  if (width < 600) return 3;
  if (width < 900) return 4;
  if (width < 1200) return 5;
  return 6;
}

export function useColumns(): number {
  const [cols, setCols] = useState(() =>
    getColumnCount(Dimensions.get('window').width)
  );

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setCols(getColumnCount(window.width));
    });
    return () => sub.remove();
  }, []);

  return cols;
}
