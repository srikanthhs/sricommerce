import { createRemoteJWKSet, jwtVerify } from "jose";
import { firebaseConfig } from "./firebase";
import { normalizePhone } from "./auth";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export type FirebaseIdentity = { phone: string } | { email: string };

// Verifies a Firebase ID token and returns who it was issued for: a 10-digit phone number
// (phone sign-in) or a verified email (Google sign-in). Uses Google's public keys, so no
// service-account secret is needed.
export async function verifyFirebaseToken(idToken: string): Promise<FirebaseIdentity | null> {
  const projectId = firebaseConfig.projectId;
  if (!projectId) return null;
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) return null;
    const phone = normalizePhone(payload.phone_number);
    if (phone) return { phone };
    if (typeof payload.email === "string" && payload.email_verified === true) {
      return { email: payload.email.toLowerCase() };
    }
    return null;
  } catch {
    return null;
  }
}
