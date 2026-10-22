export type FieldType =
  | 'text'
  | 'multiline'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'select'
  | 'photo'
  | 'logo'
  | 'signature'
  | 'qr';

export type FieldSection =
  | 'identity'
  | 'organization'
  | 'role_credentials'
  | 'dates_validity'
  | 'contact_emergency'
  | 'assets'
  | 'security_terms'
  | 'custom';

export type CardSidePlacement = 'front' | 'back' | 'both';

export type FieldSensitivity = 'public' | 'internal' | 'confidential' | 'restricted';

export interface FieldValidationRules {
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  customErrorMessage?: string;
}

export interface CardFieldRequirement {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidationRules;
  options?: string[];
  defaultValue?: string;
  section: FieldSection;
  side: CardSidePlacement;
  visibleWhen?: (values: Record<string, string>, level?: string) => boolean;
  requiredWhen?: (values: Record<string, string>, level?: string) => boolean;
  sensitivity?: FieldSensitivity;
  sortOrder: number;
}

export interface CardSubtypeLevel {
  id: string;
  label: string;
  description?: string;
  badgeText?: string;
  defaultRole?: string;
}

export interface TemplateRequirementsSchema {
  templateId: string;
  templateName: string;
  cardCategoryId: string;
  orientation: 'horizontal' | 'vertical';
  levels?: CardSubtypeLevel[];
  defaultLevelId?: string;
  fields: CardFieldRequirement[];
  frontElementBindings: string[];
  backElementBindings: string[];
  recommendedAssets: {
    photo: 'required' | 'optional' | 'none';
    logo: 'required' | 'optional' | 'none';
    signature: 'required' | 'optional' | 'none';
    qr: 'front' | 'back' | 'both' | 'optional' | 'none';
  };
  backTermsTemplate?: string;
  backReturnDirective?: string;
}
