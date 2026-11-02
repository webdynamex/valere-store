import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export function getAdminDb() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;

  const app = getApps().find((item) => item.name === "valere-admin") || initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  }, "valere-admin");

  return getFirestore(app);
}

export function getAdminAuth() {
  const app = getApps().find((item) => item.name === "valere-admin");
  return app ? getAuth(app) : null;
}
