import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

/*
 * Server-only Firebase Admin setup. Needs a service account —
 * see README-PUSH-NOTIFICATIONS.md for how to get these values.
 *
 * RECOMMENDED (avoids all private-key newline/quoting issues):
 *   FIREBASE_SERVICE_ACCOUNT_BASE64=<whole service account JSON, base64-encoded>
 *
 * FALLBACK (only if you can't use the base64 method):
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY
 */

function getServiceAccountFromBase64(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const encoded = (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "").trim();
  if (!encoded) return null;

  try {
    const json = Buffer.from(encoded, "base64").toString("utf-8");
    const parsed = JSON.parse(json);

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      throw new Error("Decoded JSON is missing project_id, client_email or private_key.");
    }

    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  } catch (error) {
    console.error(
      "FIREBASE_SERVICE_ACCOUNT_BASE64 could not be decoded/parsed. " +
        "Make sure you base64-encoded the ENTIRE service account JSON file with no edits.",
      error
    );
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_BASE64 is set but invalid. See README-PUSH-NOTIFICATIONS.md."
    );
  }
}

function getServiceAccountFromSeparateVars(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";

  if (!projectId || !clientEmail || !rawKey) return null;

  // Handle common .env copy-paste mistakes:
  rawKey = rawKey.trim();

  // 1. Surrounding quotes accidentally included in the value itself.
  if (
    (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
    (rawKey.startsWith("'") && rawKey.endsWith("'"))
  ) {
    rawKey = rawKey.slice(1, -1);
  }

  // 2. Escaped "\n" (two characters: backslash + n) → real newlines.
  const privateKey = rawKey.replace(/\\n/g, "\n").trim();

  console.log(
    "[firebaseAdmin] key diagnostics — length:",
    privateKey.length,
    "hasBeginMarker:",
    privateKey.includes("-----BEGIN PRIVATE KEY-----"),
    "hasEndMarker:",
    privateKey.includes("-----END PRIVATE KEY-----"),
    "hasRealNewlines:",
    privateKey.includes("\n")
  );

  if (
    !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
    !privateKey.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Error(
      "FIREBASE_ADMIN_PRIVATE_KEY doesn't look like a valid PEM key " +
        "(missing BEGIN/END markers). This method is fragile — switch to " +
        "FIREBASE_SERVICE_ACCOUNT_BASE64 instead. See README-PUSH-NOTIFICATIONS.md."
    );
  }

  return { projectId, clientEmail, privateKey };
}

function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  const account =
    getServiceAccountFromBase64() || getServiceAccountFromSeparateVars();

  if (!account) {
    throw new Error(
      "Firebase Admin credentials are missing. Set either " +
        "FIREBASE_SERVICE_ACCOUNT_BASE64 (recommended), or all three of " +
        "FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / " +
        "FIREBASE_ADMIN_PRIVATE_KEY. See README-PUSH-NOTIFICATIONS.md."
    );
  }

  return initializeApp({
    credential: cert(account),
  });
}

export const adminMessaging = () => getMessaging(getAdminApp());
export const adminFirestore = () => getFirestore(getAdminApp());
export const adminAuth = () => getAuth(getAdminApp());
