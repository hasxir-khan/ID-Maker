import React, { useState } from 'react';
import {
  Search,
  GraduationCap,
  Briefcase,
  Building,
  HeartPulse,
  Users,
  Calendar,
  Award,
  Sparkles,
  School,
  BookOpen,
  UserCheck,
  Building2,
  Code,
  Palette,
  Laptop,
  Stethoscope,
  Activity,
  HandHeart,
  Globe,
  CreditCard,
  Trophy,
  Dumbbell,
  UserPlus,
  Ticket,
  Tv2,
  Shield,
  KeyRound,
  IdCard,
  Contact,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { CARD_TYPES, CARD_CATEGORIES } from '../../data/cardTypes';
import { CardTypeDefinition } from '../../types/card';

interface CardTypeSelectorProps {
  onSelectType: (type: CardTypeDefinition) => void;
  onCancel: () => void;
}

const ICON_MAP: Record<string, any> = {
  GraduationCap,
  School,
  BookOpen,
  Building2,
  UserCheck,
  Award,
  Users,
  Briefcase,
  Building,
  Laptop,
  Code,
  Palette,
  ShieldAlert,
  Stethoscope,
  HeartPulse,
  Activity,
  HandHeart,
  Globe,
  CreditCard,
  Trophy,
  Dumbbell,
  UserPlus,
  Ticket,
  Tv2,
  Shield,
  KeyRound,
  IdCard,
  Contact,
  Sparkles,
};

export const CardTypeSelector: React.FC<CardTypeSelectorProps> = ({
  onSelectType,
  onCancel,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTypes = CARD_TYPES.filter((type) => {
    const matchesCategory =
      selectedCategory === 'all' || type.category === selectedCategory;
    const q = (searchQuery ?? '').toString().toLowerCase().trim();
    const nameStr = (type?.name ?? '').toString().toLowerCase();
    const descStr = (type?.description ?? '').toString().toLowerCase();
    const matchesSearch = !q || nameStr.includes(q) || descStr.includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
          Step 1 of 3
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          What would you like to create?
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Choose from 29+ specialized card templates or start with a custom credential format.
        </p>
      </div>

      {/* Search & Category Filter Tabs */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search card types (e.g., Student ID, Doctor, Employee, Event Pass)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CARD_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Card Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTypes.map((type) => {
          const Icon = ICON_MAP[type.iconName] || IdCard;
          return (
            <div
              key={type.id}
              onClick={() => onSelectType(type)}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${type.badgeColor}`}
                  >
                    {type.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {type.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {type.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600">
                <span>{type.fields.length} Configured Fields</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredTypes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            No card types match your search query.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
};
