import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import AddUserModal from '../components/AddUserModal';
import Swal from 'sweetalert2';
import { getApiUrl } from '../api/config';

function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [stats, setStats] = useState(null);

  // Charger le rôle et les données au montage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
    
    if (user.role === 'ROLE_OPJ') {
      loadOPJStats();
    } else if (user.role === 'ROLE_ADMIN') {
      loadUsers();
    } else if (user.role === 'ROLE_SUPERVISEUR') {
      loadSuperviseurStats();
    }
  }, []);

  const loadOPJStats = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Charger les captures de l'officier
      const capturesResponse = await fetch(getApiUrl('/api/captures'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (capturesResponse.ok) {
        const captures = await capturesResponse.json();
        // Filtrer les captures de l'officier actuel
        // Les captures utilisent opj.id, pas createdBy.id
        const myCaptures = captures.filter(c => c.opj?.id === user.id);
        const validatedCaptures = myCaptures.filter(c => c.status === 'validated');
        
        console.log('User ID:', user.id);
        console.log('Captures totales:', captures.length);
        console.log('Mes captures:', myCaptures.length);
        console.log('Captures validées:', validatedCaptures.length);
        
        setStats({
          totalCaptures: myCaptures.length,
          validatedCaptures: validatedCaptures.length,
          pendingCaptures: myCaptures.length - validatedCaptures.length,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuperviseurStats = async () => {
    try {
      setLoading(true);
      
      // Charger les captures pour le superviseur
      const capturesResponse = await fetch(getApiUrl('/api/captures'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (capturesResponse.ok) {
        const captures = await capturesResponse.json();
        console.log('Toutes les captures:', captures);
        console.log('Status des captures:', captures.map(c => ({ id: c.id, status: c.status })));
        
        // Utiliser les valeurs correctes : EN_ATTENTE, VALIDEE, REJETEE
        const pendingValidation = captures.filter(c => c.status === 'EN_ATTENTE');
        const validatedCount = captures.filter(c => c.status === 'VALIDEE');
        const rejectedCount = captures.filter(c => c.status === 'REJETEE');
        
        console.log('Captures validées trouvées:', validatedCount);
        console.log('Nombre de captures validées:', validatedCount.length);
        
        setStats({
          totalCaptures: captures.length,
          pendingValidation: pendingValidation.length,
          validatedCaptures: validatedCount.length,
          rejectedCaptures: rejectedCount.length,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats superviseur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/users'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Transformer les données pour correspondre au format attendu
        const formattedUsers = data.map((user) => ({
          id: user.id,
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          matricule: user.matricule,
          role: user.role,
          status: user.isActive ? 'Actif' : 'Inactif',
          joined: user.createdAt || new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        }));
        setUsers(formattedUsers);
      } else {
        // Si erreur 401, rediriger vers le login
        if (response.status === 401) {
          Swal.fire({
            icon: 'warning',
            title: 'Session expirée',
            text: 'Votre session a expiré. Veuillez vous reconnecter.',
            confirmButtonColor: '#111827',
          }).then(() => {
            localStorage.removeItem('user');
            window.location.href = '/';
          });
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les utilisateurs',
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur de connexion au serveur',
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (prenom, nom) => {
    return `${prenom[0]}${nom[0]}`.toUpperCase();
  };

  const getRoleLabel = (role) => {
    const roles = {
      'ROLE_ADMIN': 'Administrateur',
      'ROLE_SUPERVISEUR': 'Superviseur',
      'ROLE_OPJ': 'Officier',
    };
    return roles[role] || 'Utilisateur';
  };

  const handleAddUser = () => {
    // Recharger la liste des utilisateurs après ajout
    loadUsers();
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.matricule && user.matricule.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <MainLayout currentPage="dashboard">
      <div>
        {userRole === 'ROLE_OPJ' ? (
          // Dashboard pour Officier
          <>
            <div className="mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Tableau de bord personnel</h1>
              <p className="text-gray-600">Vue d'ensemble de vos captures et activités</p>
            </div>

            {/* Stats Cards */}
            {loading ? (
              <div className="text-center py-12 text-gray-500">Chargement...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Total Captures Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total de captures</p>
                      <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">{stats?.totalCaptures || 0}</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Validated Captures Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Captures validées</p>
                      <p className="text-3xl sm:text-4xl font-bold text-green-600 mt-2">{stats?.validatedCaptures || 0}</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Pending Captures Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">En attente de validation</p>
                      <p className="text-3xl sm:text-4xl font-bold text-orange-600 mt-2">{stats?.pendingCaptures || 0}</p>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="#/captures"
                  className="px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Mes captures
                </a>
                <a
                  href="#/bandits"
                  className="px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Mes bandits
                </a>
              </div>
            </div>
          </>
        ) : userRole === 'ROLE_SUPERVISEUR' ? (
          // Dashboard pour Superviseur - Validation et Statistiques
          <>
            <div className="mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Tableau de bord Superviseur</h1>
              <p className="text-gray-600">Suivi et validation des captures</p>
            </div>

            {/* Stats Cards */}
            {loading ? (
              <div className="text-center py-12 text-gray-500">Chargement...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {/* Total Captures Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total captures</p>
                      <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">{stats?.totalCaptures || 0}</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Pending Validation Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">En attente</p>
                      <p className="text-3xl sm:text-4xl font-bold text-orange-600 mt-2">{stats?.pendingValidation || 0}</p>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-3">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Validated Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Validées</p>
                      <p className="text-3xl sm:text-4xl font-bold text-green-600 mt-2">{stats?.validatedCaptures || 0}</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Rejected Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Rejetées</p>
                      <p className="text-3xl sm:text-4xl font-bold text-red-600 mt-2">{stats?.rejectedCaptures || 0}</p>
                    </div>
                    <div className="bg-red-100 rounded-lg p-3">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="#/captures"
                  className="px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Valider les captures
                </a>
                <a
                  href="#/infractions"
                  className="px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Infractions proposées
                </a>
              </div>
            </div>
          </>
        ) : (
          // Dashboard pour Admin - Gestion utilisateurs
          <>
            {/* Title and Action Section */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Utilisateurs</h1>
                  <p className="text-sm sm:text-base text-gray-600">Gérer les comptes utilisateurs, les rôles et les permissions.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gray-900 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Ajouter un utilisateur</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher des utilisateurs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  />
                </div>

                {/* Role Filter */}
                <div className="relative sm:w-auto w-full">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm text-gray-900 w-full"
                  >
                    <option value="all">Rôle : Tous</option>
                    <option value="ROLE_ADMIN">Administrateur</option>
                    <option value="ROLE_SUPERVISEUR">Superviseur</option>
                    <option value="ROLE_OPJ">Officier</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative sm:w-auto w-full">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm text-gray-900 w-full"
                  >
                    <option value="all">Statut : Tous</option>
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                      Matricule
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rôles
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                      Statut
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                      Inscrit le
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0">
                              {getInitials(user.prenom, user.nom)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {user.prenom} {user.nom}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</div>
                              <div className="text-xs text-gray-500 md:hidden">{user.matricule || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <span className="text-sm text-gray-900 font-medium">{user.matricule || '-'}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="text-xs sm:text-sm text-gray-900">{getRoleLabel(user.role)}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {user.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                          {user.joined}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Modifier">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Désactiver">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                              </svg>
                            </button>
                            <button className="text-gray-400 hover:text-red-600 transition-colors" title="Supprimer">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
            </div>

            {/* Modal */}
            <AddUserModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onAddUser={handleAddUser}
            />
          </>
        )}
      </div>

      {/* Modal for OPJ */}
      {userRole === 'ROLE_OPJ' && (
        <AddUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddUser={handleAddUser}
        />
      )}
    </MainLayout>
  );
}

export default Dashboard;
