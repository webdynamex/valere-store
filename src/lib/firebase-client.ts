"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
let app: FirebaseApp | undefined;
export function getClientApp() {
  if (!isFirebaseConfigured) return null;
  return (app ??= getApps().length ? getApp() : initializeApp(firebaseConfig));
}
export function getClientDb(): Firestore | null {
  const client = getClientApp();
  return client ? getFirestore(client) : null;
}
export function getClientAuth(): Auth | null {
  const client = getClientApp();
  return client ? getAuth(client) : null;
}
export function getClientStorage(): FirebaseStorage | null {
  const client = getClientApp();
  return client ? getStorage(client) : null;
}
