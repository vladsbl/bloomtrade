import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { checkAlerts, loadAlerts, saveAlerts } from '../services/alertService';
import { sendLocalNotification } from '../services/notificationService';
import { useLanguage } from './i18n';
import { PriceAlert } from '../types/alert';

// Foreground polling cadence. Kept conservative to limit API calls on mobile.
const POLL_INTERVAL_MS = 60_000;

export type NewAlertInput = Pick<
  PriceAlert,
  'symbol' | 'apiSymbol' | 'name' | 'condition' | 'targetPrice'
>;

interface AlertsContextValue {
  alerts: PriceAlert[];
  loading: boolean;
  addAlert: (input: NewAlertInput) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
}

const AlertsContext = createContext<AlertsContextValue | undefined>(undefined);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Mirror of `alerts` so the polling loop always reads the latest list.
  const alertsRef = useRef<PriceAlert[]>([]);
  const checkingRef = useRef(false);

  const commit = useCallback((next: PriceAlert[]) => {
    alertsRef.current = next;
    setAlerts(next);
    saveAlerts(next);
  }, []);

  useEffect(() => {
    loadAlerts()
      .then((stored) => {
        alertsRef.current = stored;
        setAlerts(stored);
      })
      .finally(() => setLoading(false));
  }, []);

  const runCheck = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const triggered = await checkAlerts(alertsRef.current);
      if (triggered.length === 0) return;

      const triggeredIds = new Set(triggered.map((item) => item.alert.id));
      const now = Date.now();

      for (const { alert, price } of triggered) {
        const direction = alert.condition === 'above' ? t('alerts.above') : t('alerts.below');
        await sendLocalNotification(
          t('alerts.notificationTitle'),
          `${alert.name} (${alert.symbol}) ${direction} $${alert.targetPrice} — $${price.toFixed(2)}`
        );
      }

      // One-shot: deactivate triggered alerts so they don't notify repeatedly.
      const next = alertsRef.current.map((alert) =>
        triggeredIds.has(alert.id) ? { ...alert, isActive: false, triggeredAt: now } : alert
      );
      commit(next);
    } catch {
      // Polling is best-effort; ignore transient failures.
    } finally {
      checkingRef.current = false;
    }
  }, [t, commit]);

  // Poll while the app is in the foreground; check immediately on resume.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      runCheck();
      interval = setInterval(runCheck, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') start();
      else stop();
    });

    if (AppState.currentState === 'active') start();

    return () => {
      stop();
      subscription.remove();
    };
  }, [runCheck]);

  const addAlert = useCallback(
    (input: NewAlertInput) => {
      const alert: PriceAlert = {
        ...input,
        id: Date.now().toString(),
        isActive: true,
        createdAt: Date.now(),
      };
      commit([alert, ...alertsRef.current]);
    },
    [commit]
  );

  const removeAlert = useCallback(
    (id: string) => {
      commit(alertsRef.current.filter((alert) => alert.id !== id));
    },
    [commit]
  );

  const toggleAlert = useCallback(
    (id: string) => {
      commit(
        alertsRef.current.map((alert) =>
          alert.id === id
            ? { ...alert, isActive: !alert.isActive, triggeredAt: undefined }
            : alert
        )
      );
    },
    [commit]
  );

  return (
    <AlertsContext.Provider value={{ alerts, loading, addAlert, removeAlert, toggleAlert }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts(): AlertsContextValue {
  const ctx = useContext(AlertsContext);
  if (!ctx) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return ctx;
}
