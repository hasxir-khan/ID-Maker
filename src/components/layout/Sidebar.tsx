import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  PlusCircle,
  FileSpreadsheet,
  Palette,
  ShieldCheck,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
} from 'lucide-react';
import { CardData } from '../../types/card';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  cards: CardData[];
  onOpenCreate: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  cards,
  onOpenCreate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const activeCount = cards.filter((c) => c.status === 'active').length;
  const draftCount = cards.filter((c) => c.status === 'draft').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Workspace summary & recent IDs',
    },
    {
      id: 'my-cards',
      label: 'My Cards',
      icon: Layers,
      badge: cards.length > 0 ? `${cards.length}` : null,
      description: 'Saved credentials database',
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: Sparkles,
      badge: '9 Pro',
      description: 'Pre-made industry layouts',
    },
    {
      id: 'bulk',
      label: 'Bulk Generator',
      icon: FileSpreadsheet,
      badge: 'CSV',
      description: 'Mass spreadsheet generation',
    },
    {
      id: 'brand-kit',
      label: 'Brand Kit',
      icon: Palette,
      badge: null,
      description: 'Logos, colors & signatures',
    },
    {
      id: 'verify',
      label: 'Verification',
      icon: ShieldCheck,
      badge: 'QR',
      description: 'Public QR credential validation',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
      description: 'Preferences & profile',
    },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 bg-white h-full shadow-2xl flex flex-col justify-between p-4 overflow-y-auto animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 font-heading text-base">
                    Navigation
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                    Menu
                  </span>
                </div>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Create Card Button */}
              <button
                onClick={() => {
                  onCloseMobile();
                  onOpenCreate();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-blue-400" />
                <span>+ Create New Card</span>
              </button>

              {/* Mobile Nav Links */}
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-blue-400' : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            isActive
                              ? 'bg-slate-800 text-blue-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Card Status */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    Card Status
                  </span>
                  <span className="text-slate-900 font-bold">{cards.length} Total</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                    <span className="text-slate-500 text-[10px] block">Active</span>
                    <span className="font-bold text-emerald-600 font-mono text-sm">{activeCount}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                    <span className="text-slate-500 text-[10px] block">Drafts</span>
                    <span className="font-bold text-amber-600 font-mono text-sm">{draftCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>CR80 Engine</span>
              <span className="font-mono">v2.4.0</span>
            </div>
          </div>
        </div>
      )}

      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`bg-white border-r border-slate-200 shrink-0 hidden md:flex flex-col justify-between transition-all duration-200 ease-in-out select-none min-h-[calc(100vh-4rem)] ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-3 space-y-4">
          {/* Create Button (Expanded vs Collapsed) */}
          {isCollapsed ? (
            <div className="flex justify-center">
              <button
                onClick={onOpenCreate}
                title="Create New Card"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer group"
              >
                <Plus className="w-5 h-5 text-blue-400 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenCreate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-blue-400" />
              <span>+ Create New Card</span>
            </button>
          )}

          {/* Navigation Links */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Workspace
              </p>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;

              if (isCollapsed) {
                return (
                  <div key={item.id} className="relative group flex justify-center">
                    <button
                      onClick={() => onNavigate(item.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      aria-label={item.label}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-blue-400' : 'text-slate-500'
                        }`}
                      />
                    </button>
                    {/* Tooltip on hover */}
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 z-50 bg-slate-900 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-xl pointer-events-none">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-blue-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive
                          ? 'bg-white text-slate-800 font-bold shadow-2xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Card Status Overview (Only in expanded view) */}
          {!isCollapsed && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  Card Status
                </span>
                <span className="text-slate-900 font-bold">{cards.length} Total</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                  <span className="text-slate-500 text-[10px]">Active</span>
                  <span className="font-bold text-emerald-600">{activeCount}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                  <span className="text-slate-500 text-[10px]">Drafts</span>
                  <span className="font-bold text-amber-600">{draftCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Collapse Toggle & System Footer */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* Toggle button */}
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            ) : (
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-slate-500 text-xs">Collapse Sidebar</span>
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </button>

          {!isCollapsed && (
            <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                CR80 Engine
              </span>
              <span className="font-mono text-[10px]">v2.4.0</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
