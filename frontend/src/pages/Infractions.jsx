import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import AddInfractionModal from '../components/AddInfractionModal';
import EditInfractionModal from '../components/EditInfractionModal';
import Swal from 'sweetalert2';
import { getApiUrl } from '../api/config';

function Infractions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInfraction, setSelectedInfraction] = useState(null);
  const [infractions, setInfractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperviseur = user.role === 'ROLE_SUPERVISEUR' || user.role === 'ROLE_ADMIN';
  const isAdmin = user.role === 'ROLE_ADMIN';
  const isOPJ = user.role === 'ROLE_OPJ';

  // Charger les infractions depuis l'API
  useEffect(() => {
    loadInfractions();
  }, []);

  const loadInfractions = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/infractions'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setInfractions(data);
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
          text: 'Impossible de charger les infractions',
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infractions:', error);
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

  const handleAddInfraction = () => {
    loadInfractions();
  };

  const handleEditInfraction = (infraction) => {
    setSelectedInfraction(infraction);
    setIsEditModalOpen(true);
  };

  const handleDeleteInfraction = async (infraction) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Supprimer l\'infraction ?',
      text: `Êtes-vous sûr de vouloir supprimer "${infraction.libelle}" ?`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(getApiUrl(`/api/infractions/${infraction.id}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          await Swal.fire({
            icon: 'success',
            title: 'Succès !',
            text: 'Infraction supprimée avec succès',
            confirmButtonColor: '#111827',
            timer: 2000,
            timerProgressBar: true,
          });
          loadInfractions();
        } else {
          if (response.status === 401) {
            await Swal.fire({
              icon: 'warning',
              title: 'Session expirée',
              text: 'Votre session a expiré. Veuillez vous reconnecter.',
              confirmButtonColor: '#111827',
            });
            localStorage.removeItem('user');
            window.location.href = '/';
            return;
          }

          if (response.status === 403) {
            await Swal.fire({
              icon: 'error',
              title: 'Accès refusé',
              text: 'Vous n\'avez pas les permissions nécessaires pour supprimer une infraction.',
              confirmButtonColor: '#111827',
            });
            return;
          }

          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || 'Erreur lors de la suppression de l\'infraction';

          await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: errorMessage,
            confirmButtonColor: '#111827',
          });
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'infraction:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur de connexion au serveur',
          confirmButtonColor: '#111827',
        });
      }
    }
  };

  const handleApproveInfraction = async (infraction) => {
    try {
      const response = await fetch(getApiUrl(`/api/infractions/${infraction.id}/approve`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Succès !',
          text: 'Infraction approuvée',
          confirmButtonColor: '#111827',
          timer: 2000,
          timerProgressBar: true,
        });
        loadInfractions();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors de l\'approbation de l\'infraction',
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur de connexion au serveur',
        confirmButtonColor: '#111827',
      });
    }
  };

  const handleRejectInfraction = async (infraction) => {
    try {
      const response = await fetch(getApiUrl(`/api/infractions/${infraction.id}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Succès !',
          text: 'Infraction rejetée',
          confirmButtonColor: '#111827',
          timer: 2000,
          timerProgressBar: true,
        });
        loadInfractions();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors du rejet de l\'infraction',
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur de connexion au serveur',
        confirmButtonColor: '#111827',
      });
    }
  };

  const filteredInfractions = infractions.filter((infraction) => {
    const matchesSearch =
      infraction.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (infraction.description && infraction.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Séparer les infractions approuvées et en attente (pour superviseur)
  const unapprovedInfractions = infractions.filter(inf => !inf.isApproved);
  const approvedInfractions = infractions.filter(inf => inf.isApproved);

  return (
    <MainLayout currentPage="infractions">
      <div>
        {/* Superviseur Management Section */}
        {isSuperviseur && (
          <>
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Approbation des infractions</h2>
              <p className="text-gray-600 mb-4">Validez les nouvelles infractions proposées par les officiers</p>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Chargement...</div>
              ) : unapprovedInfractions.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                  Aucune infraction en attente d'approbation
                </div>
              ) : (
                <div className="grid gap-4">
                  {unapprovedInfractions.map((infraction) => (
                    <div key={infraction.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:border-gray-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{infraction.libelle}</h3>
                          {infraction.description && (
                            <p className="text-gray-600 text-sm mb-2">{infraction.description}</p>
                          )}
                          <p className="text-xs text-gray-400">Enregistré le {infraction.createdAt}</p>
                        </div>
                        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                          <button
                            onClick={() => handleApproveInfraction(infraction)}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">Approuver</span>
                          </button>
                          <button
                            onClick={() => handleRejectInfraction(infraction)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="hidden sm:inline">Rejeter</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {approvedInfractions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  Infractions approuvées ({approvedInfractions.length})
                </h3>
                <div className="grid gap-2">
                  {approvedInfractions.map((infraction) => (
                    <div key={infraction.id} className="bg-green-50 rounded-lg border border-green-200 p-3 text-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{infraction.libelle}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Approuvé par {infraction.approvedBy?.prenom} {infraction.approvedBy?.nom} le {new Date(infraction.approvedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRejectInfraction(infraction)}
                          className="text-green-600 hover:text-red-600 transition-colors"
                          title="Révoquer l'approbation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="my-8" />
          </>
        )}

        {/* Infractions Catalog Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Catalogue des infractions</h1>
              <p className="text-sm sm:text-base text-gray-600">Gérer le catalogue des infractions enregistrées dans le système.</p>
            </div>
            {(isSuperviseur || isOPJ) && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gray-900 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Ajouter une infraction</span>
                <span className="sm:hidden">Ajouter</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher des infractions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Infractions Table - Desktop View */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Libellé
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Enreg.
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInfractions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                          Aucune infraction trouvée
                        </td>
                      </tr>
                    ) : (
                      filteredInfractions.map((infraction) => (
                        <tr key={infraction.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-xs sm:text-sm font-medium text-gray-900">{infraction.libelle}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs sm:text-sm text-gray-500 max-w-md truncate block">
                              {infraction.description || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {infraction.createdAt || '-'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isSuperviseur && (
                                <button
                                  onClick={() => handleEditInfraction(infraction)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Modifier"
                                >
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteInfraction(infraction)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                  title="Supprimer"
                                >
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-3">
              {filteredInfractions.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500">
                  Aucune infraction trouvée
                </div>
              ) : (
                filteredInfractions.map((infraction) => (
                  <div
                    key={infraction.id}
                    className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors"
                  >
                    {/* Header with Title */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {infraction.libelle}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {isSuperviseur && (
                          <button
                            onClick={() => handleEditInfraction(infraction)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteInfraction(infraction)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Info Grid - 2 columns */}
                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-600">Enregistré</p>
                        <p className="font-medium text-gray-900">{infraction.createdAt || '-'}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-600">Statut</p>
                        <p className="font-medium text-gray-900">
                          {infraction.isApproved ? (
                            <span className="text-green-600">Approuvée</span>
                          ) : (
                            <span className="text-orange-600">En attente</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {infraction.description && (
                      <div className="bg-gray-50 rounded p-2 text-xs">
                        <p className="text-gray-600 mb-1">Description</p>
                        <p className="text-gray-700">{infraction.description}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddInfractionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddInfraction={handleAddInfraction}
      />
      {selectedInfraction && (
        <EditInfractionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedInfraction(null);
          }}
          infraction={selectedInfraction}
          onEditInfraction={loadInfractions}
        />
      )}
    </MainLayout>
  );
}

export default Infractions;

