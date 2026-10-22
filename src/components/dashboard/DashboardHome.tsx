import React, { useState, useMemo } from 'react';
import {
  Plus,
  PlusCircle,
  Search,
  SlidersHorizontal,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  GraduationCap,
  Briefcase,
  IdCard,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { CardData, UserProfile, normalizeCardForDashboard } from '../../types/card';
import { CardCard } from './CardCard';
import { CARD_TYPES } from '../../data/cardTypes';

interface DashboardHomeProps {
  user: UserProfile | null;
  cards: CardData[];
  onOpenCreate: (presetCardTypeId?: string) => void;
  onOpenBulk: () => void;
  onViewCard: (card: CardData) => void;
  onEditCard: (card: CardData) => void;
  onDuplicateCard: (card: CardData) => void;
  onDownloadCard: (card: CardData) => void;
  onDeleteCard: (card: CardData) => void;
  onNavigateMyCards: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  user,
  cards,
  onOpenCreate,
  onOpenBulk,
  onViewCard,
  onEditCard,
  onDuplicateCard,
  onDownloadCard,
  onDeleteCard,
  onNavigateMyCards,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Defensive boundary normalization for cards
  const normalizedCards = useMemo(() => {
    if (!Array.isArray(cards)) return [];
    return cards.map((c) => normalizeCardForDashboard(c));
  }, [cards]);

  // Statistics calculation with guaranteed safe properties
  const totalCards = normalizedCards.length;
  const activeCards = normalizedCards.filter(
    (c) => (c?.status ?? '').toString().toLowerCase() === 'active'
  ).length;
  const draftCards = normalizedCards.filter(
    (c) => (c?.status ?? '').toString().toLowerCase() === 'draft'
  ).length;
  const expiredCards = normalizedCards.filter(
    (c) => (c?.status ?? '').toString().toLowerCase() === 'expired'
  ).length;

  // Filter cards with complete defensive string guards
  const filteredCards = useMemo(() => {
    const q = (searchQuery ?? '').toString().toLowerCase().trim();
    const selCat = (selectedCategory ?? 'all').toString().toLowerCase().trim();
    const selStat = (selectedStatus ?? 'all').toString().toLowerCase().trim();

    return normalizedCards.filter((card) => {
      if (!card) return false;
      const cardType = CARD_TYPES.find((t) => t.id === card.cardTypeId);

      const nameStr = (card.name ?? '').toString().toLowerCase();
      const personStr = (card.personName ?? '').toString().toLowerCase();
      const idStr = (card.id ?? '').toString().toLowerCase();
      const orgStr = (card.organizationName ?? '').toString().toLowerCase();
      const typeName = (cardType?.name ?? '').toString().toLowerCase();

      const matchesSearch =
        !q ||
        nameStr.includes(q) ||
        personStr.includes(q) ||
        idStr.includes(q) ||
        orgStr.includes(q) ||
        typeName.includes(q);

      const typeIdStr = (card.cardTypeId ?? card.cardType ?? '').toString().toLowerCase();
      const legacyCat = (card.category ?? '').toString().toLowerCase();
      const catStr = (cardType?.category ?? 'uncategorized').toString().toLowerCase();

      const matchesCategory =
        selCat === 'all' ||
        typeIdStr.includes(selCat) ||
        catStr === selCat ||
        legacyCat === selCat;

      const cardStat = (card.status ?? 'draft').toString().toLowerCase();
      const matchesStatus =
        selStat === 'all' || cardStat === selStat;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [normalizedCards, searchQuery, selectedCategory, selectedStatus]);

  const welcomeDisplayName =
    (typeof user?.displayName === 'string' && user.displayName.trim()) ||
    (typeof user?.name === 'string' && user.name.trim()) ||
    (typeof user?.email === 'string' && user.email.includes('@') && user.email.split('@')[0]) ||
    'Administrator';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200/60">
              Workspace Overview
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            Welcome to ID Maker{welcomeDisplayName ? `, ${welcomeDisplayName}` : ''}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Create a new professional card or manage your active credential database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onOpenCreate()}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>+ Create New Card</span>
          </button>
        </div>
      </div>

      {/* Statistics 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Cards</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
            {totalCards}
          </p>
          <span className="text-[11px] text-slate-400 block pt-1">All generated credentials</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-emerald-600">Active Cards</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700">
            {activeCards}
          </p>
          <span className="text-[11px] text-slate-400 block pt-1">Valid & verifiable IDs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-amber-600">Drafts</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-700">
            {draftCards}
          </p>
          <span className="text-[11px] text-slate-400 block pt-1">In design / pending</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-rose-600">Expired Cards</span>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-700">
            {expiredCards}
          </p>
          <span className="text-[11px] text-slate-400 block pt-1">Requires renewal</span>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => onOpenCreate('student-id')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 truncate">
                Student ID
              </p>
              <p className="text-[10px] text-slate-500">School / College</p>
            </div>
          </button>

          <button
            onClick={() => onOpenCreate('employee-id')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 truncate">
                Employee ID
              </p>
              <p className="text-[10px] text-slate-500">Company Badge</p>
            </div>
          </button>

          <button
            onClick={() => onOpenCreate('professional-card')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <IdCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 truncate">
                Professional
              </p>
              <p className="text-[10px] text-slate-500">Legal & Advisory</p>
            </div>
          </button>

          <button
            onClick={() => onOpenCreate('custom-card')}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 truncate">
                Custom Card
              </p>
              <p className="text-[10px] text-slate-500">Blank Canvas</p>
            </div>
          </button>

          <button
            onClick={onOpenBulk}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all shadow-2xs flex items-center gap-3 cursor-pointer group col-span-2 sm:col-span-1"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 group-hover:text-blue-600 truncate">
                Bulk Generate
              </p>
              <p className="text-[10px] text-slate-500">CSV Spreadsheet</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Cards Section with Search & Filtering */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Recent Cards
            </h2>
            <p className="text-xs text-slate-500">
              Manage, preview, download, and duplicate your identification cards.
            </p>
          </div>

          <button
            onClick={onNavigateMyCards}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Cards ({cards.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by card name, person name, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">Status:</span>
              {['all', 'active', 'draft', 'expired'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize text-xs font-semibold transition-colors cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium text-[11px] shrink-0">Category:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'student', label: 'Student' },
              { id: 'employee', label: 'Employee' },
              { id: 'professional', label: 'Professional' },
              { id: 'membership', label: 'Membership' },
              { id: 'event', label: 'Event' },
              { id: 'custom', label: 'Custom' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.slice(0, 8).map((card) => (
              <CardCard
                key={card.id}
                card={card}
                onView={onViewCard}
                onEdit={onEditCard}
                onDuplicate={onDuplicateCard}
                onDownload={onDownloadCard}
                onDelete={onDeleteCard}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">No cards match your filter criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or filters, or create a brand new card.
            </p>
            <button
              onClick={() => onOpenCreate()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Card Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
