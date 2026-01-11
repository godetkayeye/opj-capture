import { useState } from 'react';

function MainLayout({ children, currentPage = 'dashboard' }) {
  // Sur desktop, la sidebar est toujours ouverte. Sur mobile, elle est fermée par défaut
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', section: 'MENU' },
    { id: 'profile', label: 'Mon profil', section: 'MENU' },
  ];

  const adminItems = [
    { id: 'bandits', label: 'Bandits', section: 'ADMINISTRATION' },
    { id: 'captures', label: 'Captures', section: 'ADMINISTRATION' },
    { id: 'validations', label: 'Validations', section: 'ADMINISTRATION' },
    { id: 'infractions', label: 'Infractions', section: 'ADMINISTRATION' },
  ];

  // Items visibles pour Superviseur
  const superviseurItems = [
    { id: 'suivi', label: 'Suivi des captures', section: 'SUIVI' },
    { id: 'infractions', label: 'Infractions', section: 'SUIVI' },
  ];

  // Items visibles pour OPJ (officier)
  const opjItems = [
    { id: 'bandits', label: 'Bandits', section: 'CONSULTATION' },
    { id: 'captures', label: 'Captures', section: 'CONSULTATION' },
    { id: 'infractions', label: 'Infractions', section: 'CONSULTATION' },
  ];

  // Déterminer les items à afficher selon le rôle
  const isAdmin = user.role === 'ROLE_ADMIN';
  const isSuperviseur = user.role === 'ROLE_SUPERVISEUR';
  const isOPJ = user.role === 'ROLE_OPJ';
  const itemsToDisplay = isAdmin ? adminItems : isSuperviseur ? superviseurItems : isOPJ ? opjItems : [];

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const getUserInitials = () => {
    if (user.prenom && user.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getRoleLabel = (role) => {
    const roles = {
      'ROLE_ADMIN': 'Administrateur',
      'ROLE_SUPERVISEUR': 'Superviseur',
      'ROLE_OPJ': 'Officier',
    };
    return roles[role] || 'Utilisateur';
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar - Blanc avec texte noir */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-white text-gray-900 flex flex-col border-r border-gray-200 transition-all duration-300 fixed lg:static inset-y-0 left-0 z-40 lg:z-auto lg:w-64 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } overflow-hidden lg:overflow-visible`}
      >
        {/* Logo */}
        <div className="px-4 sm:px-6 py-6 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen ? (
            <h1 className="text-lg sm:text-xl font-bold tracking-wide text-gray-900 flex-1">OPJ Capture</h1>
          ) : (
            <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">OC</span>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(false);
              }}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors flex-shrink-0 lg:hidden"
              aria-label="Fermer le menu"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4">
          {/* MENU Section */}
          <div className="mb-4 sm:mb-6">
            {sidebarOpen && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                MENU
              </p>
            )}
            <div className="space-y-1">
              {menuItems.map((item) => (
                <a
                  key={item.id}
                  href={`#/${item.id}`}
                  onClick={() => {
                    // Fermer la sidebar sur mobile après avoir cliqué sur un lien
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.id === 'dashboard' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    )}
                    {item.id === 'profile' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                  </svg>
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </a>
              ))}
            </div>
          </div>

          {/* ADMINISTRATION Section (Admin uniquement) */}
          {isAdmin && (
            <div>
              {sidebarOpen && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                  ADMINISTRATION
                </p>
              )}
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#/${item.id}`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      currentPage === item.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.id === 'bandits' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      )}
                      {item.id === 'captures' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      )}
                      {item.id === 'validations' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                      {item.id === 'infractions' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      )}
                    </svg>
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* SUIVI Section (Superviseur uniquement) */}
          {isSuperviseur && (
            <div>
              {sidebarOpen && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                  SUIVI
                </p>
              )}
              <div className="space-y-1">
                {superviseurItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#/${item.id}`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      currentPage === item.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.id === 'suivi' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      )}
                      {item.id === 'captures' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                      {item.id === 'infractions' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      )}
                    </svg>
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* CONSULTATION Section (OPJ uniquement) */}
          {isOPJ && (
            <div>
              {sidebarOpen && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                  CONSULTATION
                </p>
              )}
              <div className="space-y-1">
                {opjItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#/${item.id}`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      currentPage === item.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.id === 'bandits' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      )}
                      {item.id === 'captures' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      )}
                      {item.id === 'infractions' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      )}
                    </svg>
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </a>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User info & Logout */}
        <div className="p-3 sm:p-4 border-t border-gray-200">
          {sidebarOpen && (
            <div className="mb-3 sm:mb-4">
              <p className="text-xs text-gray-500 mb-1">Connecté en tant que</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user.email || 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {getRoleLabel(user.role)}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(false);
          }}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white w-full lg:w-auto">
        {/* Top Header - Blanc avec texte noir */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Menu button pour mobile */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
              className="lg:hidden p-2 rounded hover:bg-gray-100 transition-colors z-50 relative"
              aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 flex-1 min-w-0">
              <span className="hidden sm:inline">Tableau de bord</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-gray-900 font-medium truncate">
                {menuItems.find((item) => item.id === currentPage)?.label ||
                  adminItems.find((item) => item.id === currentPage)?.label ||
                  'Tableau de bord'}
              </span>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-xs sm:text-sm">
                  {getUserInitials()}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Déconnexion"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
