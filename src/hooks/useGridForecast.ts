import { useEffect, useState } from 'react';
import { generateNLGrid } from '@/lib/gridSampler';
import { getGridForecast } from '@/lib/openMeteo';
import type { GridPoint } from '@/types/weather';

interface GridState {
  gridPoints: GridPoint[];
  loading: boolean;
  error: string | null;
}

const NL_GRID = generateNLGrid(); // stable reference — never changes

export function useGridForecast(): GridState {
  const [state, setState] = useState<GridState>({
    gridPoints: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    getGridForecast(NL_GRID)
      .then((points) => {
        if (!cancelled) setState({ gridPoints: points, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            gridPoints: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Kon het overzicht niet laden.',
          });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
