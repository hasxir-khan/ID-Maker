import { CardData, ValidationResult, ValidationIssue } from '../types/card';
import { getTemplateRequirements, CardFieldRequirement } from './requirementsEngine';
import { resolveCardFieldValue } from './fieldResolver';

/**
 * Validates any card against its template's schema requirements.
 * Enforces strict non-empty checks for required fields (no whitespace-only strings),
 * validates email, phone, and dates, and flags boundary warnings.
 */
export function validateCard(card: CardData): ValidationResult {
  const issues: ValidationIssue[] = [];
  const reportedFieldIds = new Set<string>();

  const schema = getTemplateRequirements(card.templateId);

  // 1. Core Cardholder Name Check
  const effectivePersonName = (card.personName || resolveCardFieldValue('fullName', card) || '').trim();
  if (!effectivePersonName) {
    issues.push({
      id: 'missing-person-name',
      fieldId: 'fullName',
      type: 'error',
      title: 'Missing Cardholder Name',
      message: 'Cardholder name is required on all credentials.',
      actionLabel: 'Enter Full Name',
    });
    reportedFieldIds.add('fullName');
  }

  // 2. Validate against template schema fields
  schema.fields.forEach((field: CardFieldRequirement) => {
    const rawVal = resolveCardFieldValue(field.key, card) || card.fieldValues?.[field.key] || '';
    const trimmedVal = typeof rawVal === 'string' ? rawVal.trim() : String(rawVal || '').trim();

    // Required field check
    if (field.required) {
      if (trimmedVal === '' && !reportedFieldIds.has(field.key)) {
        issues.push({
          id: `missing-field-${field.key}`,
          fieldId: field.key,
          type: 'error',
          title: `Required Field Missing: ${field.label}`,
          message: `The field "${field.label}" must be provided for ${schema.templateName}.`,
          actionLabel: `Fill ${field.label}`,
        });
        reportedFieldIds.add(field.key);
      }
    }

    // MinLength & MaxLength checks if provided
    if (trimmedVal !== '') {
      if (field.validation?.minLength && trimmedVal.length < field.validation.minLength) {
        issues.push({
          id: `minlength-${field.key}`,
          fieldId: field.key,
          type: 'error',
          title: `Field Too Short: ${field.label}`,
          message: `"${field.label}" must be at least ${field.validation.minLength} characters.`,
          actionLabel: `Update ${field.label}`,
        });
      }

      if (field.validation?.maxLength && trimmedVal.length > field.validation.maxLength) {
        issues.push({
          id: `maxlength-${field.key}`,
          fieldId: field.key,
          type: 'warning',
          title: `Field Very Long: ${field.label}`,
          message: `"${field.label}" exceeds recommended length of ${field.validation.maxLength} characters.`,
          actionLabel: `Shorten ${field.label}`,
        });
      }

      // Email format
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedVal)) {
          issues.push({
            id: `invalid-email-${field.key}`,
            fieldId: field.key,
            type: 'warning',
            title: `Unusual Email Format: ${field.label}`,
            message: `"${trimmedVal}" does not appear to follow standard email formatting.`,
            actionLabel: `Review ${field.label}`,
          });
        }
      }

      // Phone format check (must contain at least 6 digits/characters, not just letters)
      if (field.type === 'phone') {
        const digitsOnly = trimmedVal.replace(/\D/g, '');
        if (digitsOnly.length < 5 && trimmedVal.length > 0) {
          issues.push({
            id: `invalid-phone-${field.key}`,
            fieldId: field.key,
            type: 'warning',
            title: `Short Phone Number: ${field.label}`,
            message: `Please verify that "${trimmedVal}" includes area or country code.`,
            actionLabel: `Review ${field.label}`,
          });
        }
      }

      // Numeric format
      if (field.type === 'number') {
        if (isNaN(Number(trimmedVal))) {
          issues.push({
            id: `invalid-number-${field.key}`,
            fieldId: field.key,
            type: 'error',
            title: `Invalid Numeric Value: ${field.label}`,
            message: `"${trimmedVal}" must be a valid number.`,
            actionLabel: `Enter Number`,
          });
        }
      }
    }
  });

  // 3. Date validity & Expiry >= Issue
  const issueDateStr = card.issueDate || resolveCardFieldValue('issueDate', card);
  const expiryDateStr = card.expiryDate || resolveCardFieldValue('expiryDate', card);

  if (issueDateStr && expiryDateStr) {
    const issueTime = new Date(issueDateStr).getTime();
    const expiryTime = new Date(expiryDateStr).getTime();

    if (!isNaN(issueTime) && !isNaN(expiryTime)) {
      if (expiryTime < issueTime) {
        issues.push({
          id: 'expiry-before-issue',
          fieldId: 'expiryDate',
          type: 'error',
          title: 'Invalid Date Range',
          message: 'The expiry date cannot be earlier than the card issue date.',
          actionLabel: 'Adjust Expiry Date',
        });
      }
    }
  }

  // 4. Photo presence check
  const allElements = [
    ...(card.elementsFront || []),
    ...(card.elementsBack || []),
    ...(card.elements || []),
  ];
  const hasPhotoElement = allElements.some((el) => el.type === 'photo');
  if (hasPhotoElement && !card.photoUrl) {
    issues.push({
      id: 'missing-photo-asset',
      type: 'warning',
      title: 'Profile Photo Not Uploaded',
      message: 'A photo frame exists on the design, but no photograph has been uploaded yet.',
      actionLabel: 'Upload Photo',
    });
  }

  // 5. Canvas boundary overflow checks
  const isLandscape = card.orientation === 'horizontal';
  const canvasWidth = isLandscape ? 600 : 378;
  const canvasHeight = isLandscape ? 378 : 600;
  const safetyMargin = 6; // px

  allElements.forEach((el) => {
    if (el.visible !== false) {
      if (
        el.x < -safetyMargin ||
        el.y < -safetyMargin ||
        el.x + el.width > canvasWidth + safetyMargin ||
        el.y + el.height > canvasHeight + safetyMargin
      ) {
        issues.push({
          id: `boundary-overflow-${el.id}`,
          elementId: el.id,
          type: 'warning',
          title: `Element Outside Boundary (${el.type})`,
          message: `Element "${el.content || el.type}" extends outside printable margins.`,
          actionLabel: 'Center Element',
        });
      }
    }
  });

  const hasErrors = issues.some((i) => i.type === 'error');
  const hasWarnings = issues.some((i) => i.type === 'warning');

  return {
    isValid: !hasErrors,
    hasWarnings,
    issues,
  };
}
