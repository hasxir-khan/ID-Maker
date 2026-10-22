import { CardData, CardElement } from '../types/card';
import { CARD_TYPES } from '../data/cardTypes';

/**
 * Resolves a field key or alias to the actual card data value.
 * Supports all ID Maker card types, templates, and field naming variations.
 * NEVER returns fabricated data or 'undefined' / 'null' / '[object Object]'.
 */
export function resolveCardFieldValue(fieldKey: string, card: CardData): string | undefined {
  if (!fieldKey || typeof fieldKey !== 'string') return undefined;
  if (!card) return undefined;

  const key = fieldKey.trim();
  const lowerKey = key.toLowerCase();

  // 1. Direct match in card.fieldValues
  if (card.fieldValues && typeof card.fieldValues === 'object') {
    if (card.fieldValues[key] !== undefined && card.fieldValues[key] !== null && card.fieldValues[key] !== '') {
      const val = card.fieldValues[key];
      if (typeof val === 'string') return val;
      if (typeof val === 'number') return String(val);
    }
    // Case-insensitive lookup in card.fieldValues
    for (const [k, v] of Object.entries(card.fieldValues)) {
      if (k.toLowerCase() === lowerKey && v !== undefined && v !== null && v !== '') {
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
      }
    }
  }

  // 2. Canonical field resolution
  switch (lowerKey) {
    case 'fullname':
    case 'cardholdername':
    case 'name':
    case 'personname':
    case 'studentname':
    case 'employeename':
    case 'membername':
    case 'holdername':
      return card.personName || card.fieldValues?.['fullName'] || '';

    case 'studentid':
    case 'employeeid':
    case 'memberid':
    case 'badgeid':
    case 'visitorid':
    case 'attendeeid':
    case 'idnumber':
    case 'cardid':
    case 'id':
    case 'rollno':
    case 'admissionno':
    case 'matricleno':
      return (
        card.fieldValues?.['studentId'] ||
        card.fieldValues?.['employeeId'] ||
        card.fieldValues?.['memberId'] ||
        card.fieldValues?.['rollNo'] ||
        card.fieldValues?.['admissionNo'] ||
        card.id ||
        ''
      );

    case 'regno':
    case 'registrationno':
    case 'registrationnumber':
    case 'regnumber':
      return (
        card.fieldValues?.['registrationNo'] ||
        card.fieldValues?.['registrationNumber'] ||
        card.fieldValues?.['regNo'] ||
        ''
      );

    case 'institutionname':
    case 'organizationname':
    case 'organization':
    case 'institution':
    case 'company':
    case 'school':
    case 'college':
    case 'university':
    case 'org':
      return (
        card.organizationName ||
        card.fieldValues?.['institutionName'] ||
        card.fieldValues?.['organizationName'] ||
        ''
      );

    case 'cardtype':
    case 'cardtitle':
    case 'credentialtype': {
      const typeDef = CARD_TYPES.find((t) => t.id === card.cardTypeId);
      return (
        card.fieldValues?.['cardType'] ||
        card.fieldValues?.['cardTitle'] ||
        (typeDef ? `${typeDef.name.toUpperCase()} CREDENTIAL` : 'IDENTIFICATION CREDENTIAL')
      );
    }

    case 'department':
    case 'faculty':
    case 'division':
    case 'branch':
    case 'major':
    case 'subject':
    case 'dept':
      return (
        card.fieldValues?.['department'] ||
        card.fieldValues?.['faculty'] ||
        card.fieldValues?.['division'] ||
        card.fieldValues?.['branch'] ||
        ''
      );

    case 'gradeclass':
    case 'class':
    case 'grade':
    case 'program':
    case 'course':
    case 'degree':
    case 'semester':
    case 'year':
      return (
        card.fieldValues?.['gradeClass'] ||
        card.fieldValues?.['class'] ||
        card.fieldValues?.['program'] ||
        card.fieldValues?.['course'] ||
        card.fieldValues?.['grade'] ||
        card.fieldValues?.['degree'] ||
        card.fieldValues?.['semester'] ||
        ''
      );

    case 'section':
    case 'sec':
    case 'group':
    case 'batch':
      return card.fieldValues?.['section'] || card.fieldValues?.['sec'] || '';

    case 'campus':
    case 'campusname':
    case 'location':
      return card.fieldValues?.['campus'] || card.fieldValues?.['campusName'] || '';

    case 'bloodgroup':
    case 'blood':
    case 'bg':
      return card.fieldValues?.['bloodGroup'] || card.fieldValues?.['blood'] || '';

    case 'phone':
    case 'emergencycontact':
    case 'contact':
    case 'mobile':
    case 'parentphone':
    case 'emergency':
      return (
        card.fieldValues?.['phone'] ||
        card.fieldValues?.['emergencyContact'] ||
        card.fieldValues?.['parentPhone'] ||
        card.fieldValues?.['contact'] ||
        ''
      );

    case 'email':
    case 'studentemail':
    case 'workemail':
    case 'officialemail':
      return (
        card.fieldValues?.['email'] ||
        card.fieldValues?.['studentEmail'] ||
        card.fieldValues?.['workEmail'] ||
        ''
      );

    case 'address':
    case 'residentialaddress':
    case 'campusaddress':
      return (
        card.fieldValues?.['address'] ||
        card.fieldValues?.['residentialAddress'] ||
        card.fieldValues?.['campusAddress'] ||
        ''
      );

    case 'dob':
    case 'dateofbirth':
    case 'birthdate':
      return card.fieldValues?.['dob'] || card.fieldValues?.['dateOfBirth'] || '';

    case 'issuedate':
    case 'issuedat':
    case 'validfrom':
    case 'issue':
      return card.issueDate || card.fieldValues?.['issueDate'] || '';

    case 'expirydate':
    case 'expiresat':
    case 'validthru':
    case 'validuntil':
    case 'expiry':
      return card.expiryDate || card.fieldValues?.['expiryDate'] || '';

    case 'validity': {
      const from = card.issueDate || card.fieldValues?.['issueDate'];
      const to = card.expiryDate || card.fieldValues?.['expiryDate'];
      if (from && to) return `${from} – ${to}`;
      if (to) return `Valid Thru: ${to}`;
      return '';
    }

    case 'issuedby':
    case 'authority':
    case 'authorizedsignatory':
    case 'authorizedby':
    case 'issuer':
    case 'principal':
    case 'registrar':
      return (
        card.issuedBy ||
        card.fieldValues?.['issuedBy'] ||
        ''
      );

    case 'jobtitle':
    case 'role':
    case 'designation':
    case 'title':
    case 'position':
    case 'rank':
      return (
        card.fieldValues?.['jobTitle'] ||
        card.fieldValues?.['role'] ||
        card.fieldValues?.['designation'] ||
        card.fieldValues?.['title'] ||
        ''
      );

    case 'fathername':
    case 'guardianname':
    case 'parentname':
      return card.fieldValues?.['fatherName'] || card.fieldValues?.['guardianName'] || '';

    case 'nationalid':
    case 'cnic':
    case 'ssn':
    case 'govtid':
    case 'citizenid':
      return (
        card.fieldValues?.['nationalId'] ||
        card.fieldValues?.['cnic'] ||
        card.fieldValues?.['ssn'] ||
        card.fieldValues?.['govtId'] ||
        ''
      );

    case 'medicalnotes':
    case 'allergies':
    case 'medical':
      return (
        card.fieldValues?.['medicalNotes'] ||
        card.fieldValues?.['allergies'] ||
        ''
      );

    case 'emergencyname':
    case 'emergencycontactname':
      return (
        card.fieldValues?.['emergencyName'] ||
        card.fieldValues?.['emergencyContactName'] ||
        ''
      );

    case 'emergencyrelationship':
    case 'relationship':
      return (
        card.fieldValues?.['emergencyRelationship'] ||
        card.fieldValues?.['relationship'] ||
        ''
      );

    case 'returnaddress':
    case 'returniffound':
      return (
        card.fieldValues?.['returnAddress'] ||
        card.fieldValues?.['address'] ||
        ''
      );

    case 'reportingauthority':
    case 'authorityoffice':
      return (
        card.fieldValues?.['reportingAuthority'] ||
        card.issuedBy ||
        card.fieldValues?.['issuedBy'] ||
        ''
      );

    case 'website':
    case 'portfolio':
      return (
        card.fieldValues?.['website'] ||
        card.fieldValues?.['portfolio'] ||
        ''
      );

    case 'studentsignature':
    case 'cardholdersignature':
    case 'employeesignature':
    case 'fellowsignature':
      return (
        card.studentSignatureUrl ||
        card.fieldValues?.['studentSignature'] ||
        card.fieldValues?.['cardholderSignature'] ||
        ''
      );

    case 'principalsignature':
    case 'authorizedsignature':
    case 'issuersignature':
    case 'regsignature':
    case 'deansignature':
    case 'managersignature':
    case 'officersignature':
    case 'presidentsignature':
      return (
        card.principalSignatureUrl ||
        card.fieldValues?.['principalSignature'] ||
        card.fieldValues?.['authorizedSignature'] ||
        ''
      );

    default: {
      // Custom fields lookup
      if (card.customFields && Array.isArray(card.customFields)) {
        const custom = card.customFields.find(
          (cf) =>
            (cf?.id ?? '').toString().toLowerCase() === lowerKey ||
            (cf?.label ?? '').toString().toLowerCase() === lowerKey
        );
        if (custom) return custom.value;
      }
      return card.fieldValues?.[fieldKey] || '';
    }
  }
}

/**
 * Intelligently cleans compound template lines so missing optional values do not
 * produce empty labels like "DOB: " or dangling " • ".
 */
function cleanSegmentTemplate(segment: string, card: CardData): string {
  // Check if segment has mustache tags
  const tags = [...segment.matchAll(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g)];
  if (tags.length === 0) return segment;

  // Check if all tags in this segment resolve to non-empty values
  let hasAnyNonEmpty = false;
  let resolvedSegment = segment;

  for (const match of tags) {
    const tagName = match[1];
    const val = resolveCardFieldValue(tagName, card) || '';
    if (val.trim() !== '') {
      hasAnyNonEmpty = true;
    }
    resolvedSegment = resolvedSegment.replace(match[0], val);
  }

  // If none of the variables in this segment had a value, discard the whole segment!
  if (!hasAnyNonEmpty) {
    return '';
  }

  return resolvedSegment.trim();
}

/**
 * Resolves an element's text content dynamically based on field bindings,
 * mustache template tags (`{{department}}`), and cleans empty labels.
 * Guarantees no '[object Object]', 'undefined', or 'null' is displayed in UI.
 */
export function resolveElementText(element: CardElement, card: CardData): string {
  if (!element || !card) return '';

  // 1. Direct fieldBinding has highest priority
  if (element.fieldBinding) {
    const bound = resolveCardFieldValue(element.fieldBinding, card);
    if (bound !== undefined && bound !== null && bound !== '') {
      return String(bound);
    }
    // If fieldBinding is empty, return empty string so no placeholder/stale text leaks
    return '';
  }

  let text = element.content !== undefined && element.content !== null ? String(element.content) : '';

  // 2. Mustache variable replacement {{key}}
  if (text.includes('{{') && text.includes('}}')) {
    // Check if line contains bullets or pipes dividing segments
    if (text.includes('•') || text.includes('|')) {
      const sep = text.includes('•') ? '•' : '|';
      const segments = text.split(sep);
      const cleanedSegments = segments
        .map((s) => cleanSegmentTemplate(s, card))
        .filter((s) => s.length > 0);

      if (cleanedSegments.length === 0) {
        return '';
      }
      return cleanedSegments.join(` ${sep} `);
    }

    // Single line or paragraph with tags
    const lines = text.split('\n');
    const cleanedLines = lines
      .map((line) => {
        if (!line.includes('{{')) return line;
        return cleanSegmentTemplate(line, card);
      })
      .filter((l) => l.trim().length > 0);

    text = cleanedLines.join('\n');
  }

  // 3. Fallback heuristics for default placeholder text if element is not bound
  if (!element.fieldBinding && !element.content.includes('{{')) {
    const trimmed = text.trim();
    if (
      (trimmed === 'Ali Khan' || trimmed === 'Full Name' || trimmed === 'John Doe' || trimmed === 'Emma Watson') &&
      card.personName
    ) {
      return card.personName;
    }
    if (
      (trimmed === 'STANFORD UNIVERSITY' ||
        trimmed === 'Organization Name' ||
        trimmed === 'Acme Corp' ||
        trimmed === 'Greenfield High School') &&
      card.organizationName
    ) {
      return card.organizationName;
    }
  }

  // Safety cleanup: replace any stray undefined/null tokens
  return text
    .replace(/\bundefined\b/g, '')
    .replace(/\bnull\b/g, '')
    .replace(/\[object Object\]/g, '')
    .trim();
}
