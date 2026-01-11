import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import AddBanditModal from '../components/AddBanditModal';
import EditBanditModal from '../components/EditBanditModal';
import Swal from 'sweetalert2';
import { getApiUrl } from '../api/config';

function Bandits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [etatFilter, setEtatFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBandit, setSelectedBandit] = useState(null);
  const [bandits, setBandits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  // Charger les bandits depuis l'API
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
    setUserId(user.id);
    loadBandits();
  }, []);

  const loadBandits = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/bandits'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Transformer les dates
        const formattedBandits = data.map((bandit) => ({
          ...bandit,
          dateNaissance: bandit.dateNaissance
            ? new Date(bandit.dateNaissance).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '-',
        }));
        
        // Si OPJ, filtrer pour voir uniquement ses bandits + les bandits liés à ses captures
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'ROLE_OPJ') {
          console.log('User ID OPJ:', user.id);
          console.log('Bandits reçus:', formattedBandits);
          const myBandits = formattedBandits.filter(b => {
            console.log('Bandit:', b);
            console.log('createdBy:', b.createdBy);
            // Vérifier si createdBy est un objet ou un ID
            const createdById = typeof b.createdBy === 'object' ? b.createdBy?.id : b.createdBy;
            const isMyBandit = createdById === user.id;
            console.log(`Bandit ${b.id}: createdById=${createdById}, user.id=${user.id}, isMyBandit=${isMyBandit}`);
            return isMyBandit;
          });
          setBandits(myBandits);
        } else {
          setBandits(formattedBandits);
        }
      } else {
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
          text: 'Impossible de charger les bandits',
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bandits:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur de connexion au serveur',
        confirmButtonColor: '#111827',
      });
    } finally {
      setLoading(false);
    }
  };

  const getEtatLabel = (etat) => {
    const etats = {
      CAPTURE: 'Capturé',
      TRANSFERE: 'Transféré',
      LIBERE: 'Libéré',
    };
    return etats[etat] || etat;
  };

  const getEtatBadgeColor = (etat) => {
    const colors = {
      CAPTURE: 'bg-yellow-100 text-yellow-800',
      TRANSFERE: 'bg-blue-100 text-blue-800',
      LIBERE: 'bg-green-100 text-green-800',
    };
    return colors[etat] || 'bg-gray-100 text-gray-800';
  };

  const getSexeLabel = (sexe) => {
    return sexe === 'M' ? 'Masculin' : 'Féminin';
  };

  const handleAddBandit = () => {
    loadBandits();
  };

  const handleEditBandit = (bandit) => {
    setSelectedBandit(bandit);
    setIsEditModalOpen(true);
  };

  const handleUpdateBandit = () => {
    loadBandits();
  };

  const filteredBandits = bandits.filter((bandit) => {
    const matchesSearch =
      bandit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bandit.surnom && bandit.surnom.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEtat = etatFilter === 'all' || bandit.etat === etatFilter;
    return matchesSearch && matchesEtat;
  });

  return (
    <MainLayout currentPage="bandits">
      <div>
        {/* Title and Action Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Bandits</h1>
              <p className="text-sm sm:text-base text-gray-600">Gérer les bandits enregistrés dans le système.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-900 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Ajouter un bandit</span>
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
                placeholder="Rechercher des bandits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
              />
            </div>

            {/* État Filter */}
            <div className="relative sm:w-auto w-full">
              <select
                value={etatFilter}
                onChange={(e) => setEtatFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm text-gray-900 w-full"
              >
                <option value="all">État : Tous</option>
                <option value="CAPTURE">Capturé</option>
                <option value="TRANSFERE">Transféré</option>
                <option value="LIBERE">Libéré</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bandits Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Surnom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date de naissance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Sexe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      État
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Infractions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Enregistré le
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBandits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        Aucun bandit trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredBandits.map((bandit) => (
                      <tr key={bandit.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {bandit.photo ? (
                            <div className="relative group">
                              <img
                                src={bandit.photo}
                                alt={`${bandit.nom} ${bandit.surnom || ''}`}
                                className="w-12 h-12 object-cover rounded-full border-2 border-gray-200 cursor-pointer hover:border-gray-400 transition-colors"
                                onClick={() => {
                                  Swal.fire({
                                    imageUrl: bandit.photo,
                                    imageAlt: `${bandit.nom} ${bandit.surnom || ''}`,
                                    showConfirmButton: false,
                                    showCloseButton: true,
                                    width: 'auto',
                                    padding: '0',
                                    background: 'transparent',
                                    backdrop: 'rgba(0,0,0,0.8)',
                                  });
                                }}
                                title="Cliquez pour agrandir"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{bandit.nom}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{bandit.surnom || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bandit.dateNaissance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{getSexeLabel(bandit.sexe)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getEtatBadgeColor(bandit.etat)}`}>
                            {getEtatLabel(bandit.etat)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {bandit.infractions && bandit.infractions.length > 0 ? (
                              bandit.infractions.slice(0, 2).map((infraction) => (
                                <span
                                  key={infraction.id}
                                  className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {infraction.libelle}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                            {bandit.infractions && bandit.infractions.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{bandit.infractions.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bandit.createdAt || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {/* Bouton Edit - Visible pour Admin/Superviseur ou pour OPJ si c'est son bandit */}
                            {(userRole !== 'ROLE_OPJ' || (typeof bandit.createdBy === 'object' ? bandit.createdBy?.id : bandit.createdBy) === userId) && (
                              <button 
                                onClick={() => handleEditBandit(bandit)}
                                className="text-gray-400 hover:text-gray-600 transition-colors" 
                                title="Modifier"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {/* Bouton Delete - Visible pour Admin/Superviseur uniquement */}
                            {userRole !== 'ROLE_OPJ' && (
                              <button className="text-gray-400 hover:text-red-600 transition-colors" title="Supprimer">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
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
      </div>

      {/* Modals */}
      <AddBanditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBandit={handleAddBandit}
      />
      <EditBanditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBandit(null);
        }}
        onUpdateBandit={handleUpdateBandit}
        bandit={selectedBandit}
      />
    </MainLayout>
  );
}

export default Bandits;

