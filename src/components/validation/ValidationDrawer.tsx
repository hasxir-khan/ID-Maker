import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { ValidationResult } from '../../types/card';

interface ValidationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  validation: ValidationResult;
  onFixIssue?: (fieldId?: string, elementId?: string) => void;
}

export const ValidationDrawer: React.FC<ValidationDrawerProps> = ({
  isOpen,
  onClose,
  validation,
  onFixIssue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                validation.isValid
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-heading">
                Zero-Mistake Quality Audit
              </h3>
              <p className="text-xs text-slate-500">
                Pre-export validation for printable ID compliance.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Status banner */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              validation.isValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {validation.isValid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            )}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider">
                {validation.isValid ? 'CARD READY FOR EXPORT' : 'NEEDS ATTENTION'}
              </h4>
              <p className="text-xs mt-0.5 opacity-90">
                {validation.isValid
                  ? 'All mandatory identity fields, dates, and boundary requirements pass quality checks.'
                  : `Found ${validation.issues.length} item(s) that should be reviewed before printing.`}
              </p>
            </div>
          </div>

          {/* Issues List */}
          {validation.issues.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Audit Findings
              </p>
              {validation.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    {issue.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h5 className="font-bold text-slate-900">{issue.title}</h5>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{issue.message}</p>
                    </div>
                  </div>

                  {issue.actionLabel && onFixIssue && (
                    <button
                      type="button"
                      onClick={() => {
                        onFixIssue(issue.fieldId, issue.elementId);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <span>{issue.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">Zero warnings or errors detected.</p>
              <p>Your card conforms to standard CR80 print specs.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
