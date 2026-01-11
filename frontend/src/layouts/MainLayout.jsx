import { useState, useEffect } from 'react';

function MainLayout({ children, currentPage = 'dashboard' }) {
  // Sur mobile, la sidebar est fermée par défaut. Sur desktop, elle est ouverte
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Gérer le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Sur desktop, garder la sidebar ouverte
      if (!mobile) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white relative">
      {/* Bouton toggle pour mobile - TOUJOURS VISIBLE */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        aria-label="Basculer le menu"
      >
        {sidebarOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Overlay pour mobile quand la sidebar est ouverte */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Blanc avec texte noir */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 bg-white text-gray-900 flex flex-col border-r border-gray-200 transition-all duration-300 overflow-hidden ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0'
        } lg:translate-x-0 lg:sticky lg:top-0 lg:w-64 lg:h-screen lg:z-auto`}
      >
        {/* Logo */}
        <div className="p-4 sm:p-6 lg:px-8 lg:py-0 h-16 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-lg sm:text-xl font-bold tracking-wide text-gray-900 flex-1">OPJ Capture</h1>
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

          {/* ADMINISTRATION Section */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full lg:w-auto overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 fixed top-0 right-0 left-0 lg:left-64 z-40 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-0 h-16 flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Basculer le menu"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {sidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 flex-1 overflow-hidden">
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">
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
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 mt-16">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
