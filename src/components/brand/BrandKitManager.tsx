import React, { useState } from 'react';
import {
  Palette,
  Plus,
  Trash2,
  Edit3,
  Check,
  Building,
  Upload,
  Image as ImageIcon,
  PenTool,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';
import { BrandKit, CardOrientation } from '../../types/card';
import { storageService } from '../../services/storage';

interface BrandKitManagerProps {
  brandKits: BrandKit[];
  onBack: () => void;
  onRefresh: () => void;
}

export const BrandKitManager: React.FC<BrandKitManagerProps> = ({
  brandKits,
  onBack,
  onRefresh,
}) => {
  const [editingKit, setEditingKit] = useState<BrandKit | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [kitToDelete, setKitToDelete] = useState<BrandKit | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [secondaryColor, setSecondaryColor] = useState('#2563eb');
  const [accentColor, setAccentColor] = useState('#38bdf8');
  const [fontFamily, setFontFamily] = useState('Plus Jakarta Sans');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [defaultOrientation, setDefaultOrientation] = useState<CardOrientation>('horizontal');

  const startEdit = (kit: BrandKit) => {
    setEditingKit(kit);
    setName(kit.name);
    setOrganizationName(kit.organizationName);
    setTagline(kit.tagline || '');
    setPrimaryColor(kit.primaryColor);
    setSecondaryColor(kit.secondaryColor);
    setAccentColor(kit.accentColor);
    setFontFamily(kit.fontFamily);
    setPhone(kit.phone || '');
    setEmail(kit.email || '');
    setWebsite(kit.website || '');
    setAddress(kit.address || '');
    setLogoUrl(kit.logoUrl || '');
    setSignatureUrl(kit.signatureUrl || '');
    setDefaultOrientation(kit.defaultOrientation);
    setIsCreatingNew(false);
  };

  const startCreateNew = () => {
    setEditingKit(null);
    setName('New Organization Kit');
    setOrganizationName('');
    setTagline('');
    setPrimaryColor('#0f172a');
    setSecondaryColor('#2563eb');
    setAccentColor('#38bdf8');
    setFontFamily('Plus Jakarta Sans');
    setPhone('');
    setEmail('');
    setWebsite('');
    setAddress('');
    setLogoUrl('');
    setSignatureUrl('');
    setDefaultOrientation('horizontal');
    setIsCreatingNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const kitToSave: BrandKit = {
      id: editingKit ? editingKit.id : `bk_${Date.now()}`,
      name: name || 'Custom Brand Kit',
      organizationName: organizationName || 'Organization',
      tagline,
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      phone,
      email,
      website,
      address,
      logoUrl,
      signatureUrl,
      defaultOrientation,
      defaultTemplateId: 'corporate-clean',
      isDefault: editingKit ? editingKit.isDefault : false,
    };

    await storageService.saveBrandKit(kitToSave);
    onRefresh();
    setEditingKit(null);
    setIsCreatingNew(false);
  };

  const confirmDeleteKit = async (kit: BrandKit) => {
    await storageService.deleteBrandKit(kit.id);
    onRefresh();
    if (editingKit?.id === kit.id) {
      setEditingKit(null);
      setIsCreatingNew(false);
    }
    setKitToDelete(null);
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
              Identity Assets
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
              Organization Brand Kit
            </h1>
          </div>
        </div>

        <button
          onClick={startCreateNew}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Brand Kit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 cols: Brand Kits List */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Saved Brand Kits ({brandKits.length})
          </p>

          <div className="space-y-3">
            {brandKits.map((kit) => (
              <div
                key={kit.id}
                onClick={() => startEdit(kit)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  editingKit?.id === kit.id && !isCreatingNew
                    ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: kit.primaryColor }}
                      className="w-4 h-4 rounded-full border border-white shadow-2xs"
                    />
                    <div
                      style={{ backgroundColor: kit.secondaryColor }}
                      className="w-4 h-4 rounded-full border border-white shadow-2xs"
                    />
                    <span className="font-bold text-xs text-slate-900">{kit.name}</span>
                  </div>

                  {kit.isDefault && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 font-medium">{kit.organizationName}</p>
                {kit.website && (
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{kit.website}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right 8 cols: Editor Form */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-heading">
                {isCreatingNew
                  ? 'Create Brand Kit'
                  : editingKit
                  ? `Edit "${editingKit.name}"`
                  : 'Brand Kit Settings'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure brand colors, logos, fonts, and authority signatures.
              </p>
            </div>

            {editingKit && !isCreatingNew && (
              <button
                type="button"
                onClick={() => setKitToDelete(editingKit)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Kit</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Kit Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University Official"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / School Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">Brand Colors</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Primary Brand Color</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400">Secondary Color</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400">Accent Color</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo & Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Organization Logo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <label className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer">
                    <span>Upload Logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Website
                </label>
                <input
                  type="text"
                  placeholder="https://organization.edu"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingKit(null);
                  setIsCreatingNew(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Brand Kit</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Brand Kit Modal */}
      {kitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                onClick={() => setKitToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Brand Kit?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete brand kit <strong>"{kitToDelete.name}"</strong>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setKitToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDeleteKit(kitToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Delete Brand Kit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
