import { useEffect, useState } from "react";
import { getForecast } from "@/lib/openMeteo";
import type { LatLon, PointForecast } from "@/types/weather";

interface ForecastState {
  forecast: PointForecast | null;
  loading: boolean;
  error: string | null;
}

/** Fetches current conditions whenever the selected point changes. */
export function usePointForecast(point: LatLon | null): ForecastState {
  const [state, setState] = useState<ForecastState>({
    forecast: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!point) {
      setState({ forecast: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    getForecast(point)
      .then((forecast) => {
        if (!cancelled) setState({ forecast, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            forecast: null,
            loading: false,
            error:
              err instanceof Error
                ? err.message
                : "Kon de weergegevens niet ophalen.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [point?.lat, point?.lon]);

  return state;
}
