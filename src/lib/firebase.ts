// Firebase web config. All values are public (they ship to the browser); set them from
// Firebase console → Project settings → Your apps → Web app.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// SMS needs the Firebase Blaze plan, so Firebase login stays off until this switch is "true".
export function firebaseEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FIREBASE_LOGIN === "true" && !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}
