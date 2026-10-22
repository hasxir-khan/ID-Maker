import React, { useState } from 'react';
import {
  IdCard,
  Plus,
  ShieldCheck,
  LayoutDashboard,
  Sparkles,
  Layers,
  FileSpreadsheet,
  User,
  LogOut,
  Settings,
  Search,
  Menu,
  Palette,
} from 'lucide-react';
import { UserProfile } from '../../types/card';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenCreate: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  onOpenCreate,
  searchQuery = '',
  onSearchChange,
  onToggleSidebar,
  isSidebarCollapsed = false,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Hamburger + Logo & Brand */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Hamburger Button (shown when user is logged in or on app routes) */}
            {user && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title={isSidebarCollapsed ? 'Expand Sidebar (☰)' : 'Collapse Sidebar (☰)'}
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
              className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:bg-blue-600 transition-colors">
                <IdCard className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight font-heading">
                    ID Maker
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                    Pro
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Create Professional Cards. Perfectly.
                </p>
              </div>
            </button>

            {/* Desktop Navigation Links (shown if logged in) */}
            {user && (
              <nav className="hidden lg:flex items-center space-x-1 text-xs font-semibold text-slate-600 ml-4 border-l border-slate-200 pl-4">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentRoute === 'dashboard'
                      ? 'text-slate-900 bg-slate-100 font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate('my-cards')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentRoute === 'my-cards'
                      ? 'text-slate-900 bg-slate-100 font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  My Cards
                </button>
                <button
                  onClick={() => onNavigate('templates')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentRoute === 'templates'
                      ? 'text-slate-900 bg-slate-100 font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  Templates
                </button>
                <button
                  onClick={() => onNavigate('bulk')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentRoute === 'bulk'
                      ? 'text-slate-900 bg-slate-100 font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  Bulk
                </button>
                <button
                  onClick={() => onNavigate('verify')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentRoute === 'verify'
                      ? 'text-slate-900 bg-slate-100 font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Verify
                </button>
              </nav>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search on Dashboard */}
            {user && onSearchChange && (currentRoute === 'dashboard' || currentRoute === 'my-cards') && (
              <div className="relative hidden xl:block w-52">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                />
              </div>
            )}

            {/* Create Card Button */}
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all hover:shadow active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>+ Create Card</span>
            </button>

            {/* Auth / Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
                  title={user.name}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 hidden sm:inline max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono">
                        <span>Role: {user.role || 'Admin'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('dashboard')}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => onNavigate('my-cards')}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      My Cards Database
                    </button>
                    <button
                      onClick={() => onNavigate('brand-kit')}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Palette className="w-3.5 h-3.5 text-slate-400" />
                      Brand Kit Manager
                    </button>
                    <button
                      onClick={() => onNavigate('verify')}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      QR Verification Portal
                    </button>
                    <button
                      onClick={() => onNavigate('settings')}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Settings & Preferences
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={onLogout}
                      className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
