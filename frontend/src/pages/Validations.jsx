import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import ValidationModal from '../components/ValidationModal';
import CaptureDetailsModal from '../components/CaptureDetailsModal';
import Swal from 'sweetalert2';

function Validations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperviseur = user.role === 'ROLE_SUPERVISEUR' || user.role === 'ROLE_ADMIN';

  // Charger les validations depuis l'API
  useEffect(() => {
    loadValidations();
  }, [statutFilter]);

  const loadValidations = async () => {
    try {
      setLoading(true);
      const url = statutFilter === 'all' 
        ? 'http://72.61.97.77:8000/api/validations'
        : `http://72.61.97.77:8000/api/validations?statut=${statutFilter}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setValidations(data);
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
          text: 'Impossible de charger les validations',
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des validations:', error);
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

  const handleValidationUpdate = () => {
    loadValidations();
  };

  const getStatutLabel = (statut) => {
    const statuts = {
      EN_ATTENTE: 'En attente',
      VALIDEE: 'Validée',
      REJETEE: 'Rejetée',
    };
    return statuts[statut] || statut;
  };

  const getStatutBadgeColor = (statut) => {
    const colors = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      VALIDEE: 'bg-green-100 text-green-800',
      REJETEE: 'bg-red-100 text-red-800',
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  const filteredValidations = validations.filter((validation) => {
    const matchesSearch =
      validation.capture.bandit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (validation.capture.bandit.surnom && validation.capture.bandit.surnom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (validation.superviseur.nom && validation.superviseur.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (validation.superviseur.prenom && validation.superviseur.prenom.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <MainLayout currentPage="validations">
      <div>
        {/* Title Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Validations</h1>
              <p className="text-sm sm:text-base text-gray-600">Gérer les validations des captures par les superviseurs.</p>
            </div>
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
                placeholder="Rechercher des validations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Statut Filter */}
            <div className="relative sm:w-auto w-full">
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm text-gray-900 w-full"
              >
                <option value="all">Statut : Tous</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="VALIDEE">Validée</option>
                <option value="REJETEE">Rejetée</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Validations Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Capture
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Superviseur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date de validation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Remarque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredValidations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Aucune validation trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredValidations.map((validation) => (
                      <tr key={validation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {validation.capture.bandit.photo ? (
                              <img
                                src={validation.capture.bandit.photo}
                                alt={`${validation.capture.bandit.nom} ${validation.capture.bandit.surnom || ''}`}
                                className="w-10 h-10 object-cover rounded-full border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {validation.capture.bandit.nom}
                                {validation.capture.bandit.surnom && ` (${validation.capture.bandit.surnom})`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {validation.capture.dateCaptureFormatted}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {validation.superviseur.prenom} {validation.superviseur.nom}
                            </span>
                            <p className="text-xs text-gray-500">Mat: {validation.superviseur.matricule}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatutBadgeColor(validation.statut)}`}>
                            {getStatutLabel(validation.statut)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {validation.dateValidationFormatted || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500 max-w-xs truncate block">
                            {validation.remarque || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setSelectedCapture(validation.capture);
                                setIsDetailsModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Voir les détails"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {isSuperviseur && validation.statut === 'EN_ATTENTE' && (
                              <button
                                onClick={() => {
                                  setSelectedCapture(validation.capture);
                                  setIsValidationModalOpen(true);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Valider/Rejeter"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <ValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => {
          setIsValidationModalOpen(false);
          setSelectedCapture(null);
        }}
        onValidationUpdate={handleValidationUpdate}
        capture={selectedCapture}
      />
      <CaptureDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCapture(null);
        }}
        captureId={selectedCapture?.id}
      />
    </MainLayout>
  );
}

export default Validations;

