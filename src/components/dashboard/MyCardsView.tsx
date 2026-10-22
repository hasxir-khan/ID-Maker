import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  ArrowUpDown,
  CreditCard,
  Download,
  Trash2,
  Printer,
  CheckSquare,
  Square,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LayoutGrid,
  List,
  Eye,
  Edit3,
  Copy,
} from 'lucide-react';
import { CardData, normalizeCardForDashboard } from '../../types/card';
import { CardCard } from './CardCard';
import { CARD_TYPES } from '../../data/cardTypes';
import { storageService } from '../../services/storage';

interface MyCardsViewProps {
  cards: CardData[];
  onOpenCreate: () => void;
  onViewCard: (card: CardData) => void;
  onEditCard: (card: CardData) => void;
  onDuplicateCard: (card: CardData) => void;
  onDownloadCard: (card: CardData) => void;
  onDeleteCard: (card: CardData) => void;
  onOpenPrintSheet: (cards: CardData[]) => void;
  onBatchDeleteConfirm?: (cardIds: string[]) => void;
}

export const MyCardsView: React.FC<MyCardsViewProps> = ({
  cards,
  onOpenCreate,
  onViewCard,
  onEditCard,
  onDuplicateCard,
  onDownloadCard,
  onDeleteCard,
  onOpenPrintSheet,
  onBatchDeleteConfirm,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'recently-modified' | 'name' | 'expiry'
  >('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Multi-card selection state
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  // Defensive boundary normalization for cards
  const normalizedCards = useMemo(() => {
    if (!Array.isArray(cards)) return [];
    return cards.map((c) => normalizeCardForDashboard(c));
  }, [cards]);

  // Filter & Sort
  const filteredAndSortedCards = useMemo(() => {
    const q = (searchQuery ?? '').toString().toLowerCase().trim();
    const selCat = (selectedCategory ?? 'all').toString().toLowerCase().trim();
    const selStat = (selectedStatus ?? 'all').toString().toLowerCase().trim();

    return normalizedCards
      .filter((card) => {
        if (!card) return false;
        const cardType = CARD_TYPES.find((t) => t.id === card.cardTypeId);

        const nameStr = (card.name ?? '').toString().toLowerCase();
        const personStr = (card.personName ?? '').toString().toLowerCase();
        const idStr = (card.id ?? '').toString().toLowerCase();
        const typeName = (cardType?.name ?? '').toString().toLowerCase();

        const matchesSearch =
          !q ||
          nameStr.includes(q) ||
          personStr.includes(q) ||
          idStr.includes(q) ||
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
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
        }
        if (sortBy === 'recently-modified') {
          return new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime();
        }
        if (sortBy === 'name') {
          const aName = a.personName ?? '';
          const bName = b.personName ?? '';
          return aName.localeCompare(bName);
        }
        if (sortBy === 'expiry') {
          return new Date(a.expiryDate || '').getTime() - new Date(b.expiryDate || '').getTime();
        }
        return 0;
      });
  }, [normalizedCards, searchQuery, selectedCategory, selectedStatus, sortBy]);

  const toggleSelectCard = (id: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCardIds.length === filteredAndSortedCards.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(filteredAndSortedCards.map((c) => c.id));
    }
  };

  const handleBatchDeleteClick = () => {
    if (onBatchDeleteConfirm) {
      onBatchDeleteConfirm(selectedCardIds);
    } else {
      storageService.deleteMultipleCards(selectedCardIds);
      setSelectedCardIds([]);
    }
  };

  const handleBatchStatusUpdate = (status: 'active' | 'draft' | 'expired') => {
    storageService.updateMultipleCardsStatus(selectedCardIds, status);
    setSelectedCardIds([]);
  };

  const handleBatchPrintSheet = () => {
    const selectedCards = cards.filter((c) => selectedCardIds.includes(c.id));
    if (selectedCards.length > 0) {
      onOpenPrintSheet(selectedCards);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
            Card Database
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            My Cards Collection ({cards.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every identification card and credential created in this workspace.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {cards.length > 0 && (
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedCardIds([]);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isSelectionMode
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {isSelectionMode ? 'Cancel Selection' : 'Batch Select'}
            </button>
          )}

          {cards.length > 0 && (
            <button
              onClick={() => onOpenPrintSheet(cards)}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Sheet</span>
            </button>
          )}

          <button
            onClick={onOpenCreate}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>+ Create Card</span>
          </button>
        </div>
      </div>

      {/* Batch Actions Bar (when cards are selected) */}
      {selectedCardIds.length > 0 && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold bg-blue-600 px-2.5 py-1 rounded-lg">
              {selectedCardIds.length} Selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-slate-300 hover:text-white underline cursor-pointer"
            >
              {selectedCardIds.length === filteredAndSortedCards.length
                ? 'Deselect All'
                : 'Select All in View'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchPrintSheet}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={() => handleBatchStatusUpdate('active')}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Set Active</span>
            </button>

            <button
              onClick={() => handleBatchStatusUpdate('draft')}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Set Draft</span>
            </button>

            <button
              onClick={handleBatchDeleteClick}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Search, Filter & Sort Toolbar */}
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

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer text-xs"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="recently-modified">Recently Modified</option>
                <option value="name">Name (A-Z)</option>
                <option value="expiry">Expiry Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category & Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-slate-400 font-medium text-[11px]">Type:</span>
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
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px]">Status:</span>
            {['all', 'active', 'draft', 'expired'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2 py-1 rounded-lg capitalize text-xs font-semibold transition-colors cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards List: Grid or Table Mode */}
      {filteredAndSortedCards.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedCards.map((card) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <div key={card.id} className="relative">
                  {isSelectionMode && (
                    <div
                      onClick={() => toggleSelectCard(card.id)}
                      className="absolute top-2.5 left-2.5 z-20 cursor-pointer bg-white/90 p-1 rounded-md shadow-sm border border-slate-200"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  )}
                  <div className={isSelected ? 'ring-2 ring-blue-600 rounded-xl' : ''}>
                    <CardCard
                      card={card}
                      onView={onViewCard}
                      onEdit={onEditCard}
                      onDuplicate={onDuplicateCard}
                      onDownload={onDownloadCard}
                      onDelete={onDeleteCard}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    {isSelectionMode && <th className="p-3.5 w-10 text-center">Sel</th>}
                    <th className="p-3.5">Card ID & Name</th>
                    <th className="p-3.5">Holder Name</th>
                    <th className="p-3.5">Type & Org</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedCards.map((card) => {
                    const isSelected = selectedCardIds.includes(card.id);
                    const cardType = CARD_TYPES.find((t) => t.id === card.cardTypeId);
                    return (
                      <tr
                        key={card.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        {isSelectionMode && (
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectCard(card.id)}
                              className="rounded border-slate-300 text-blue-600 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-mono text-[10px] shrink-0">
                              {card.photoUrl ? (
                                <img
                                  src={card.photoUrl}
                                  alt=""
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                'ID'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p
                                onClick={() => onViewCard(card)}
                                className="font-bold text-slate-900 truncate hover:text-blue-600 cursor-pointer"
                              >
                                {card.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {card.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">
                          {card.personName}
                        </td>
                        <td className="p-3.5">
                          <p className="text-slate-800 font-medium">
                            {cardType?.name || 'Standard Card'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {card.organizationName ||
                              (card as any)?.organization ||
                              card.fieldValues?.['institutionName'] ||
                              'N/A'}
                          </p>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              card.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : card.status === 'draft'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {card.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {card.expiryDate || 'None'}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onViewCard(card)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditCard(card)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDuplicateCard(card)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDownloadCard(card)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteCard(card)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                              title="Delete Card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No cards found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first card using structured templates or start from scratch.
          </p>
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Card Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
