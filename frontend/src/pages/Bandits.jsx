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

  const handleDeleteBandit = async (bandit) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Êtes-vous sûr?',
      text: `Vous allez supprimer le bandit "${bandit.nom}". Cette action est irréversible.`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(getApiUrl(`/api/bandits/${bandit.id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Succès!',
          text: 'Le bandit a été supprimé avec succès.',
          confirmButtonColor: '#111827',
          timer: 2000,
          timerProgressBar: true,
        });
        loadBandits();
      } else if (response.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Session expirée',
          text: 'Votre session a expiré. Veuillez vous reconnecter.',
          confirmButtonColor: '#111827',
        }).then(() => {
          localStorage.removeItem('user');
          window.location.href = '/';
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorData.message || 'Impossible de supprimer le bandit',
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur de connexion au serveur',
        confirmButtonColor: '#111827',
      });
    }
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
        <div className="mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bandits</h1>
              <p className="text-xs sm:text-sm text-gray-600">Gérer les bandits enregistrés dans le système.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-900 text-white px-3 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Ajouter</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
              />
            </div>

            {/* État Filter */}
            <div className="relative sm:w-48">
              <select
                value={etatFilter}
                onChange={(e) => setEtatFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-xs sm:text-sm text-gray-900 w-full"
              >
                <option value="all">État : Tous</option>
                <option value="CAPTURE">Capturé</option>
                <option value="TRANSFERE">Transféré</option>
                <option value="LIBERE">Libéré</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bandits Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">Chargement...</div>
          ) : (
            <>
              {/* Desktop View - Compact Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Photo</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Surnom</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date naiss.</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sexe</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">État</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Infractions</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Enreg.</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBandits.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-6 text-center text-gray-500 text-sm">
                          Aucun bandit trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredBandits.map((bandit) => (
                        <tr key={bandit.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap">
                            {bandit.photo ? (
                              <img
                                src={bandit.photo}
                                alt={`${bandit.nom}`}
                                className="w-8 h-8 object-cover rounded-full border border-gray-200 cursor-pointer hover:border-gray-400"
                                onClick={() => {
                                  Swal.fire({
                                    imageUrl: bandit.photo,
                                    imageAlt: `${bandit.nom}`,
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
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-xs font-medium text-gray-900">{bandit.nom}</span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-600">{bandit.surnom || '-'}</span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                            {bandit.dateNaissance}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-600">{getSexeLabel(bandit.sexe)}</span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEtatBadgeColor(bandit.etat)}`}>
                              {getEtatLabel(bandit.etat)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-0.5">
                              {bandit.infractions && bandit.infractions.length > 0 ? (
                                bandit.infractions.slice(0, 1).map((infraction) => (
                                  <span
                                    key={infraction.id}
                                    className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                    title={infraction.libelle}
                                  >
                                    {infraction.libelle.substring(0, 10)}...
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">-</span>
                              )}
                              {bandit.infractions && bandit.infractions.length > 1 && (
                                <span className="text-xs text-gray-500">+{bandit.infractions.length - 1}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                            {bandit.createdAt ? bandit.createdAt.split(' ')[0] : '-'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {(userRole !== 'ROLE_OPJ' || (typeof bandit.createdBy === 'object' ? bandit.createdBy?.id : bandit.createdBy) === userId) && (
                                <button 
                                  onClick={() => handleEditBandit(bandit)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors p-1" 
                                  title="Modifier"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              {userRole !== 'ROLE_OPJ' && (
                                <button 
                                  onClick={() => handleDeleteBandit(bandit)}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1" 
                                  title="Supprimer"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* Mobile View - Compact Cards */}
              <div className="md:hidden">
                {filteredBandits.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Aucun bandit trouvé</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredBandits.map((bandit) => (
                      <div key={bandit.id} className="p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex gap-3">
                          {/* Photo */}
                          <div className="flex-shrink-0">
                            {bandit.photo ? (
                              <img
                                src={bandit.photo}
                                alt={`${bandit.nom}`}
                                className="w-10 h-10 object-cover rounded-full border border-gray-200 cursor-pointer"
                                onClick={() => {
                                  Swal.fire({
                                    imageUrl: bandit.photo,
                                    imageAlt: `${bandit.nom}`,
                                    showConfirmButton: false,
                                    showCloseButton: true,
                                    width: 'auto',
                                    padding: '0',
                                    background: 'transparent',
                                    backdrop: 'rgba(0,0,0,0.8)',
                                  });
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{bandit.nom}</p>
                                {bandit.surnom && (
                                  <p className="text-xs text-gray-600">Surnom: {bandit.surnom}</p>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getEtatBadgeColor(bandit.etat)}`}>
                                {getEtatLabel(bandit.etat)}
                              </span>
                            </div>

                            <div className="mt-1 grid grid-cols-3 gap-1 text-xs text-gray-600">
                              <div>
                                <p className="text-gray-500">Sexe</p>
                                <p className="font-medium text-gray-900">{getSexeLabel(bandit.sexe)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Naiss.</p>
                                <p className="font-medium text-gray-900">{bandit.dateNaissance}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Enreg.</p>
                                <p className="font-medium text-gray-900">{bandit.createdAt ? bandit.createdAt.split(' ')[0] : '-'}</p>
                              </div>
                            </div>

                            {bandit.infractions && bandit.infractions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {bandit.infractions.slice(0, 2).map((infraction) => (
                                  <span
                                    key={infraction.id}
                                    className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                  >
                                    {infraction.libelle.substring(0, 12)}...
                                  </span>
                                ))}
                                {bandit.infractions.length > 2 && (
                                  <span className="text-xs text-gray-500">+{bandit.infractions.length - 2}</span>
                                )}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="mt-2 flex items-center gap-2">
                              {(userRole !== 'ROLE_OPJ' || (typeof bandit.createdBy === 'object' ? bandit.createdBy?.id : bandit.createdBy) === userId) && (
                                <button 
                                  onClick={() => handleEditBandit(bandit)}
                                  className="flex-1 text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                                >
                                  Modifier
                                </button>
                              )}
                              {userRole !== 'ROLE_OPJ' && (
                                <button 
                                  onClick={() => handleDeleteBandit(bandit)}
                                  className="flex-1 text-xs px-2 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                                >
                                  Supprimer
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
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

