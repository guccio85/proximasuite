// ============================================================
// services/permissionsService.ts — v2.5.0
// ============================================================
// Wrapper per i permessi Capacitor (camera + GPS).
// Su piattaforma nativa usa i plugin Capacitor.
// Su web usa le API browser come fallback (restituisce 'web').
// ============================================================

import { Capacitor } from '@capacitor/core';

export type PermissionStatus = 'granted' | 'denied' | 'web' | 'unknown';

// ── CAMERA ──────────────────────────────────────────────────

/**
 * Richiede il permesso fotocamera.
 * Nativo: usa @capacitor/camera
 * Web: prova navigator.mediaDevices e restituisce 'web'
 */
export const requestCameraPermission = async (): Promise<PermissionStatus> => {
  if (!Capacitor.isNativePlatform()) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {
      // nessun errore critico — è solo un check web
    }
    return 'web';
  }
  try {
    const { Camera } = await import('@capacitor/camera');
    const result = await Camera.requestPermissions({ permissions: ['camera'] });
    const status = result.camera;
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'denied';
  } catch (err) {
    console.error('Camera permission error:', err);
    return 'unknown';
  }
};

/**
 * Controlla lo stato attuale del permesso fotocamera senza richiederlo.
 */
export const getCameraPermissionStatus = async (): Promise<PermissionStatus> => {
  if (!Capacitor.isNativePlatform()) return 'web';
  try {
    const { Camera } = await import('@capacitor/camera');
    const result = await Camera.checkPermissions();
    const status = result.camera;
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'denied';
  } catch {
    return 'unknown';
  }
};

// ── GEOLOCALIZZAZIONE ────────────────────────────────────────

/**
 * Richiede il permesso GPS / localizzazione.
 * Nativo: usa @capacitor/geolocation
 * Web: usa navigator.geolocation e restituisce 'web'
 */
export const requestLocationPermission = async (): Promise<PermissionStatus> => {
  if (!Capacitor.isNativePlatform()) {
    return new Promise<PermissionStatus>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve('web'),
        () => resolve('web'),
        { timeout: 3000 }
      );
    });
  }
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const result = await Geolocation.requestPermissions();
    const status = result.location;
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'denied';
  } catch (err) {
    console.error('Location permission error:', err);
    return 'unknown';
  }
};

/**
 * Controlla lo stato attuale del permesso GPS senza richiederlo.
 */
export const getLocationPermissionStatus = async (): Promise<PermissionStatus> => {
  if (!Capacitor.isNativePlatform()) return 'web';
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const result = await Geolocation.checkPermissions();
    const status = result.location;
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'denied';
  } catch {
    return 'unknown';
  }
};

// ── STATO COMBINATO ──────────────────────────────────────────

/**
 * Restituisce lo stato corrente di tutti i permessi in un unico oggetto.
 */
export const getPermissionsStatus = async (): Promise<{
  camera: PermissionStatus;
  location: PermissionStatus;
}> => {
  const [camera, location] = await Promise.all([
    getCameraPermissionStatus(),
    getLocationPermissionStatus(),
  ]);
  return { camera, location };
};
