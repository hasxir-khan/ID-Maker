import React from 'react';
import {
  IdCard,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  FileSpreadsheet,
  Printer,
  Sliders,
  Upload,
  Crop,
  Layers,
  GraduationCap,
  Briefcase,
  Building,
  Users,
  Calendar,
  Award,
  PlusCircle,
  FileCheck,
} from 'lucide-react';

interface LandingPageProps {
  onStartCreating: () => void;
  onExploreTemplates: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCreating,
  onExploreTemplates,
}) => {
  const categories = [
    { name: 'Education', desc: 'Schools, Colleges, Universities & Faculty', icon: GraduationCap },
    { name: 'Professional', desc: 'Employees, Developers, Designers & Staff', icon: Briefcase },
    { name: 'Business', desc: 'Executive credentials & smart business cards', icon: Building },
    { name: 'Membership', desc: 'Clubs, Gyms, Loyalty & VIP programs', icon: Award },
    { name: 'Events', desc: 'Conferences, summits, passes & visitor badges', icon: Calendar },
    { name: 'Organizations', desc: 'NGOs, Volunteers, Healthcare & Security', icon: Users },
    { name: 'Custom', desc: 'Blank canvas & user-defined custom fields', icon: PlusCircle },
  ];

  const steps = [
    {
      num: '01',
      title: 'Choose a Card',
      desc: 'Pick from 29+ specialized card types or create custom field schemas.',
    },
    {
      num: '02',
      title: 'Enter Details',
      desc: 'Fill structured forms, upload profile photos, logos, and digital signatures.',
    },
    {
      num: '03',
      title: 'Customize',
      desc: 'Adjust layout in the visual editor with typography, colors, and live QR code.',
    },
    {
      num: '04',
      title: 'Download',
      desc: 'Export ultra high-res 300 DPI PNG, JPG, single PDF, or printable multi-card sheets.',
    },
  ];

  const features = [
    {
      title: 'Smart Templates',
      desc: 'Professionally styled layouts for universities, corporations, hospitals, and events.',
      icon: Sparkles,
    },
    {
      title: 'Live Card Editor',
      desc: 'Pixel-accurate visual canvas with drag-and-drop, alignment tools, and layers.',
      icon: Sliders,
    },
    {
      title: 'Photo Upload & Crop',
      desc: 'Smart face centering, aspect ratio lock, zoom, and border controls.',
      icon: Crop,
    },
    {
      title: 'Logo & Signature',
      desc: 'Upload organization emblems or draw live signatures directly on canvas.',
      icon: Upload,
    },
    {
      title: 'QR Verification',
      desc: 'Every card gets a unique ID with instant cryptographic web verification.',
      icon: QrCode,
    },
    {
      title: 'Standard Dimensions',
      desc: 'CR80, ID-1, and custom dimensions in millimeters, inches, or pixels.',
      icon: Layers,
    },
    {
      title: 'Automatic Validation',
      desc: 'Pre-export checks for required fields, date logic, and bleed margins.',
      icon: FileCheck,
    },
    {
      title: 'Bulk Generation',
      desc: 'Upload CSV spreadsheets to generate hundreds of student or employee cards.',
      icon: FileSpreadsheet,
    },
    {
      title: 'Print-Ready PDF',
      desc: 'Generate ready-to-print multi-card sheets (2x4, 3x3) with cutting guidelines.',
      icon: Printer,
    },
  ];

  const audiences = [
    'Schools',
    'Colleges',
    'Universities',
    'Companies',
    'Organizations',
    'Events',
    'Freelancers',
    'Professionals',
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-6 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>High-Precision Card & Credential Generator</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight font-heading max-w-4xl mx-auto leading-[1.15]">
            ID Maker
          </h1>
          <p className="mt-3 text-xl sm:text-2xl font-medium text-blue-600">
            Create Professional Cards. Perfectly.
          </p>
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Generate Student IDs, Employee Cards, Membership Cards, Event Passes, Professional Cards and more.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onStartCreating}
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md shadow-slate-900/10 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Create Your Card</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExploreTemplates}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              Explore Templates
            </button>
          </div>

          {/* Hero Visual Mockup */}
          <div className="mt-14 max-w-4xl mx-auto p-3 bg-slate-100/80 rounded-2xl border border-slate-200/90 shadow-xl">
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 text-left grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Card visual sample */}
              <div className="bg-gradient-to-tr from-slate-900 to-blue-950 p-5 rounded-xl text-white shadow-md border border-slate-800 relative overflow-hidden aspect-[1.586/1]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-[10px] font-bold">
                      ID
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-wide">STANFORD UNIVERSITY</p>
                      <p className="text-[9px] text-blue-300">STUDENT IDENTIFICATION</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono bg-blue-900/60 px-1.5 py-0.5 rounded text-blue-200 border border-blue-700/50">
                    2026-27
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-20 h-24 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-sm font-bold text-white">Ali Khan</p>
                    <p className="text-[10px] text-slate-300 font-mono">ID: STU-2026-8841</p>
                    <p className="text-[10px] text-slate-400">Dept: Computer Science</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">● ACTIVE CREDENTIAL</p>
                  </div>
                </div>
              </div>

              {/* Quality points */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                  <Sparkles className="w-4 h-4" />
                  <span>Standard CR80 & Custom Formats</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Smart automated generation with fine-grained canvas overrides.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your organization info and photo once. ID Maker positions every field, embeds scannable QR verification, validates date logic, and produces print-ready high resolution output.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-600">
                  <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">✓ 300 DPI PNG</span>
                  <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">✓ Vector PDF</span>
                  <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">✓ QR Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Categories Section */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
            Supported Card Categories
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Over 29+ specialized card templates designed for every sector.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                className="bg-white p-5 rounded-xl border border-slate-200/90 hover:border-blue-400/80 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-3.5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">{cat.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mt-1">
              HOW IT WORKS
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Four streamlined steps to generate pixel-perfect identification cards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="bg-slate-50/70 p-6 rounded-xl border border-slate-200/80 relative space-y-3"
              >
                <span className="text-2xl font-extrabold font-mono text-blue-600 block">
                  {step.num}
                </span>
                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Features
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mt-1">
            Engineered For Professional Accuracy
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Everything you need for enterprise-grade card design and issuance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white p-6 rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all space-y-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">{feat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* BUILT FOR */}
      <section className="py-14 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Audience
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading mt-1 mb-8">
            BUILT FOR
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
            {audiences.map((aud) => (
              <span
                key={aud}
                className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 shadow-2xs"
              >
                {aud}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Ready to create your card?
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Design, validate, and download professional identification cards in minutes.
          </p>
          <div className="pt-2">
            <button
              onClick={onStartCreating}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md shadow-slate-900/10 hover:shadow-lg transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Start Creating</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
