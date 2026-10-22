import React from 'react';
import { IdCard, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8 text-xs text-slate-500 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-slate-900 text-blue-400 flex items-center justify-center">
            <IdCard className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-slate-900 font-heading">
            ID Maker
          </span>
          <span className="text-slate-400">|</span>
          <span>Create, customize, manage, and export professional identification cards.</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Standard CR80 & ID-1 Layouts</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero-Mistake Engine
          </span>
          <span>•</span>
          <span>© 2026 ID Maker. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
