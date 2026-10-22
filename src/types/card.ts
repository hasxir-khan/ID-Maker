export type CardOrientation = 'horizontal' | 'vertical';

export type CardDimensionUnit = 'mm' | 'cm' | 'inches' | 'pixels';

export interface CardDimensions {
  width: number;
  height: number;
  unit: CardDimensionUnit;
  preset: 'CR80' | 'ID-1' | 'Custom';
}

export type CardStatus = 'active' | 'draft' | 'expired' | 'archived';

export type CardCategory =
  | 'education'
  | 'professional'
  | 'business'
  | 'healthcare'
  | 'organizations'
  | 'events'
  | 'membership'
  | 'custom';

export interface CardFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'select' | 'image' | 'textarea' | 'number';
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: string[];
  category?: 'identity' | 'organization' | 'dates' | 'contact' | 'media' | 'custom';
  helpText?: string;
}

export interface CardTypeDefinition {
  id: string;
  name: string;
  category: CardCategory;
  description: string;
  iconName: string;
  badgeColor?: string;
  fields: CardFieldDefinition[];
  defaultOrientation: CardOrientation;
  defaultTemplateId: string;
  suggestedDimensions: CardDimensions;
}

export type ElementType =
  | 'text'
  | 'photo'
  | 'logo'
  | 'qr'
  | 'signature'
  | 'shape'
  | 'line'
  | 'barcode'
  | 'badge';

export interface CardElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: '300' | '400' | '500' | '600' | '700' | '800';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  letterSpacing?: number;
  lineHeight?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  opacity?: number;
  shadow?: string;
  rotation?: number;
  shapeType?: 'rectangle' | 'circle' | 'pill';
  backgroundImage?: string;
}

export interface CardElement {
  id: string;
  type: ElementType;
  x: number; // in pixels relative to card canvas (default base 600x378 or 378x600)
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  content: string; // text content, or image URL, or field binding key like `{{fullName}}`
  fieldBinding?: string; // e.g. "fullName", "studentId", "department", etc.
  style: CardElementStyle;
  side: 'front' | 'back';
}

export type TemplateCategory =
  | 'all'
  | 'university'
  | 'corporate'
  | 'minimal'
  | 'vertical'
  | 'healthcare'
  | 'membership'
  | 'events'
  | 'security'
  | 'professional'
  | 'government'
  | 'classic'
  | 'modern'
  | 'elegant';

export interface CardSideData {
  elements: CardElement[];
  background?: string;
}

export interface CardTemplate {
  id: string;
  templateId?: string; // Canonical alias for template identification
  name: string;
  category: TemplateCategory;
  description: string;
  previewGradient: string;
  accentColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  defaultOrientation: CardOrientation;
  orientation?: CardOrientation; // Compatibility alias
  dimensions?: CardDimensions;
  width?: number;
  height?: number;
  unit?: CardDimensionUnit;
  elementsFront: CardElement[];
  elementsBack: CardElement[];
}

export interface CardData {
  id: string; // e.g. IDM-2026-000124
  cardTypeId: string;
  templateId: string;
  name: string; // Title given to the card project
  personName: string;
  organizationName: string;
  orientation: CardOrientation;
  dimensions: CardDimensions;
  fieldValues: Record<string, string>;
  cardSubtypeLevel?: string;
  customFields?: { id: string; label: string; value: string }[];
  
  // Direct assets
  photoUrl?: string;
  logoUrl?: string;
  signatureUrl?: string; // Legacy fallback
  studentSignatureUrl?: string; // Cardholder / Student signature
  principalSignatureUrl?: string; // Principal / Registrar / Authority signature
  
  // Dual-Side structures
  front?: CardSideData;
  back?: CardSideData;

  // Custom elements in canvas (explicit front and back separation)
  elementsFront: CardElement[];
  elementsBack: CardElement[];
  elements: CardElement[]; // Combined elements collection for unified rendering/queries
  
  // Card lifecycle
  status: CardStatus;
  issueDate: string;
  expiryDate: string;
  issuedBy?: string;
  
  // QR & verification
  qrConfig: {
    enabled: boolean;
    embeddedVerificationUrl: boolean;
    customData?: string;
    showOnFront: boolean;
  };
  
  // Metadata
  brandKitId?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  userId?: string;
  ownerId?: string;

  // Normalization & legacy Firestore record fallbacks
  category?: string;
  cardType?: string;
  organization?: string;
}

export interface BrandKit {
  id: string;
  name: string;
  organizationName: string;
  ownerId?: string;
  tagline?: string;
  logoUrl?: string;
  signatureUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  defaultOrientation: CardOrientation;
  defaultTemplateId: string;
  isDefault?: boolean;
}

export interface ValidationIssue {
  id: string;
  fieldId?: string;
  elementId?: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
}

export interface ValidationResult {
  isValid: boolean;
  hasWarnings: boolean;
  issues: ValidationIssue[];
}

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  displayName?: string;
  email: string;
  avatarUrl?: string;
  organization?: string;
  role?: string;
  plan?: 'starter' | 'professional' | 'enterprise';
  createdAt: string;
  updatedAt?: string;
}

/**
 * Normalizes and synchronizes front, back, elementsFront, elementsBack, and combined elements for any CardData object.
 */
export function normalizeCardElements(card: Partial<CardData>): {
  front: CardSideData;
  back: CardSideData;
  elementsFront: CardElement[];
  elementsBack: CardElement[];
  elements: CardElement[];
} {
  let frontEls: CardElement[] = [];
  if (Array.isArray(card.elementsFront) && card.elementsFront.length > 0) {
    frontEls = card.elementsFront.map((e) => ({ ...e, side: 'front' as const }));
  } else if (Array.isArray(card.front?.elements) && card.front.elements.length > 0) {
    frontEls = card.front.elements.map((e) => ({ ...e, side: 'front' as const }));
  } else if (Array.isArray(card.elements) && card.elements.length > 0) {
    frontEls = card.elements
      .filter((e) => (e.side || 'front') === 'front')
      .map((e) => ({ ...e, side: 'front' as const }));
  }

  let backEls: CardElement[] = [];
  if (Array.isArray(card.elementsBack) && card.elementsBack.length > 0) {
    backEls = card.elementsBack.map((e) => ({ ...e, side: 'back' as const }));
  } else if (Array.isArray(card.back?.elements) && card.back.elements.length > 0) {
    backEls = card.back.elements.map((e) => ({ ...e, side: 'back' as const }));
  } else if (Array.isArray(card.elements) && card.elements.length > 0) {
    backEls = card.elements
      .filter((e) => e.side === 'back')
      .map((e) => ({ ...e, side: 'back' as const }));
  }

  const combined: CardElement[] = [...frontEls, ...backEls];
  return {
    front: { elements: frontEls, background: card.front?.background },
    back: { elements: backEls, background: card.back?.background },
    elementsFront: frontEls,
    elementsBack: backEls,
    elements: combined,
  };
}

/**
 * Robustly normalizes any card data object for dashboard and list views,
 * preventing 'Cannot read properties of undefined (reading toLowerCase)'
 * and guaranteeing consistent defaults for legacy or partially saved documents.
 */
export function normalizeCardForDashboard(card: Partial<CardData> | null | undefined): CardData {
  const safeId =
    typeof card?.id === 'string' && card.id.trim()
      ? card.id.trim()
      : `IDM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const safePersonName =
    typeof card?.personName === 'string' && card.personName.trim()
      ? card.personName.trim()
      : typeof card?.fieldValues?.fullName === 'string' && card.fieldValues.fullName.trim()
      ? card.fieldValues.fullName.trim()
      : 'Cardholder';

  const safeName =
    typeof card?.name === 'string' && card.name.trim()
      ? card.name.trim()
      : `${safePersonName} Card`;

  const safeCardTypeId =
    typeof card?.cardTypeId === 'string' && card.cardTypeId.trim()
      ? card.cardTypeId.trim()
      : typeof (card as any)?.cardType === 'string' && (card as any).cardType.trim()
      ? (card as any).cardType.trim()
      : 'student-id';

  const safeCardType =
    typeof (card as any)?.cardType === 'string' && (card as any).cardType.trim()
      ? (card as any).cardType.trim()
      : typeof card?.cardTypeId === 'string' && card.cardTypeId.trim()
      ? card.cardTypeId.trim()
      : 'Custom';

  const safeCategory =
    typeof (card as any)?.category === 'string' && (card as any).category.trim()
      ? (card as any).category.trim()
      : 'Uncategorized';

  const validStatuses: CardStatus[] = ['active', 'draft', 'expired', 'archived'];
  const rawStatus = typeof card?.status === 'string' ? card.status.toLowerCase().trim() : '';
  const safeStatus: CardStatus = validStatuses.includes(rawStatus as CardStatus)
    ? (rawStatus as CardStatus)
    : 'draft';

  const safeOrg =
    typeof card?.organizationName === 'string' && card.organizationName.trim()
      ? card.organizationName.trim()
      : typeof (card as any)?.organization === 'string' && (card as any).organization.trim()
      ? (card as any).organization.trim()
      : typeof card?.fieldValues?.institutionName === 'string' && card.fieldValues.institutionName.trim()
      ? card.fieldValues.institutionName.trim()
      : '';

  const safeFieldValues =
    card?.fieldValues && typeof card.fieldValues === 'object'
      ? { ...card.fieldValues }
      : {};

  const safeOrientation: CardOrientation = card?.orientation === 'vertical' ? 'vertical' : 'horizontal';

  const safeDimensions =
    card?.dimensions && typeof card.dimensions === 'object'
      ? card.dimensions
      : { width: 85.6, height: 53.98, unit: 'mm' as const, preset: 'CR80' as const };

  const { elementsFront, elementsBack, elements } = normalizeCardElements(card || {});

  return {
    id: safeId,
    ownerId: typeof card?.ownerId === 'string' ? card.ownerId : '',
    cardTypeId: safeCardTypeId,
    cardType: safeCardType,
    category: safeCategory,
    organization: safeOrg,
    templateId: typeof card?.templateId === 'string' ? card.templateId : 'modern-academic',
    name: safeName,
    personName: safePersonName,
    organizationName: safeOrg,
    orientation: safeOrientation,
    dimensions: safeDimensions,
    fieldValues: safeFieldValues,
    cardSubtypeLevel: typeof card?.cardSubtypeLevel === 'string' ? card.cardSubtypeLevel : (safeFieldValues['cardSubtypeLevel'] || undefined),
    customFields: Array.isArray(card?.customFields) ? card.customFields : [],
    photoUrl: typeof card?.photoUrl === 'string' ? card.photoUrl : '',
    logoUrl: typeof card?.logoUrl === 'string' ? card.logoUrl : '',
    signatureUrl: typeof card?.signatureUrl === 'string' ? card.signatureUrl : '',
    studentSignatureUrl: typeof card?.studentSignatureUrl === 'string' ? card.studentSignatureUrl : (safeFieldValues['studentSignature'] || safeFieldValues['cardholderSignature'] || ''),
    principalSignatureUrl: typeof card?.principalSignatureUrl === 'string' ? card.principalSignatureUrl : (safeFieldValues['principalSignature'] || safeFieldValues['authorizedSignature'] || ''),
    elementsFront,
    elementsBack,
    elements,
    status: safeStatus,
    issueDate: typeof card?.issueDate === 'string' ? card.issueDate : (safeFieldValues['issueDate'] || ''),
    expiryDate: typeof card?.expiryDate === 'string' ? card.expiryDate : (safeFieldValues['expiryDate'] || ''),
    issuedBy: typeof card?.issuedBy === 'string' ? card.issuedBy : (safeFieldValues['issuedBy'] || ''),
    qrConfig: card?.qrConfig || { enabled: true, embeddedVerificationUrl: true, showOnFront: true },
    createdAt: typeof card?.createdAt === 'string' ? card.createdAt : new Date().toISOString(),
    updatedAt: typeof card?.updatedAt === 'string' ? card.updatedAt : new Date().toISOString(),
    tags: Array.isArray(card?.tags) ? card.tags : [],
  };
}

