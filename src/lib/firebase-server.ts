import { createRemoteJWKSet, jwtVerify } from "jose";
import { firebaseConfig } from "./firebase";
import { normalizePhone } from "./auth";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

// Verifies a Firebase ID token and returns the 10-digit phone number it was issued for.
// Uses Google's public keys, so no service-account secret is needed.
export async function verifyFirebasePhone(idToken: string): Promise<string | null> {
  const projectId = firebaseConfig.projectId;
  if (!projectId) return null;
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) return null;
    return normalizePhone(payload.phone_number);
  } catch {
    return null;
  }
}
