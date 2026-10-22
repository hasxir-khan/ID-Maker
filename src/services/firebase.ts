import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import localFirebaseConfig from '../../firebase-applet-config.json';

// Support Vercel environment variables (VITE_FIREBASE_*) with fallback to local configuration
const env = typeof import.meta !== 'undefined' ? import.meta.env : ({} as any);

export const activeFirebaseConfig = {
  projectId: env?.VITE_FIREBASE_PROJECT_ID || localFirebaseConfig.projectId,
  appId: env?.VITE_FIREBASE_APP_ID || localFirebaseConfig.appId,
  apiKey: env?.VITE_FIREBASE_API_KEY || localFirebaseConfig.apiKey,
  authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN || localFirebaseConfig.authDomain,
  firestoreDatabaseId: env?.VITE_FIREBASE_DATABASE_ID || localFirebaseConfig.firestoreDatabaseId || '(default)',
  storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET || localFirebaseConfig.storageBucket,
  messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID || localFirebaseConfig.messagingSenderId,
  measurementId: env?.VITE_FIREBASE_MEASUREMENT_ID || localFirebaseConfig.measurementId || '',
};

// Initialize Firebase App
const app = initializeApp(activeFirebaseConfig);

// CRITICAL: Must use firestoreDatabaseId specified in configuration
export const db = getFirestore(app, activeFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app, activeFirebaseConfig.storageBucket);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
      return false;
    }
    return true;
  }
}
