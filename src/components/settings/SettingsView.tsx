import React, { useState } from 'react';
import {
  User,
  Shield,
  Sliders,
  Download,
  Lock,
  Check,
  Building,
  ArrowLeft,
  IdCard,
} from 'lucide-react';
import { UserProfile } from '../../types/card';
import { storageService, AppSettings } from '../../services/storage';

interface SettingsViewProps {
  user: UserProfile | null;
  onBack: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onBack,
  onUpdateUser,
}) => {
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [role, setRole] = useState(user?.role || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const updated: UserProfile = {
        ...user,
        name,
        email,
        organization,
        role,
      };
      await storageService.saveUser(updated);
      onUpdateUser(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update user profile in Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    storageService.saveSettings(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
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
              Preferences
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
              Platform & Account Settings
            </h1>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <Check className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Profile Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-heading">Profile & Organization</h3>
              <p className="text-xs text-slate-500">Manage user identity and credential issuing role.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organization / School</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card Defaults & Export Quality */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-heading">Card Studio Defaults</h3>
              <p className="text-xs text-slate-500">Configure default card geometry, alignment, and export resolution.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-700">
            <div>
              <label className="block font-semibold mb-1">Default Dimension Preset</label>
              <select
                value={settings.defaultCardPreset}
                onChange={(e) => handleUpdateSetting('defaultCardPreset', e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
              >
                <option value="CR80">CR80 (Standard 85.60 × 53.98 mm)</option>
                <option value="ID-1">ID-1 (ISO/IEC 7810)</option>
                <option value="Custom">Custom Dimensions</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Default Validity Duration</label>
              <select
                value={settings.defaultValidityYears}
                onChange={(e) =>
                  handleUpdateSetting('defaultValidityYears', parseInt(e.target.value, 10))
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
              >
                <option value={1}>1 Year Validity</option>
                <option value={2}>2 Years Validity</option>
                <option value={3}>3 Years Validity</option>
                <option value={4}>4 Years Validity (Full Undergraduate)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">300 DPI High-Precision Export</p>
                <p className="text-[11px] text-slate-500">Outputs maximum resolution for commercial card printers.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.highResolutionExport}
                onChange={(e) => handleUpdateSetting('highResolutionExport', e.target.checked)}
                className="accent-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Public QR Verification Gateway</p>
                <p className="text-[11px] text-slate-500">Allow scanning QR codes to view verified status.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enablePublicVerification}
                onChange={(e) => handleUpdateSetting('enablePublicVerification', e.target.checked)}
                className="accent-blue-600 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
