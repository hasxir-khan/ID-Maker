import { CARD_TEMPLATES } from '../data/templates';
import { CARD_TYPES } from '../data/cardTypes';
import { TEMPLATE_REQUIREMENTS, getTemplateRequirements } from '../services/requirementsEngine';
import {
  getPublicAppBaseUrl,
  buildCardVerificationUrl,
  buildCleanPathVerificationUrl,
  parseVerificationUrl,
} from '../services/verificationUrl';
import { validateCard } from '../services/validator';
import { normalizeCardElements, normalizeCardForDashboard, CardData } from '../types/card';
import { activeFirebaseConfig } from '../services/firebase';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTest(suite: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ suite, name, passed: true });
    console.log(`  [PASS] ${name}`);
  } catch (err: any) {
    results.push({ suite, name, passed: false, error: err?.message || String(err) });
    console.error(`  [FAIL] ${name}: ${err?.message || err}`);
  }
}

console.log('\n--- STARTING ID MAKER PRODUCTION AUDIT TESTS ---\n');

// SUITE 1: Verification URL Engine
console.log('Suite 1: Verification URL Engine');
runTest('Verification URL Engine', 'Parses path-based verification URL', () => {
  const id = parseVerificationUrl('/verify/CARD-9901');
  assert(id === 'CARD-9901', `Expected CARD-9901, got ${id}`);
});

runTest('Verification URL Engine', 'Parses hash-based verification URL', () => {
  const id = parseVerificationUrl('/#verify/CARD-9901');
  assert(id === 'CARD-9901', `Expected CARD-9901, got ${id}`);
});

runTest('Verification URL Engine', 'Parses full HTTPS URL with hash', () => {
  const id = parseVerificationUrl('https://idmaker.vercel.app/#verify/CARD-9901');
  assert(id === 'CARD-9901', `Expected CARD-9901, got ${id}`);
});

runTest('Verification URL Engine', 'Parses full HTTPS clean path URL', () => {
  const id = parseVerificationUrl('https://idmaker.vercel.app/verify/CARD-9901');
  assert(id === 'CARD-9901', `Expected CARD-9901, got ${id}`);
});

runTest('Verification URL Engine', 'Rejects non-verification URLs', () => {
  const id = parseVerificationUrl('/dashboard');
  assert(id === null, `Expected null, got ${id}`);
});

runTest('Verification URL Engine', 'Builds canonical hash verification URL', () => {
  const url = buildCardVerificationUrl('IDM-ABC-123');
  assert(url.includes('#verify/IDM-ABC-123'), `URL ${url} missing #verify/IDM-ABC-123`);
  assert(url.startsWith('http'), `URL ${url} does not start with http`);
});

runTest('Verification URL Engine', 'Builds clean path verification URL', () => {
  const url = buildCleanPathVerificationUrl('IDM-ABC-123');
  assert(url.includes('/verify/IDM-ABC-123'), `URL ${url} missing /verify/IDM-ABC-123`);
});

// SUITE 2: All 22 Card Templates Integrity
console.log('\nSuite 2: All 22 Card Templates Integrity');
runTest('Templates', 'Exactly 22 templates registered', () => {
  assert(CARD_TEMPLATES.length === 22, `Expected 22 templates, got ${CARD_TEMPLATES.length}`);
});

runTest('Templates', 'All templates have valid geometry and front/back partitions', () => {
  CARD_TEMPLATES.forEach((tmpl) => {
    assert(Boolean(tmpl.id), `Template missing id: ${tmpl.id}`);
    assert(Boolean(tmpl.name), `Template missing name: ${tmpl.id}`);
    assert(['horizontal', 'vertical'].includes(tmpl.defaultOrientation), `Invalid orientation: ${tmpl.defaultOrientation}`);
    assert(Boolean(tmpl.dimensions && tmpl.dimensions.width > 0 && tmpl.dimensions.height > 0), `Invalid dimensions: ${tmpl.id}`);

    // Verify signature independence
    const frontSigs = tmpl.elementsFront.filter((e) => e.type === 'signature');
    const backSigs = (tmpl.elementsBack || []).filter((e) => e.type === 'signature');

    frontSigs.forEach((sig) => {
      assert(sig.fieldBinding !== 'principalSignature', `Front signature has principal binding in ${tmpl.id}`);
    });

    backSigs.forEach((sig) => {
      assert(sig.fieldBinding !== 'studentSignature', `Back signature has student binding in ${tmpl.id}`);
    });

    const schema = getTemplateRequirements(tmpl.id);
    assert(Boolean(schema), `Requirements schema missing for ${tmpl.id}`);
    assert(schema.templateId === tmpl.id, `Schema templateId mismatch: ${schema.templateId} vs ${tmpl.id}`);
    assert(schema.fields.length > 0, `Schema fields empty for ${tmpl.id}`);
  });
});

// SUITE 3: Card Normalization & Signature Independence
console.log('\nSuite 3: Card Normalization & Signature Independence');
runTest('Signature Separation', 'Normalizes card with distinct student and principal signatures', () => {
  const rawCard: Partial<CardData> = {
    id: 'IDM-TEST-001',
    studentSignatureUrl: 'https://storage/student_sig.png',
    principalSignatureUrl: 'https://storage/principal_sig.png',
    fieldValues: {
      studentSignature: 'https://storage/student_sig.png',
      principalSignature: 'https://storage/principal_sig.png',
    },
    elements: [
      { id: 'f-sig', type: 'signature', x: 0, y: 0, width: 100, height: 40, rotation: 0, zIndex: 1, content: '', fieldBinding: 'studentSignature', style: {}, side: 'front' },
      { id: 'b-sig', type: 'signature', x: 0, y: 0, width: 100, height: 40, rotation: 0, zIndex: 1, content: '', fieldBinding: 'principalSignature', style: {}, side: 'back' },
    ],
  };

  const normalized = normalizeCardForDashboard(rawCard);
  assert(normalized.studentSignatureUrl === 'https://storage/student_sig.png', 'studentSignatureUrl mismatch');
  assert(normalized.principalSignatureUrl === 'https://storage/principal_sig.png', 'principalSignatureUrl mismatch');
  assert(normalized.studentSignatureUrl !== normalized.principalSignatureUrl, 'Signatures leaked into each other!');

  const { elementsFront, elementsBack } = normalizeCardElements(rawCard);
  assert(elementsFront.length === 1, `Expected 1 front element, got ${elementsFront.length}`);
  assert(elementsBack.length === 1, `Expected 1 back element, got ${elementsBack.length}`);
  assert(elementsFront[0].fieldBinding === 'studentSignature', 'Front element binding mismatch');
  assert(elementsBack[0].fieldBinding === 'principalSignature', 'Back element binding mismatch');
});

// SUITE 4: Firebase Configuration
console.log('\nSuite 4: Firebase Configuration');
runTest('Firebase Config', 'Firebase active configuration has required keys', () => {
  assert(Boolean(activeFirebaseConfig.projectId), 'Missing projectId');
  assert(Boolean(activeFirebaseConfig.apiKey), 'Missing apiKey');
  assert(Boolean(activeFirebaseConfig.authDomain), 'Missing authDomain');
  assert(Boolean(activeFirebaseConfig.storageBucket), 'Missing storageBucket');
  assert(Boolean(activeFirebaseConfig.firestoreDatabaseId), 'Missing firestoreDatabaseId');
});

console.log('\n--- AUDIT SUMMARY ---');
const totalPassed = results.filter((r) => r.passed).length;
const totalFailed = results.filter((r) => !r.passed).length;
console.log(`Total Tests: ${results.length}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalFailed}`);

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('\n✅ ALL AUDIT TESTS PASSED SUCCESSFULLY!\n');
}
