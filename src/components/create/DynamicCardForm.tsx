import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Upload,
  User,
  Image as ImageIcon,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  Palette,
  RotateCw,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { CardData, CardTypeDefinition, CardOrientation, BrandKit } from '../../types/card';
import { CARD_TEMPLATES } from '../../data/templates';
import {
  getTemplateRequirements,
  getSubtypeLevel,
  CardFieldRequirement,
} from '../../services/requirementsEngine';
import { validateCard } from '../../services/validator';
import { PhotoUploaderModal } from './PhotoUploaderModal';
import { SignaturePadModal } from './SignaturePadModal';
import { CardCanvas } from '../editor/CardCanvas';
import { storageService } from '../../services/storage';

interface DynamicCardFormProps {
  cardType: CardTypeDefinition;
  initialCard?: CardData;
  onBack: () => void;
  onProceedToEditor: (card: CardData) => void;
  brandKits: BrandKit[];
}

export const DynamicCardForm: React.FC<DynamicCardFormProps> = ({
  cardType,
  initialCard,
  onBack,
  onProceedToEditor,
  brandKits,
}) => {
  // 1. Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialCard?.templateId || cardType.defaultTemplateId || CARD_TEMPLATES[0].id
  );

  const currentTemplate = useMemo(() => {
    return CARD_TEMPLATES.find((t) => t.id === selectedTemplateId) || CARD_TEMPLATES[0];
  }, [selectedTemplateId]);

  const [orientation, setOrientation] = useState<CardOrientation>(
    initialCard?.orientation || currentTemplate.defaultOrientation || 'horizontal'
  );

  // Requirements schema for active template
  const schema = useMemo(() => {
    return getTemplateRequirements(selectedTemplateId);
  }, [selectedTemplateId]);

  // 2. Level / Subtype state
  const [selectedLevelId, setSelectedLevelId] = useState<string>(() => {
    if (initialCard?.fieldValues?.cardSubtypeLevel) {
      return initialCard.fieldValues.cardSubtypeLevel;
    }
    return schema.defaultLevelId || schema.levels?.[0]?.id || '';
  });

  // When template changes, synchronize default level if current level is invalid for new template
  useEffect(() => {
    if (schema.levels && schema.levels.length > 0) {
      const exists = schema.levels.some((l) => l.id === selectedLevelId);
      if (!exists) {
        setSelectedLevelId(schema.defaultLevelId || schema.levels[0].id);
      }
    }
  }, [schema, selectedLevelId]);

  // 3. Field Values State
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = { ...(initialCard?.fieldValues || {}) };

    // Fill defaults from schema if not present
    schema.fields.forEach((f) => {
      if (values[f.key] === undefined && f.defaultValue) {
        values[f.key] = f.defaultValue;
      }
    });

    if (initialCard?.personName && !values['fullName']) {
      values['fullName'] = initialCard.personName;
    }
    if (initialCard?.organizationName && !values['institutionName']) {
      values['institutionName'] = initialCard.organizationName;
    }

    return values;
  });

  // 4. Custom Fields
  const [customFields, setCustomFields] = useState<{ id: string; label: string; value: string }[]>(
    initialCard?.customFields || []
  );

  // 5. Assets
  const [photoUrl, setPhotoUrl] = useState<string>(initialCard?.photoUrl || '');
  const [logoUrl, setLogoUrl] = useState<string>(initialCard?.logoUrl || '');
  const [studentSignatureUrl, setStudentSignatureUrl] = useState<string>(
    initialCard?.studentSignatureUrl ||
      initialCard?.fieldValues?.['studentSignature'] ||
      initialCard?.fieldValues?.['cardholderSignature'] ||
      ''
  );
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState<string>(
    initialCard?.principalSignatureUrl ||
      initialCard?.fieldValues?.['principalSignature'] ||
      initialCard?.fieldValues?.['authorizedSignature'] ||
      ''
  );

  // 6. Validation Error Messages Map
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [showValidationErrors, setShowValidationErrors] = useState<boolean>(false);

  // 7. Preview Controls
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [qrEnabled] = useState<boolean>(initialCard?.qrConfig?.enabled ?? true);

  // 8. Modals
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [activeSigTarget, setActiveSigTarget] = useState<'student' | 'principal' | null>(null);
  const [selectedBrandKitId, setSelectedBrandKitId] = useState<string>('');

  // Handle Level / Subtype change
  const handleLevelChange = (levelId: string) => {
    setSelectedLevelId(levelId);
    const levelDef = getSubtypeLevel(selectedTemplateId, levelId);
    setFieldValues((prev) => {
      const updated: Record<string, string> = { ...prev, cardSubtypeLevel: levelId };
      // If default role is available and jobTitle / gradeClass is empty or set to previous level default
      if (levelDef?.defaultRole) {
        if (!updated['jobTitle'] || updated['jobTitle'].trim() === '') {
          updated['jobTitle'] = levelDef.defaultRole;
        }
        if (!updated['gradeClass'] || updated['gradeClass'].trim() === '') {
          updated['gradeClass'] = levelDef.defaultRole;
        }
      }
      return updated;
    });
  };

  // Field change handler
  const handleFieldChange = (fieldKey: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldKey]: value }));
    setTouchedFields((prev) => ({ ...prev, [fieldKey]: true }));
  };

  const handleApplyBrandKit = (kitId: string) => {
    setSelectedBrandKitId(kitId);
    const kit = brandKits.find((k) => k.id === kitId);
    if (!kit) return;

    if (kit.organizationName) {
      handleFieldChange('institutionName', kit.organizationName);
    }
    if (kit.logoUrl) setLogoUrl(kit.logoUrl);
    if (kit.signatureUrl) {
      setPrincipalSignatureUrl(kit.signatureUrl);
      handleFieldChange('principalSignature', kit.signatureUrl);
    }
    if (kit.phone) handleFieldChange('phone', kit.phone);
    if (kit.email) handleFieldChange('email', kit.email);
    if (kit.address) handleFieldChange('address', kit.address);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomField = () => {
    const newFieldId = `custom_${Date.now()}`;
    setCustomFields((prev) => [
      ...prev,
      { id: newFieldId, label: 'Custom Label', value: '' },
    ]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Generate card payload
  const generatedCardData: CardData = useMemo(() => {
    const personName = (fieldValues['fullName'] || '').trim();
    const organizationName = (fieldValues['institutionName'] || '').trim();

    const elementsFront = initialCard?.elementsFront && initialCard.elementsFront.length > 0
      ? initialCard.elementsFront
      : (currentTemplate.elementsFront || []).map((el, i) => ({
          ...el,
          id: el.id || `front_${i}`,
          side: 'front' as const,
        }));

    const elementsBack = initialCard?.elementsBack && initialCard.elementsBack.length > 0
      ? initialCard.elementsBack
      : (currentTemplate.elementsBack || []).map((el, i) => ({
          ...el,
          id: el.id || `back_${i}`,
          side: 'back' as const,
        }));

    const elements = [...elementsFront, ...elementsBack];

    return {
      id: initialCard?.id || storageService.generateNextCardId(),
      cardTypeId: cardType.id,
      templateId: selectedTemplateId,
      name: initialCard?.name || `${cardType.name} — ${personName || 'Untitled'}`,
      personName: personName || 'Full Name',
      organizationName: organizationName || 'Organization',
      orientation,
      dimensions: currentTemplate.dimensions || cardType.suggestedDimensions,
      fieldValues: {
        ...fieldValues,
        cardSubtypeLevel: selectedLevelId,
        studentSignature: studentSignatureUrl,
        principalSignature: principalSignatureUrl,
      },
      cardSubtypeLevel: selectedLevelId || undefined,
      customFields,
      photoUrl,
      logoUrl,
      studentSignatureUrl,
      principalSignatureUrl,
      signatureUrl: principalSignatureUrl || studentSignatureUrl || '',
      elementsFront,
      elementsBack,
      elements,
      status: initialCard?.status || 'draft',
      issueDate: fieldValues['issueDate'] || new Date().toISOString().split('T')[0],
      expiryDate: fieldValues['expiryDate'] || '2028-10-06',
      issuedBy: fieldValues['issuedBy'] || 'Authorized Office',
      qrConfig: {
        enabled: qrEnabled,
        embeddedVerificationUrl: true,
        showOnFront: schema.recommendedAssets.qr === 'front' || schema.recommendedAssets.qr === 'both',
      },
      createdAt: initialCard?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    initialCard,
    cardType,
    selectedTemplateId,
    currentTemplate,
    orientation,
    fieldValues,
    selectedLevelId,
    customFields,
    photoUrl,
    logoUrl,
    studentSignatureUrl,
    principalSignatureUrl,
    qrEnabled,
    schema,
  ]);

  // Live validation
  const validationResult = useMemo(() => {
    return validateCard(generatedCardData);
  }, [generatedCardData]);

  // Form submission: Validate before proceeding
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidationErrors(true);

    if (!validationResult.isValid) {
      const firstError = validationResult.issues.find((i) => i.type === 'error');
      if (firstError?.fieldId) {
        const el = document.getElementById(`field-input-${firstError.fieldId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }
      return;
    }

    onProceedToEditor(generatedCardData);
  };

  // Group schema fields by section
  const identityFields = schema.fields.filter(
    (f) => f.section === 'identity' || (f.key === 'fullName')
  );
  const orgFields = schema.fields.filter(
    (f) => f.section === 'organization'
  );
  const credentialFields = schema.fields.filter(
    (f) => f.section === 'role_credentials'
  );
  const dateFields = schema.fields.filter(
    (f) => f.section === 'dates_validity'
  );
  const contactFields = schema.fields.filter(
    (f) => f.section === 'contact_emergency'
  );
  const securityFields = schema.fields.filter(
    (f) => f.section === 'security_terms'
  );

  const renderFieldInput = (field: CardFieldRequirement) => {
    const value = fieldValues[field.key] ?? '';
    const hasError =
      showValidationErrors &&
      field.required &&
      (!value || value.trim() === '');

    return (
      <div key={field.key} className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`field-input-${field.key}`}
            className="block text-xs font-semibold text-slate-700"
          >
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200 uppercase">
            {field.side}
          </span>
        </div>

        {field.type === 'select' ? (
          <select
            id={`field-input-${field.key}`}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer ${
              hasError ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
            }`}
          >
            <option value="">Select option...</option>
            {field.options?.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : field.type === 'multiline' ? (
          <textarea
            id={`field-input-${field.key}`}
            rows={2}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
              hasError ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
            }`}
          />
        ) : (
          <input
            id={`field-input-${field.key}`}
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
              hasError ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
            }`}
          />
        )}

        {field.helpText && (
          <p className="text-[11px] text-slate-400 leading-tight">{field.helpText}</p>
        )}

        {hasError && (
          <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>This field is required for {schema.templateName}.</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Card Selection</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Step 2 of 3</span>
          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
            Card Information Requirements
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Schema-Driven Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-5 gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cardType.badgeColor}`}>
                  {cardType.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {currentTemplate.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-heading mt-2">
                Cardholder Requirements
              </h2>
              <p className="text-xs text-slate-500">
                Fields adapt strictly according to {currentTemplate.name} ({schema.cardCategoryId}).
              </p>
            </div>

            {/* Brand Kit Selector */}
            {brandKits.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Palette className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedBrandKitId}
                  onChange={(e) => handleApplyBrandKit(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="">Apply Brand Kit...</option>
                  {brandKits.map((kit) => (
                    <option key={kit.id} value={kit.id}>
                      {kit.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Level / Subtype Selector (if supported by template) */}
          {schema.levels && schema.levels.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Select Card Subtype / Professional Level:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {schema.levels.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => handleLevelChange(lvl.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex flex-col justify-between ${
                      selectedLevelId === lvl.id
                        ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">{lvl.label}</span>
                    {lvl.badgeText && (
                      <span className="text-[9px] font-mono opacity-70 mt-1 uppercase">
                        {lvl.badgeText}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primary Identity */}
            {identityFields.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Primary Identity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {identityFields.map(renderFieldInput)}
                </div>
              </div>
            )}

            {/* Media Uploads: Photo, Logo, Signature */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  Media & Assets
                </h3>
                <span className="text-[11px] text-slate-500">
                  Photo: <span className="font-semibold text-slate-700 capitalize">{schema.recommendedAssets.photo}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Photo uploader */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Cardholder Photo
                  </span>
                  <div className="w-12 h-14 rounded-lg bg-slate-200 mx-auto overflow-hidden flex items-center justify-center">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    {photoUrl ? 'Adjust Photo' : '+ Upload Photo'}
                  </button>
                </div>

                {/* Logo uploader */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Organization Logo
                  </span>
                  <div className="w-12 h-14 rounded-lg bg-slate-200 mx-auto overflow-hidden flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <label className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer block">
                    <span>{logoUrl ? 'Change Logo' : '+ Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Student / Cardholder Signature (Front) */}
                {currentTemplate.elementsFront.some((e) => e.type === 'signature') && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                        Front: Student Signature
                      </span>
                      {studentSignatureUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setStudentSignatureUrl('');
                            handleFieldChange('studentSignature', '');
                          }}
                          className="text-[10px] text-red-500 hover:text-red-700 underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="w-full h-14 rounded-lg bg-white border border-slate-200 mx-auto overflow-hidden flex items-center justify-center px-2">
                      {studentSignatureUrl ? (
                        <img src={studentSignatureUrl} alt="Student Signature" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">No Signature</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSigTarget('student');
                        setIsSigModalOpen(true);
                      }}
                      className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      {studentSignatureUrl ? 'Change Signature' : '+ Draw Student Sig'}
                    </button>
                  </div>
                )}

                {/* Principal / Authorized Authority Signature (Back) */}
                {((currentTemplate.elementsBack || []).some((e) => e.type === 'signature') ||
                  !currentTemplate.elementsFront.some((e) => e.type === 'signature')) && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                        Back: Authority Signature
                      </span>
                      {principalSignatureUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setPrincipalSignatureUrl('');
                            handleFieldChange('principalSignature', '');
                          }}
                          className="text-[10px] text-red-500 hover:text-red-700 underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="w-full h-14 rounded-lg bg-white border border-slate-200 mx-auto overflow-hidden flex items-center justify-center px-2">
                      {principalSignatureUrl ? (
                        <img src={principalSignatureUrl} alt="Authority Signature" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">No Signature</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSigTarget('principal');
                        setIsSigModalOpen(true);
                      }}
                      className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      {principalSignatureUrl ? 'Change Signature' : '+ Draw Authority Sig'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Section */}
            {orgFields.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Organization & Department
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {orgFields.map(renderFieldInput)}
                </div>
              </div>
            )}

            {/* Role & Credentials Section */}
            {credentialFields.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Role, Rank & Credentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {credentialFields.map(renderFieldInput)}
                </div>
              </div>
            )}

            {/* Dates & Validity */}
            {dateFields.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Validity & Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {dateFields.map(renderFieldInput)}
                </div>
              </div>
            )}

            {/* Contact & Emergency Section */}
            {contactFields.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contact & Emergency Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {contactFields.map(renderFieldInput)}
                </div>
              </div>
            )}

            {/* Security & Issuing Authority */}
            {securityFields.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Issuing Authority & Regulations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {securityFields.map(renderFieldInput)}
                </div>
              </div>
            )}

            {/* Custom Additional Fields */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Custom Additional Fields
                </h3>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Field</span>
                </button>
              </div>

              {customFields.map((cf) => (
                <div key={cf.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Field Label"
                    value={cf.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomFields((prev) =>
                        prev.map((item) => (item.id === cf.id ? { ...item, label: val } : item))
                      );
                    }}
                    className="w-1/3 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Field Value"
                    value={cf.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomFields((prev) =>
                        prev.map((item) => (item.id === cf.id ? { ...item, value: val } : item))
                      );
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(cf.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Validation Feedback Banner */}
            {showValidationErrors && !validationResult.isValid && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Required information is missing</p>
                  <p className="text-[11px] mt-0.5 text-red-700">
                    Please provide all required fields marked with * before customizing in the studio.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck
                  className={`w-4 h-4 ${
                    validationResult.isValid ? 'text-emerald-600' : 'text-amber-500'
                  }`}
                />
                <span>
                  {validationResult.isValid
                    ? 'All required fields valid'
                    : `${validationResult.issues.filter((i) => i.type === 'error').length} required fields needed`}
                </span>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Customize in Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right 5 Columns: Live Interactive Card Canvas Preview */}
        <div className="lg:col-span-5 space-y-5 sticky top-24">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Live Card Generation
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewSide(previewSide === 'front' ? 'back' : 'front')}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                  title="Flip Preview Side"
                >
                  <RotateCw className="w-3 h-3 text-slate-500" />
                  <span>{previewSide === 'front' ? 'Front Side' : 'Back Side'}</span>
                </button>
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  {orientation === 'horizontal' ? 'Landscape (CR80)' : 'Portrait (Lanyard)'}
                </span>
              </div>
            </div>

            {/* Mini Canvas */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden min-h-[260px]">
              <CardCanvas
                card={generatedCardData}
                selectedElementId={null}
                onSelectElement={() => {}}
                onUpdateElement={() => {}}
                readOnly={true}
                activeSide={previewSide}
                zoomScale={orientation === 'horizontal' ? 0.65 : 0.65}
              />
            </div>

            {/* Template Selector Ribbon */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Choose Template Design (All 22)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {CARD_TEMPLATES.findIndex((t) => t.id === selectedTemplateId) + 1} / {CARD_TEMPLATES.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {CARD_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setOrientation(tmpl.defaultOrientation);
                    }}
                    className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      selectedTemplateId === tmpl.id
                        ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div
                      className={`h-2 rounded w-full bg-gradient-to-r ${tmpl.previewGradient} mb-1.5`}
                    />
                    <p className="truncate text-[11px]">{tmpl.name}</p>
                    <span className="text-[9px] text-slate-400 capitalize block truncate">
                      {tmpl.defaultOrientation}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PhotoUploaderModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentPhotoUrl={photoUrl}
        onSavePhoto={(url) => setPhotoUrl(url)}
      />

      <SignaturePadModal
        isOpen={isSigModalOpen}
        onClose={() => {
          setIsSigModalOpen(false);
          setActiveSigTarget(null);
        }}
        title={
          activeSigTarget === 'student'
            ? 'Cardholder / Student Signature Studio'
            : 'Principal / Authorized Authority Signature Studio'
        }
        subtitle={
          activeSigTarget === 'student'
            ? 'Draw cardholder signature or upload transparent PNG for the front of the card.'
            : 'Draw official authorized issuer/principal signature for the back of the card.'
        }
        currentSignatureUrl={
          activeSigTarget === 'student' ? studentSignatureUrl : principalSignatureUrl
        }
        onSaveSignature={(url) => {
          if (activeSigTarget === 'student') {
            setStudentSignatureUrl(url);
            handleFieldChange('studentSignature', url);
          } else {
            setPrincipalSignatureUrl(url);
            handleFieldChange('principalSignature', url);
          }
          setIsSigModalOpen(false);
          setActiveSigTarget(null);
        }}
      />
    </div>
  );
};
