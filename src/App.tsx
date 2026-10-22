import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { MyCardsView } from './components/dashboard/MyCardsView';
import { CardPreviewModal } from './components/dashboard/CardPreviewModal';
import { CardTypeSelector } from './components/create/CardTypeSelector';
import { DynamicCardForm } from './components/create/DynamicCardForm';
import { CardEditor } from './components/editor/CardEditor';
import { TemplateSelector } from './components/templates/TemplateSelector';
import { BulkGenerator } from './components/bulk/BulkGenerator';
import { BrandKitManager } from './components/brand/BrandKitManager';
import { VerificationView } from './components/verify/VerificationView';
import { SettingsView } from './components/settings/SettingsView';
import { PrintSheetModal } from './components/export/PrintSheetModal';
import { ConfirmDeleteModal } from './components/common/ConfirmDeleteModal';

import { CardData, CardTypeDefinition, CardTemplate, UserProfile, BrandKit } from './types/card';
import { storageService } from './services/storage';
import { testConnection } from './services/firebase';
import { CARD_TYPES } from './data/cardTypes';
import { parseVerificationUrl } from './services/verificationUrl';

export default function App() {
  // State from real Firestore and Firebase Auth subscriptions
  const [user, setUser] = useState<UserProfile | null>(() => storageService.getUser());
  const [cards, setCards] = useState<CardData[]>([]);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);

  // Routing with deep-link support for both /verify/:id and /#verify/:id
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const parsedId = parseVerificationUrl(window.location.pathname + window.location.hash);
      if (parsedId) return 'verify';
    }
    return storageService.getUser() ? 'dashboard' : 'landing';
  });

  const [verifyCardId, setVerifyCardId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const parsedId = parseVerificationUrl(window.location.pathname + window.location.hash);
      if (parsedId) return parsedId;
    }
    return 'IDM-2026-0001';
  });

  // Sidebar Collapse state & persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('idmaker_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        if (typeof window !== 'undefined') {
          localStorage.setItem('idmaker_sidebar_collapsed', String(next));
        }
        return next;
      });
    }
  };

  // Creation & Editing flow state
  const [selectedCardType, setSelectedCardType] = useState<CardTypeDefinition>(CARD_TYPES[0]);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  const [printSheetCards, setPrintSheetCards] = useState<CardData[]>([]);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(!storageService.isAuthReady());

  // Delete Confirmation Modal State
  const [cardToDelete, setCardToDelete] = useState<CardData | null>(null);
  const [batchIdsToDelete, setBatchIdsToDelete] = useState<string[] | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Global search
  const [searchQuery, setSearchQuery] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Test Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Subscribe to live Firebase Auth state and loading lifecycle
  useEffect(() => {
    const unsubLoading = storageService.subscribeAuthLoading((loading) => {
      setIsAuthLoading(loading);
    });

    const unsubAuth = storageService.subscribeAuth((fbUser) => {
      setUser(fbUser);
      // Route guard: if logged out while on protected route, send to landing
      if (!fbUser && storageService.isAuthReady()) {
        setCurrentRoute((prev) => (prev === 'verify' || prev === 'templates' ? prev : 'landing'));
      }
    });

    const unsubCards = storageService.subscribeCards((userCards) => {
      setCards(userCards);
    });

    const unsubBrandKits = storageService.subscribeBrandKits((userKits) => {
      setBrandKits(userKits);
    });

    return () => {
      unsubLoading();
      unsubAuth();
      unsubCards();
      unsubBrandKits();
    };
  }, []);

  // Listen to hash and URL popstate changes (for QR code scan redirection and direct links)
  useEffect(() => {
    const handleUrlChange = () => {
      const parsedId = parseVerificationUrl(window.location.pathname + window.location.hash);
      if (parsedId) {
        setVerifyCardId(parsedId);
        setCurrentRoute('verify');
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Navigation handlers with auth guard
  const handleNavigate = (route: string) => {
    const protectedRoutes = [
      'dashboard',
      'my-cards',
      'create-type-select',
      'create-form',
      'editor',
      'bulk',
      'brand-kit',
      'settings',
    ];

    if (protectedRoutes.includes(route) && !user) {
      setIsAuthModalOpen(true);
      return;
    }

    setCurrentRoute(route);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartCreate = (presetCardTypeId?: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (presetCardTypeId) {
      const targetType = CARD_TYPES.find((t) => t.id === presetCardTypeId) || CARD_TYPES[0];
      setSelectedCardType(targetType);
      setEditingCard(null);
      setCurrentRoute('create-form');
    } else {
      setEditingCard(null);
      setCurrentRoute('create-type-select');
    }
  };

  const handleSelectCardType = (type: CardTypeDefinition) => {
    setSelectedCardType(type);
    setEditingCard(null);
    setCurrentRoute('create-form');
  };

  const handleProceedToEditor = (cardData: CardData) => {
    setEditingCard(cardData);
    setCurrentRoute('editor');
  };

  const handleEditCardFromDashboard = (card: CardData) => {
    setEditingCard(card);
    setCurrentRoute('editor');
  };

  const handleDuplicateCard = async (card: CardData) => {
    try {
      const duplicated = await storageService.duplicateCard(card.id);
      if (duplicated) {
        showToast(`Duplicated "${card.name}" as ${duplicated.id}`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to duplicate card');
    }
  };

  // Trigger Delete Confirmation Modal for Single Card
  const handleDeleteCard = (card: CardData) => {
    setCardToDelete(card);
    setBatchIdsToDelete(null);
    setIsDeleteModalOpen(true);
  };

  // Trigger Delete Confirmation Modal for Batch Deletion
  const handleBatchDelete = (cardIds: string[]) => {
    if (!cardIds || cardIds.length === 0) return;
    setCardToDelete(null);
    setBatchIdsToDelete(cardIds);
    setIsDeleteModalOpen(true);
  };

  // Real Firestore Delete Execution
  const handleConfirmDelete = async (target: CardData | string[]) => {
    if (Array.isArray(target)) {
      const count = await storageService.deleteMultipleCards(target);
      showToast(`Permanently deleted ${count} cards from database.`);
    } else if (target && target.id) {
      await storageService.deleteCard(target.id);
      showToast(`Permanently deleted "${target.name}" (${target.id}).`);
    }
  };

  const handleDownloadCardDirect = (card: CardData) => {
    setPreviewCard(card);
  };

  const handleSelectTemplateFromCatalog = (template: CardTemplate) => {
    const matchingType =
      CARD_TYPES.find((t) => t.defaultTemplateId === template.id) ||
      CARD_TYPES.find((t) => t.category === template.category) ||
      CARD_TYPES[0];

    setSelectedCardType(matchingType);
    setEditingCard({
      id: storageService.generateNextCardId(),
      cardTypeId: matchingType.id,
      templateId: template.id,
      name: `${matchingType.name} — ${template.name}`,
      personName: '',
      organizationName: '',
      orientation: template.defaultOrientation,
      dimensions: template.dimensions || matchingType.suggestedDimensions,
      fieldValues: {},
      elementsFront: template.elementsFront || [],
      elementsBack: template.elementsBack || [],
      elements: [...(template.elementsFront || []), ...(template.elementsBack || [])],
      status: 'draft',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '2028-10-06',
      qrConfig: { enabled: true, embeddedVerificationUrl: true, showOnFront: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setCurrentRoute('create-form');
    }
  };

  const handleOpenPrintSheet = (cardsToPrint: CardData[]) => {
    setPrintSheetCards(cardsToPrint);
    setIsPrintSheetOpen(true);
  };

  const handleLogout = async () => {
    await storageService.logoutUser();
    setUser(null);
    setCurrentRoute('landing');
    showToast('Signed out successfully.');
  };

  // If in Editor full-screen studio mode, render editor without wrapper chrome
  if (currentRoute === 'editor' && editingCard) {
    return (
      <CardEditor
        initialCard={editingCard}
        onBack={() => handleNavigate('dashboard')}
        onSaveSuccess={(saved) => {
          showToast(`Saved "${saved.name}" successfully to database!`);
          setEditingCard(saved);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-500/20 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenCreate={() => handleStartCreate()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex">
        {/* Sidebar (shown on authenticated workspace routes) */}
        {user && currentRoute !== 'landing' && (
          <Sidebar
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
            cards={cards}
            onOpenCreate={() => handleStartCreate()}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Content View Routing */}
        <main className="flex-1 min-w-0 transition-all duration-200 ease-in-out">
          {isAuthLoading && currentRoute !== 'verify' && currentRoute !== 'templates' ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-800">Connecting to secure workspace...</p>
              <p className="text-xs text-slate-500">Restoring your session and cards</p>
            </div>
          ) : (
            <>
              {currentRoute === 'landing' && (
                <LandingPage
                  onStartCreating={() => {
                    if (!user) {
                      setIsAuthModalOpen(true);
                    } else {
                      handleStartCreate();
                    }
                  }}
                  onExploreTemplates={() => handleNavigate('templates')}
                />
              )}

              {currentRoute === 'dashboard' && user && (
                <DashboardHome
                  user={user}
                  cards={cards}
                  onOpenCreate={handleStartCreate}
                  onOpenBulk={() => handleNavigate('bulk')}
                  onViewCard={(card) => setPreviewCard(card)}
                  onEditCard={handleEditCardFromDashboard}
                  onDuplicateCard={handleDuplicateCard}
                  onDownloadCard={handleDownloadCardDirect}
                  onDeleteCard={handleDeleteCard}
                  onNavigateMyCards={() => handleNavigate('my-cards')}
                />
              )}

          {currentRoute === 'my-cards' && user && (
            <MyCardsView
              cards={cards}
              onOpenCreate={() => handleStartCreate()}
              onViewCard={(card) => setPreviewCard(card)}
              onEditCard={handleEditCardFromDashboard}
              onDuplicateCard={handleDuplicateCard}
              onDownloadCard={handleDownloadCardDirect}
              onDeleteCard={handleDeleteCard}
              onOpenPrintSheet={handleOpenPrintSheet}
              onBatchDeleteConfirm={handleBatchDelete}
            />
          )}

          {currentRoute === 'create-type-select' && (
            <CardTypeSelector
              onSelectType={handleSelectCardType}
              onCancel={() => handleNavigate('dashboard')}
            />
          )}

          {currentRoute === 'create-form' && (
            <DynamicCardForm
              cardType={selectedCardType}
              initialCard={editingCard || undefined}
              onBack={() => handleNavigate('create-type-select')}
              onProceedToEditor={handleProceedToEditor}
              brandKits={brandKits}
            />
          )}

          {currentRoute === 'templates' && (
            <TemplateSelector
              onSelectTemplate={handleSelectTemplateFromCatalog}
              onBack={() => handleNavigate(user ? 'dashboard' : 'landing')}
            />
          )}

          {currentRoute === 'bulk' && user && (
            <BulkGenerator
              onBack={() => handleNavigate('dashboard')}
              onGenerationComplete={(created) => {
                showToast(`Generated and saved ${created.length} cards to database!`);
                handleNavigate('my-cards');
              }}
            />
          )}

          {currentRoute === 'brand-kit' && user && (
            <BrandKitManager
              brandKits={brandKits}
              onBack={() => handleNavigate('dashboard')}
              onRefresh={() => {}}
            />
          )}

          {currentRoute === 'verify' && (
            <VerificationView
              initialCardId={verifyCardId}
              onBack={() => handleNavigate(user ? 'dashboard' : 'landing')}
            />
          )}

          {currentRoute === 'settings' && user && (
            <SettingsView
              user={user}
              onBack={() => handleNavigate('dashboard')}
              onUpdateUser={(updated) => setUser(updated)}
            />
          )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          showToast(`Welcome, ${loggedUser.name}!`);
          handleNavigate('dashboard');
        }}
      />

      <CardPreviewModal
        card={previewCard}
        isOpen={previewCard !== null}
        onClose={() => setPreviewCard(null)}
        onEdit={(card) => {
          setPreviewCard(null);
          handleEditCardFromDashboard(card);
        }}
        onDuplicate={(card) => {
          handleDuplicateCard(card);
          setPreviewCard(null);
        }}
        onOpenPrintSheet={handleOpenPrintSheet}
      />

      <PrintSheetModal
        cards={printSheetCards.length > 0 ? printSheetCards : cards}
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
      />

      {/* Real Confirmation Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCardToDelete(null);
          setBatchIdsToDelete(null);
        }}
        card={cardToDelete}
        cardIds={batchIdsToDelete || undefined}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
