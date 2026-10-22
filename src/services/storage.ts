import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  migrateCardAssetsToStorage,
  migrateBrandKitAssetsToStorage,
  validateCardDocumentSize,
} from './assetStorage';
import { CardData, CardStatus, BrandKit, UserProfile, normalizeCardElements } from '../types/card';
import { SAMPLE_CARDS, SAMPLE_BRAND_KITS } from '../data/sampleCards';

const SETTINGS_STORAGE_KEY = 'idmaker_settings_v1';

export interface AppSettings {
  defaultCardPreset: 'CR80' | 'ID-1' | 'Custom';
  defaultOrientation: 'horizontal' | 'vertical';
  defaultValidityYears: number;
  highResolutionExport: boolean;
  bleedMarginMm: number;
  snapToGrid: boolean;
  gridSize: number;
  theme: 'light' | 'dark' | 'system';
  enablePublicVerification: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultCardPreset: 'CR80',
  defaultOrientation: 'horizontal',
  defaultValidityYears: 1,
  highResolutionExport: true,
  bleedMarginMm: 3,
  snapToGrid: true,
  gridSize: 8,
  theme: 'light',
  enablePublicVerification: true,
};

class StorageService {
  private currentUserProfile: UserProfile | null = null;
  private isAuthInitialized: boolean = false;
  private cachedCards: CardData[] = [];
  private cachedBrandKits: BrandKit[] = [];
  private authListeners: Set<(user: UserProfile | null) => void> = new Set();
  private authLoadingListeners: Set<(loading: boolean) => void> = new Set();
  private cardsListeners: Set<(cards: CardData[]) => void> = new Set();
  private brandKitsListeners: Set<(kits: BrandKit[]) => void> = new Set();
  private unsubscribeCardsSnapshot: (() => void) | null = null;
  private unsubscribeBrandKitsSnapshot: (() => void) | null = null;

  constructor() {
    this.initAuthListener();
  }

  private formatUserProfile(uid: string, data: any, fbUser?: FirebaseUser | null): UserProfile {
    const rawName =
      data?.displayName ||
      data?.name ||
      fbUser?.displayName ||
      (data?.email || fbUser?.email || '').split('@')[0] ||
      'User';

    const email = data?.email || fbUser?.email || '';
    const organization = data?.organization ?? '';
    const role = data?.role ?? 'user';
    const plan = data?.plan || 'professional';

    const createdAt = data?.createdAt?.toDate
      ? data.createdAt.toDate().toISOString()
      : typeof data?.createdAt === 'string'
      ? data.createdAt
      : new Date().toISOString();

    const updatedAt = data?.updatedAt?.toDate
      ? data.updatedAt.toDate().toISOString()
      : typeof data?.updatedAt === 'string'
      ? data.updatedAt
      : new Date().toISOString();

    return {
      id: uid,
      uid: uid,
      name: rawName,
      displayName: rawName,
      email,
      organization,
      role,
      plan,
      createdAt,
      updatedAt,
    };
  }

  private initAuthListener() {
    onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDocPath = `users/${fbUser.uid}`;
        console.info(`[StorageService:Auth] Authenticated session detected (${fbUser.uid}). Loading profile at /${userDocPath}...`);
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.info(`[StorageService:Auth] Found user profile at /${userDocPath}`);
            this.currentUserProfile = this.formatUserProfile(fbUser.uid, data, fbUser);
          } else {
            console.info(`[StorageService:Auth] Profile /${userDocPath} does not exist. Creating default profile...`);
            const defaultName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
            const newProfilePayload = {
              uid: fbUser.uid,
              id: fbUser.uid,
              email: fbUser.email || '',
              displayName: defaultName,
              name: defaultName,
              organization: '',
              role: 'user',
              plan: 'professional',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', fbUser.uid), newProfilePayload);
            console.info(`[StorageService:Auth] Successfully created profile at /${userDocPath}`);
            this.currentUserProfile = this.formatUserProfile(fbUser.uid, newProfilePayload, fbUser);
          }
        } catch (err: any) {
          console.error(`[StorageService:Auth] Failed to load/create user document at /${userDocPath}:`, err);
          console.error(`[StorageService:Auth] Exact collection: "users", Document ID: "${fbUser.uid}"`);
          this.currentUserProfile = this.formatUserProfile(fbUser.uid, null, fbUser);
        }

        // Attach live Firestore listeners for user's isolated data
        this.attachUserDataListeners(fbUser.uid);
      } else {
        this.currentUserProfile = null;
        this.cachedCards = [];
        this.cachedBrandKits = [];
        this.detachUserDataListeners();
      }

      this.isAuthInitialized = true;
      this.notifyAuth();
      this.notifyAuthLoading(false);
    });
  }

  private attachUserDataListeners(uid: string) {
    this.detachUserDataListeners();

    // 1. Live cards listener for this user
    try {
      const cardsQuery = query(collection(db, 'cards'), where('ownerId', '==', uid));
      this.unsubscribeCardsSnapshot = onSnapshot(
        cardsQuery,
        (snapshot) => {
          const cards: CardData[] = [];
          snapshot.forEach((docSnap) => {
            const raw = docSnap.data() as CardData;
            const normalized = normalizeCardElements(raw);
            cards.push({
              ...raw,
              elementsFront: normalized.elementsFront,
              elementsBack: normalized.elementsBack,
              elements: normalized.elements,
            });
          });
          this.cachedCards = cards;
          this.notifyCards();
        },
        (error) => {
          console.error('Cards snapshot error:', error);
        }
      );
    } catch (err) {
      console.error('Error attaching cards listener:', err);
    }

    // 2. Live brand kits listener
    try {
      const brandKitsQuery = query(collection(db, 'brandKits'), where('ownerId', '==', uid));
      this.unsubscribeBrandKitsSnapshot = onSnapshot(
        brandKitsQuery,
        (snapshot) => {
          const kits: BrandKit[] = [];
          snapshot.forEach((docSnap) => {
            kits.push(docSnap.data() as BrandKit);
          });
          this.cachedBrandKits = kits;
          this.notifyBrandKits();
        },
        (error) => {
          console.error('Brand kits snapshot error:', error);
        }
      );
    } catch (err) {
      console.error('Error attaching brand kits listener:', err);
    }
  }

  private detachUserDataListeners() {
    if (this.unsubscribeCardsSnapshot) {
      this.unsubscribeCardsSnapshot();
      this.unsubscribeCardsSnapshot = null;
    }
    if (this.unsubscribeBrandKitsSnapshot) {
      this.unsubscribeBrandKitsSnapshot();
      this.unsubscribeBrandKitsSnapshot = null;
    }
  }

  // Subscriptions
  public isAuthReady(): boolean {
    return this.isAuthInitialized;
  }

  public subscribeAuthLoading(callback: (loading: boolean) => void): () => void {
    this.authLoadingListeners.add(callback);
    callback(!this.isAuthInitialized);
    return () => this.authLoadingListeners.delete(callback);
  }

  private notifyAuthLoading(loading: boolean) {
    this.authLoadingListeners.forEach((fn) => fn(loading));
  }

  public subscribeAuth(callback: (user: UserProfile | null) => void): () => void {
    this.authListeners.add(callback);
    callback(this.currentUserProfile);
    return () => this.authListeners.delete(callback);
  }

  public subscribeCards(callback: (cards: CardData[]) => void): () => void {
    this.cardsListeners.add(callback);
    callback(this.cachedCards);
    return () => this.cardsListeners.delete(callback);
  }

  public subscribeBrandKits(callback: (kits: BrandKit[]) => void): () => void {
    this.brandKitsListeners.add(callback);
    callback(this.cachedBrandKits);
    return () => this.brandKitsListeners.delete(callback);
  }

  private notifyAuth() {
    this.authListeners.forEach((fn) => fn(this.currentUserProfile));
  }

  private notifyCards() {
    this.cardsListeners.forEach((fn) => fn(this.cachedCards));
  }

  private notifyBrandKits() {
    this.brandKitsListeners.forEach((fn) => fn(this.cachedBrandKits));
  }

  // --- AUTHENTICATION ---
  public async registerAccount(
    name: string,
    email: string,
    password: string,
    organization: string,
    role: string
  ): Promise<UserProfile> {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const uid = user.uid;
      const userDocPath = `users/${uid}`;

      const profilePayload = {
        uid: uid,
        id: uid,
        email: user.email || email.trim(),
        displayName: name.trim() || user.displayName || 'User',
        name: name.trim() || user.displayName || 'User',
        organization: organization.trim() || '',
        role: role.trim() || 'user',
        plan: 'professional',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'users', uid), profilePayload);
        console.info(`[StorageService:Register] Created user profile at /${userDocPath}`);
      } catch (docErr: any) {
        console.error(`[StorageService:Register] Failed to write user profile at /${userDocPath}:`, docErr);
        console.error(`[StorageService:Register] Exact collection: "users", Document ID: "${uid}"`);
        throw docErr;
      }

      const formatted = this.formatUserProfile(uid, profilePayload, user);
      this.currentUserProfile = formatted;
      this.notifyAuth();
      return formatted;
    } catch (err: any) {
      console.error('[StorageService:Register] Registration failed:', err);
      throw new Error(err.message || 'Registration failed.');
    }
  }

  public async loginAccount(email: string, password: string): Promise<UserProfile> {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const uid = user.uid;
      const userDocPath = `users/${uid}`;

      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          console.info(`[StorageService:Login] Loaded existing profile at /${userDocPath}`);
          this.currentUserProfile = this.formatUserProfile(uid, userDoc.data(), user);
        } else {
          console.info(`[StorageService:Login] Profile /${userDocPath} does not exist. Creating default profile...`);
          const defaultName = user.displayName || email.split('@')[0] || 'User';
          const profilePayload = {
            uid: uid,
            id: uid,
            email: email.trim(),
            displayName: defaultName,
            name: defaultName,
            organization: '',
            role: 'user',
            plan: 'professional',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', uid), profilePayload);
          console.info(`[StorageService:Login] Successfully created profile at /${userDocPath}`);
          this.currentUserProfile = this.formatUserProfile(uid, profilePayload, user);
        }
      } catch (docErr: any) {
        console.error(`[StorageService:Login] Failed to load/create profile at /${userDocPath}:`, docErr);
        console.error(`[StorageService:Login] Exact collection: "users", Document ID: "${uid}"`);
        this.currentUserProfile = this.formatUserProfile(uid, null, user);
      }

      this.notifyAuth();
      return this.currentUserProfile;
    } catch (err: any) {
      console.error('[StorageService:Login] Login failed:', err);
      throw new Error(err.message || 'Invalid email or password.');
    }
  }

  public async loginWithGoogle(): Promise<UserProfile> {
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      const user = userCred.user;
      const uid = user.uid;
      const userDocPath = `users/${uid}`;

      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          console.info(`[StorageService:GoogleAuth] Loaded existing profile at /${userDocPath}`);
          this.currentUserProfile = this.formatUserProfile(uid, userDoc.data(), user);
        } else {
          console.info(`[StorageService:GoogleAuth] Creating missing profile at /${userDocPath}...`);
          const defaultName = user.displayName || user.email?.split('@')[0] || 'User';
          const profilePayload = {
            uid: uid,
            id: uid,
            email: user.email || '',
            displayName: defaultName,
            name: defaultName,
            organization: '',
            role: 'user',
            plan: 'professional',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', uid), profilePayload);
          console.info(`[StorageService:GoogleAuth] Successfully created profile at /${userDocPath}`);
          this.currentUserProfile = this.formatUserProfile(uid, profilePayload, user);
        }
      } catch (docErr: any) {
        console.error(`[StorageService:GoogleAuth] Failed to load/create profile at /${userDocPath}:`, docErr);
        console.error(`[StorageService:GoogleAuth] Exact collection: "users", Document ID: "${uid}"`);
        this.currentUserProfile = this.formatUserProfile(uid, null, user);
      }

      this.notifyAuth();
      return this.currentUserProfile;
    } catch (err: any) {
      console.error('[StorageService:GoogleAuth] Google sign-in failed:', err);
      throw new Error(err.message || 'Google authentication failed.');
    }
  }

  public async logoutUser(): Promise<void> {
    await signOut(auth);
    this.currentUserProfile = null;
    this.cachedCards = [];
    this.cachedBrandKits = [];
    this.detachUserDataListeners();
    this.notifyAuth();
    this.notifyCards();
    this.notifyBrandKits();
  }

  public getUser(): UserProfile | null {
    return this.currentUserProfile;
  }

  public async saveUser(user: UserProfile): Promise<void> {
    if (!auth.currentUser) throw new Error('Not authenticated.');
    const uid = auth.currentUser.uid;
    const path = `users/${uid}`;
    try {
      const updatedPayload = {
        uid: uid,
        id: uid,
        email: auth.currentUser.email || user.email || '',
        displayName: user.displayName || user.name || 'User',
        name: user.name || user.displayName || 'User',
        organization: user.organization || '',
        role: user.role || 'user',
        plan: user.plan || 'professional',
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', uid), updatedPayload, { merge: true });
      this.currentUserProfile = this.formatUserProfile(uid, { ...user, ...updatedPayload }, auth.currentUser);
      this.notifyAuth();
    } catch (err) {
      console.error(`[StorageService] Failed to save user at /${path}:`, err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // --- CARDS CRUD ---
  public getCards(): CardData[] {
    return this.cachedCards;
  }

  public async getCardById(id: string): Promise<CardData | undefined> {
    // 1. Check in user's memory cache
    const targetId = (id ?? '').toString().toLowerCase();
    const cached = this.cachedCards.find((c) => (c?.id ?? '').toString().toLowerCase() === targetId);
    if (cached) return cached;

    // 2. Query Firestore directly if authenticated owner
    if (auth.currentUser) {
      try {
        const cardDoc = await getDoc(doc(db, 'cards', id));
        if (cardDoc.exists()) {
          const data = cardDoc.data() as CardData;
          if (data.ownerId === auth.currentUser.uid) {
            const normalized = normalizeCardElements(data);
            return {
              ...data,
              elementsFront: normalized.elementsFront,
              elementsBack: normalized.elementsBack,
              elements: normalized.elements,
            };
          }
        }
      } catch (err) {
        // May fail if not owner, ignore and fallback to verification
      }
    }

    // 3. Fallback to public verification record (for QR scans by non-owners)
    try {
      const verifDoc = await getDoc(doc(db, 'verifications', id));
      if (verifDoc.exists()) {
        const vData = verifDoc.data();
        return {
          id: vData.cardId,
          cardTypeId: vData.cardTypeId || 'standard',
          templateId: 'modern-academic',
          name: `${vData.cardTypeId || 'Card'} — ${vData.personName}`,
          personName: vData.personName,
          organizationName: vData.organizationName || 'Verified Organization',
          orientation: 'horizontal',
          dimensions: { width: 85.6, height: 53.98, unit: 'mm', preset: 'CR80' },
          fieldValues: {
            fullName: vData.personName,
            institutionName: vData.organizationName,
            department: vData.department || '',
            issueDate: vData.issueDate || '',
            expiryDate: vData.expiryDate || '',
            issuedBy: vData.issuedBy || '',
          },
          photoUrl: vData.photoUrl || '',
          elementsFront: [],
          elementsBack: [],
          elements: [],
          status: vData.status || 'active',
          issueDate: vData.issueDate || '',
          expiryDate: vData.expiryDate || '',
          issuedBy: vData.issuedBy || '',
          qrConfig: { enabled: true, embeddedVerificationUrl: true, showOnFront: true },
          createdAt: vData.updatedAt || new Date().toISOString(),
          updatedAt: vData.updatedAt || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Public verification lookup failed:', err);
    }

    return undefined;
  }

  public async ensureAuthenticatedSession(): Promise<FirebaseUser | null> {
    if (auth.currentUser) return auth.currentUser;
    if (this.isAuthInitialized) return null;
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        resolve(user);
      });
    });
  }

  public async saveCard(card: CardData): Promise<CardData> {
    const startTime = performance.now();
    console.group(`[IDMaker:saveCard Pipeline] Initiating card save`);

    if (!auth.currentUser) {
      console.error('[IDMaker:saveCard] ❌ Authentication check failed: No active Firebase auth user.');
      console.groupEnd();
      throw new Error('Authentication required: Please log in to your account to save cards.');
    }

    const fbUser = auth.currentUser!;
    const uid = fbUser.uid;
    const userEmail = fbUser.email || 'cardadmin@idmaker.io';
    const now = new Date().toISOString();
    const cardId = (card.id && /^[a-zA-Z0-9_\-]+$/.test(card.id)) ? card.id : this.generateNextCardId();

    const sanitizedPersonName = (card.personName || card.fieldValues?.['fullName'] || 'Cardholder').trim() || 'Cardholder';
    const sanitizedCardTypeId = (card.cardTypeId || 'student-id').trim() || 'standard';
    const validStatuses: CardStatus[] = ['active', 'draft', 'expired', 'archived'];
    const sanitizedStatus: CardStatus = validStatuses.includes(card.status) ? card.status : 'active';
    const sanitizedOrgName = (card.organizationName || card.fieldValues?.['institutionName'] || 'Organization').trim() || 'Organization';

    const normalizedCollections = normalizeCardElements(card);

    console.info(`[IDMaker:saveCard] 1. Authentication & Model Verified:`, {
      cardId,
      authenticatedFirebaseUID: uid,
      userEmail,
      personName: sanitizedPersonName,
      cardType: sanitizedCardTypeId,
      elementsFrontCount: normalizedCollections.elementsFront.length,
      elementsBackCount: normalizedCollections.elementsBack.length,
      elementsCount: normalizedCollections.elements.length,
    });

    const initialCardToSave: CardData = {
      ...card,
      id: cardId,
      ownerId: uid,
      personName: sanitizedPersonName.substring(0, 120),
      cardTypeId: sanitizedCardTypeId.substring(0, 64),
      status: sanitizedStatus,
      organizationName: sanitizedOrgName.substring(0, 150),
      elementsFront: normalizedCollections.elementsFront,
      elementsBack: normalizedCollections.elementsBack,
      elements: normalizedCollections.elements,
      createdAt: card.createdAt || now,
      updatedAt: now,
    };

    // 1. Offload / migrate assets to Storage or compact optimized payloads
    console.info('[IDMaker:saveCard] 2. Auditing and migrating binary assets to permanent storage...');
    let cardToSave: CardData;
    let assetUploadSuccess = true;
    try {
      cardToSave = await migrateCardAssetsToStorage(initialCardToSave, uid);
    } catch (assetErr: any) {
      console.warn('[IDMaker:saveCard] ⚠️ Asset migration warning:', assetErr);
      assetUploadSuccess = false;
      cardToSave = initialCardToSave;
    }

    // 2. Comprehensive Asset URLs report
    const assetUrls = {
      photoUrl: cardToSave.photoUrl
        ? cardToSave.photoUrl.startsWith('http')
          ? `[Remote/Storage URL] ${cardToSave.photoUrl.substring(0, 50)}...`
          : `[Optimized Data URL, length=${cardToSave.photoUrl.length}]`
        : '[Not Provided]',
      logoUrl: cardToSave.logoUrl
        ? cardToSave.logoUrl.startsWith('http')
          ? `[Remote/Storage URL] ${cardToSave.logoUrl.substring(0, 50)}...`
          : `[Optimized Data URL, length=${cardToSave.logoUrl.length}]`
        : '[Not Provided]',
      studentSignatureUrl: cardToSave.studentSignatureUrl
        ? cardToSave.studentSignatureUrl.startsWith('http')
          ? `[Remote/Storage URL] ${cardToSave.studentSignatureUrl.substring(0, 50)}...`
          : `[Data URL, length=${cardToSave.studentSignatureUrl.length}]`
        : '[Not Provided]',
      principalSignatureUrl: cardToSave.principalSignatureUrl
        ? cardToSave.principalSignatureUrl.startsWith('http')
          ? `[Remote/Storage URL] ${cardToSave.principalSignatureUrl.substring(0, 50)}...`
          : `[Data URL, length=${cardToSave.principalSignatureUrl.length}]`
        : '[Not Provided]',
      signatureUrl: cardToSave.signatureUrl
        ? cardToSave.signatureUrl.startsWith('http')
          ? `[Remote/Storage URL] ${cardToSave.signatureUrl.substring(0, 50)}...`
          : `[Optimized Data URL, length=${cardToSave.signatureUrl.length}]`
        : '[Not Provided]',
    };

    console.info('[IDMaker:saveCard] 3. Asset Upload Result & URLs:', {
      assetUploadSuccess,
      assetUrls,
    });

    // 3. Document size validation
    console.info('[IDMaker:saveCard] 4. Validating serialized card document payload size...');
    const sizeReport = validateCardDocumentSize(cardToSave);
    console.info(`[IDMaker:saveCard] Document Size Validation Result:`, {
      serializedCardDocumentSize: `${sizeReport.sizeKb} KB`,
      percentageOfLimit: `${sizeReport.percentageOfLimit}% of 1MB Firestore limit`,
      isValid: sizeReport.sizeKb < 900,
    });

    const cardPath = `cards/${cardId}`;
    const verifPath = `verifications/${cardId}`;

    try {
      // 4. Write card document to Firestore
      console.info(`[IDMaker:saveCard] 5. Writing card record to Firestore: ${cardPath}`);
      await setDoc(doc(db, 'cards', cardId), cardToSave);
      console.info(`[IDMaker:saveCard] ✅ Firestore Write Result: SUCCESS — cards/${cardId} written to Firestore.`);

      // 5. Publish sanitized public verification record
      const verifData = {
        cardId: cardId,
        ownerId: uid,
        personName: cardToSave.personName || 'Cardholder',
        organizationName: cardToSave.organizationName || cardToSave.fieldValues?.institutionName || 'Organization',
        cardTypeId: cardToSave.cardTypeId || 'standard',
        status: cardToSave.status || 'active',
        issueDate: cardToSave.issueDate || cardToSave.fieldValues?.issueDate || '',
        expiryDate: cardToSave.expiryDate || cardToSave.fieldValues?.expiryDate || '',
        issuedBy: cardToSave.issuedBy || cardToSave.fieldValues?.issuedBy || 'Authorized Office',
        photoUrl: cardToSave.photoUrl || '',
        department: cardToSave.fieldValues?.department || '',
        sha256Hash: `SHA256-${cardId}-${Date.now()}`,
        updatedAt: now,
      };

      console.info(`[IDMaker:saveCard] 6. Publishing public verification record: ${verifPath}`);
      await setDoc(doc(db, 'verifications', cardId), verifData);
      console.info(`[IDMaker:saveCard] ✅ Verification Write Result: SUCCESS — verifications/${cardId} published.`);

      // 6. Update local cache immediately so the card appears in My Cards & survives refresh
      const existingIdx = this.cachedCards.findIndex((c) => c.id === cardId);
      if (existingIdx >= 0) {
        this.cachedCards[existingIdx] = cardToSave;
      } else {
        this.cachedCards = [cardToSave, ...this.cachedCards];
      }
      this.notifyCards();

      const elapsedMs = Math.round(performance.now() - startTime);
      console.info(`[IDMaker:saveCard] 🎉 Complete Save Pipeline Result: SUCCESS (${elapsedMs}ms).`);
      console.groupEnd();

      return cardToSave;
    } catch (err: any) {
      const elapsedMs = Math.round(performance.now() - startTime);
      console.error(`[IDMaker:saveCard] ❌ Firestore write failed after ${elapsedMs}ms on path ${cardPath}:`, err);
      console.groupEnd();

      // Format a user-actionable message for the UI
      let friendlyMessage = 'Failed to save card.';
      if (err?.code === 'permission-denied') {
        friendlyMessage = 'Permission denied: Please ensure you are logged in and have access to edit this card.';
      } else if (err?.code === 'unavailable') {
        friendlyMessage = 'Network connection issue: Unable to reach Firestore. Please check your internet connection.';
      } else if (err?.message) {
        friendlyMessage = `Save failed: ${err.message}`;
      }

      handleFirestoreError(err, OperationType.WRITE, cardPath);
      throw new Error(friendlyMessage);
    }
  }

  public async deleteCard(id: string): Promise<boolean> {
    if (!auth.currentUser) throw new Error('Authentication required.');

    const path = `cards/${id}`;
    try {
      await deleteDoc(doc(db, 'cards', id));
      try {
        await deleteDoc(doc(db, 'verifications', id));
      } catch {
        // non-blocking
      }
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  public async deleteMultipleCards(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      try {
        await this.deleteCard(id);
        count++;
      } catch (err) {
        console.error(`Failed to delete card ${id}:`, err);
      }
    }
    return count;
  }

  public async updateMultipleCardsStatus(
    ids: string[],
    status: 'active' | 'draft' | 'expired' | 'archived'
  ): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const card = this.cachedCards.find((c) => c.id === id);
      if (card) {
        try {
          await this.saveCard({ ...card, status });
          count++;
        } catch (err) {
          console.error(`Failed to update status for ${id}:`, err);
        }
      }
    }
    return count;
  }

  public async duplicateCard(id: string): Promise<CardData | null> {
    const card = await this.getCardById(id);
    if (!card) return null;

    const newId = this.generateNextCardId();
    const duplicated: CardData = {
      ...card,
      id: newId,
      name: `${card.name} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.saveCard(duplicated);
  }

  public generateNextCardId(): string {
    const year = new Date().getFullYear();
    const prefix = `IDM-${year}-`;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  }

  // --- BRAND KITS CRUD ---
  public getBrandKits(): BrandKit[] {
    return this.cachedBrandKits;
  }

  public async saveBrandKit(kit: BrandKit): Promise<BrandKit> {
    if (!auth.currentUser) throw new Error('Authentication required.');
    const uid = auth.currentUser.uid;
    const kitId = kit.id || `bk_${Date.now()}`;
    const initialKitToSave: BrandKit = {
      ...kit,
      id: kitId,
      ownerId: uid,
    };

    // Offload Base64 assets to Storage
    const kitToSave = await migrateBrandKitAssetsToStorage(initialKitToSave, uid);

    const path = `brandKits/${kitId}`;
    try {
      await setDoc(doc(db, 'brandKits', kitId), kitToSave);
      return kitToSave;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public async deleteBrandKit(id: string): Promise<boolean> {
    if (!auth.currentUser) throw new Error('Authentication required.');
    const path = `brandKits/${id}`;
    try {
      await deleteDoc(doc(db, 'brandKits', id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- SETTINGS (UI Preferences) ---
  public getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }
}

export const storageService = new StorageService();
