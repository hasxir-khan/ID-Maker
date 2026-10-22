import React, { useState } from 'react';
import Papa from 'papaparse';
import {
  FileSpreadsheet,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Printer,
  Trash2,
  Layers,
  Database,
} from 'lucide-react';
import { CardData, CardTypeDefinition } from '../../types/card';
import { CARD_TYPES } from '../../data/cardTypes';
import { CARD_TEMPLATES } from '../../data/templates';
import { SAMPLE_BULK_DATASETS } from '../../data/sampleBulkData';
import { storageService } from '../../services/storage';
import { CardCanvas } from '../editor/CardCanvas';
import { PrintSheetModal } from '../export/PrintSheetModal';

interface BulkGeneratorProps {
  onBack: () => void;
  onGenerationComplete: (createdCards: CardData[]) => void;
}

export const BulkGenerator: React.FC<BulkGeneratorProps> = ({
  onBack,
  onGenerationComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload & Map, 2: Choose Template & Preview, 3: Success / Sheet Export
  const [selectedCardTypeId, setSelectedCardTypeId] = useState<string>('student-id');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('modern-academic');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({}); // cardFieldId -> csvColumnHeader
  const [generatedCards, setGeneratedCards] = useState<CardData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState<boolean>(false);

  const cardType =
    CARD_TYPES.find((t) => t.id === selectedCardTypeId) || CARD_TYPES[0];
  const template =
    CARD_TEMPLATES.find((t) => t.id === selectedTemplateId) || CARD_TEMPLATES[0];

  // Auto-map columns with intelligent heuristics
  const autoMapColumns = (headers: string[], fields: any[]) => {
    const mappings: Record<string, string> = {};
    fields.forEach((field) => {
      const match = headers.find((h) => {
        const hClean = (h ?? '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        const fIdClean = (field?.id ?? '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        const hLower = (h ?? '').toString().toLowerCase();
        const fLabelLower = (field?.label ?? '').toString().toLowerCase();
        return (
          (hClean.length > 0 && hClean === fIdClean) ||
          (fLabelLower.length > 0 && hLower.includes(fLabelLower)) ||
          (hLower.length > 0 && fLabelLower.includes(hLower))
        );
      });
      if (match) {
        mappings[field.id] = match;
      }
    });
    return mappings;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const headers = results.meta.fields || [];
        setParsedRows(rows);
        setColumnHeaders(headers);
        setFieldMappings(autoMapColumns(headers, cardType.fields));
      },
    });
  };

  const handleLoadSampleDataset = (datasetId: string) => {
    const dataset = SAMPLE_BULK_DATASETS.find((d) => d.id === datasetId);
    if (!dataset) return;

    setSelectedCardTypeId(dataset.cardTypeId);
    setSelectedTemplateId(dataset.templateId);
    setCsvRawText(dataset.csv);

    Papa.parse(dataset.csv, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const headers = results.meta.fields || [];
        setParsedRows(rows);
        setColumnHeaders(headers);
        const targetCardType =
          CARD_TYPES.find((t) => t.id === dataset.cardTypeId) || cardType;
        setFieldMappings(autoMapColumns(headers, targetCardType.fields));
      },
    });
  };

  const handleGenerateCards = () => {
    setIsProcessing(true);

    const baseYear = new Date().getFullYear();
    const prefix = `IDM-${baseYear}-`;

    const newCards: CardData[] = parsedRows.map((row, index) => {
      const cardId = `${prefix}${String(index + 101).padStart(4, '0')}`;
      const fieldValues: Record<string, string> = {};

      Object.entries(fieldMappings).forEach(([fieldId, csvHeader]) => {
        if (csvHeader && row[csvHeader] !== undefined) {
          fieldValues[fieldId] = row[csvHeader];
        }
      });

      const personName =
        fieldValues['fullName'] ||
        row['Name'] ||
        row['FullName'] ||
        `Person ${index + 1}`;
      const organizationName =
        fieldValues['institutionName'] ||
        row['Organization'] ||
        row['Company'] ||
        row['School'] ||
        'Organization';

      return {
        id: cardId,
        cardTypeId: cardType.id,
        templateId: selectedTemplateId,
        name: `${cardType.name} — ${personName}`,
        personName,
        organizationName,
        orientation: template.defaultOrientation,
        dimensions: cardType.suggestedDimensions,
        fieldValues: {
          ...fieldValues,
          fullName: personName,
          institutionName: organizationName,
          studentId: fieldValues['studentId'] || cardId,
        },
        elementsFront: template.elementsFront,
        elementsBack: template.elementsBack || [],
        elements: [...template.elementsFront, ...(template.elementsBack || [])],
        status: 'active',
        issueDate: fieldValues['issueDate'] || new Date().toISOString().split('T')[0],
        expiryDate: fieldValues['expiryDate'] || '2027-10-06',
        qrConfig: {
          enabled: true,
          embeddedVerificationUrl: true,
          showOnFront: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    setGeneratedCards(newCards);
    setIsProcessing(false);
    setStep(3);
  };

  const handleSaveAllToDashboard = async () => {
    setIsProcessing(true);
    try {
      for (const card of generatedCards) {
        await storageService.saveCard(card);
      }
      setIsProcessing(false);
      onGenerationComplete(generatedCards);
    } catch (err) {
      setIsProcessing(false);
      console.error('Failed to bulk save cards:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Bulk Production
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
              Spreadsheet Bulk ID Generator
            </h1>
          </div>
        </div>

        {/* Step Pills */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full ${
              step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            1. Upload & Map
          </span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            2. Template & Preview
          </span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            3. Batch Export
          </span>
        </div>
      </div>

      {/* STEP 1: Upload & Map */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 cols: File Upload & Sample Datasets */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Step 1: Upload CSV Spreadsheet
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload a CSV spreadsheet containing columns for Name, ID, Department, Email, etc.
              </p>
            </div>

            {/* Target Card Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Target Card Scheme
              </label>
              <select
                value={selectedCardTypeId}
                onChange={(e) => setSelectedCardTypeId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-semibold text-slate-900 cursor-pointer"
              >
                {CARD_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Box */}
            <label className="flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl cursor-pointer transition-colors text-center group">
              <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
              <p className="text-xs font-bold text-slate-800">
                Click to choose CSV file or drag and drop
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Comma-separated values (.csv) with header row
              </p>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* 1-Click Ready Sample Datasets */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">
                Or 1-Click Load Ready Sample Dataset:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_BULK_DATASETS.map((ds) => (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => handleLoadSampleDataset(ds.id)}
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left text-xs transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-slate-900 truncate">{ds.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Click to auto-fill</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 cols: Column Field Mapping Table */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Field Mapping
                </h3>
                {parsedRows.length > 0 && (
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    {parsedRows.length} rows loaded
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Map each card element to its corresponding spreadsheet column.
              </p>
            </div>

            {columnHeaders.length > 0 ? (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {cardType.fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 truncate block">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{field.id}</span>
                    </div>

                    <select
                      value={fieldMappings[field.id] || ''}
                      onChange={(e) =>
                        setFieldMappings((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 max-w-[140px] truncate cursor-pointer"
                    >
                      <option value="">(None / Blank)</option>
                      {columnHeaders.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400 space-y-1">
                <Database className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="font-semibold text-slate-600">No spreadsheet loaded yet</p>
                <p>Upload a CSV file or load a sample dataset on the left.</p>
              </div>
            )}

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>Proceed to Template & Preview ({parsedRows.length} Cards)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Choose Template & Batch Preview */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Step 2: Choose Base Template for All {parsedRows.length} Cards
              </h2>
              <p className="text-xs text-slate-500">
                All records will be styled and rendered using this design.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
              >
                Change Mapping
              </button>

              <button
                type="button"
                onClick={handleGenerateCards}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Generate Batch of {parsedRows.length} Cards</span>
              </button>
            </div>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CARD_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tmpl.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedTemplateId === tmpl.id
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600 font-bold text-blue-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div
                  className={`h-3 rounded w-full bg-gradient-to-r ${tmpl.previewGradient} mb-2`}
                />
                <h4 className="font-bold text-xs">{tmpl.name}</h4>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                  {tmpl.category}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Batch Results & Export Sheet */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-emerald-950 font-heading">
                  Batch Generated Successfully!
                </h3>
                <p className="text-xs text-emerald-800">
                  {generatedCards.length} professional identification cards generated with QR verification codes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsPrintSheetOpen(true)}
                className="px-4 py-2.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Export Multi-Card Print Sheet (PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAllToDashboard}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Save All {generatedCards.length} Cards to Dashboard</span>
              </button>
            </div>
          </div>

          {/* Cards Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {generatedCards.map((c) => (
              <div
                key={c.id}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2 flex flex-col items-center"
              >
                <CardCanvas
                  card={c}
                  selectedElementId={null}
                  onSelectElement={() => {}}
                  onUpdateElement={() => {}}
                  readOnly={true}
                  zoomScale={0.45}
                />
                <div className="w-full text-center pt-1 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{c.personName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{c.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Sheet Modal */}
      <PrintSheetModal
        cards={generatedCards}
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
      />
    </div>
  );
};
