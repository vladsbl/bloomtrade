import * as Notifications from 'expo-notifications';

// Show alerts as banners even when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionGranted: boolean | null = null;

/** Request notification permission once and cache the result. */
export async function ensureNotificationPermissions(): Promise<boolean> {
  if (permissionGranted !== null) return permissionGranted;

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      permissionGranted = true;
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    permissionGranted = requested.granted;
    return requested.granted;
  } catch {
    permissionGranted = false;
    return false;
  }
}

/** Fire a local notification immediately (no scheduling). */
export async function sendLocalNotification(title: string, body: string): Promise<void> {
  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
    // Notifications are best-effort; never let a failure break price polling.
  }
}
