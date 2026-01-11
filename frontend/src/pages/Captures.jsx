import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import AddCaptureModal from '../components/AddCaptureModal';
import CaptureDetailsModal from '../components/CaptureDetailsModal';
import ValidationModal from '../components/ValidationModal';
import Swal from 'sweetalert2';
import { getApiUrl } from '../api/config';

function Captures() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [selectedCaptureId, setSelectedCaptureId] = useState(null);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validations, setValidations] = useState({}); // Map captureId -> validation
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperviseur = user.role === 'ROLE_SUPERVISEUR' || user.role === 'ROLE_ADMIN';
  const isOPJ = user.role === 'ROLE_OPJ';

  // Charger les captures depuis l'API
  useEffect(() => {
    loadCaptures();
  }, []);

  const loadCaptures = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/captures'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        let data = await response.json();
        
        // Si OPJ, filtrer pour voir uniquement ses captures + les captures validées
        if (isOPJ) {
          console.log('User ID OPJ:', user.id);
          console.log('Captures reçues:', data);
          data = data.filter(capture => {
            console.log('Capture:', capture);
            console.log('opj:', capture.opj);
            // Utiliser opj.id au lieu de createdBy.id
            const isMyCapture = capture.opj?.id === user.id;
            const isValidated = capture.status === 'VALIDEE';
            console.log(`Capture ${capture.id}: isMyCapture=${isMyCapture}, isValidated=${isValidated}`);
            return isMyCapture || isValidated;
          });
        }
        
        setCaptures(data);
        // Charger les validations pour chaque capture
        loadValidationsForCaptures(data);
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
          text: 'Impossible de charger les captures',
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des captures:', error);
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

  const handleAddCapture = () => {
    loadCaptures();
  };

  const loadValidationsForCaptures = async (capturesList) => {
    const validationsMap = {};
    for (const capture of capturesList) {
      try {
        const response = await fetch(getApiUrl(`/api/validations/capture/${capture.id}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const validation = await response.json();
          validationsMap[capture.id] = validation;
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de la validation pour la capture ${capture.id}:`, error);
      }
    }
    setValidations(validationsMap);
  };

  const handleValidationUpdate = () => {
    loadCaptures();
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

  const filteredCaptures = captures.filter((capture) => {
    const matchesSearch =
      capture.bandit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (capture.bandit.surnom && capture.bandit.surnom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      capture.lieuCapture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (capture.opj.nom && capture.opj.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (capture.opj.prenom && capture.opj.prenom.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const openMapLocation = (lieuCapture) => {
    // Extraire les coordonnées si elles sont dans le format "lat, lon"
    const coordMatch = lieuCapture.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = coordMatch[1];
      const lon = coordMatch[2];
      window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15`, '_blank');
    } else {
      // Si c'est une adresse, ouvrir dans Google Maps ou OpenStreetMap
      window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(lieuCapture)}`, '_blank');
    }
  };

  return (
    <MainLayout currentPage="captures">
      <div>
        {/* Title and Action Section */}
        <div className="mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Captures</h1>
              <p className="text-xs sm:text-sm text-gray-600">Historique des captures de bandits enregistrées dans le système.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-900 text-white px-3 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Enregistrer</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Captures Table */}
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
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bandit</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">OPJ</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lieu</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Validat.</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Enreg.</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCaptures.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-gray-500 text-sm">
                          Aucune capture trouvée
                        </td>
                      </tr>
                    ) : (
                      filteredCaptures.map((capture) => (
                        <tr key={capture.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {capture.bandit.photo ? (
                                <img
                                  src={capture.bandit.photo}
                                  alt={capture.bandit.nom}
                                  className="w-8 h-8 object-cover rounded-full border border-gray-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{capture.bandit.nom}</p>
                                {capture.bandit.surnom && (
                                  <p className="text-xs text-gray-500 truncate">{capture.bandit.surnom}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div>
                              <p className="text-xs font-medium text-gray-900">{capture.opj.prenom} {capture.opj.nom}</p>
                              <p className="text-xs text-gray-500">M:{capture.opj.matricule}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600">
                            {capture.dateCaptureFormatted || capture.dateCapture || '-'}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-600 truncate max-w-xs">
                                {capture.lieuCapture ? capture.lieuCapture.substring(0, 20) : '-'}
                              </span>
                              {capture.lieuCapture && (
                                <button
                                  onClick={() => openMapLocation(capture.lieuCapture)}
                                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                  title="Voir sur la carte"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {validations[capture.id] ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatutBadgeColor(validations[capture.id].statut)}`}>
                                {getStatutLabel(validations[capture.id].statut).substring(0, 6)}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                            {capture.createdAt || '-'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCaptureId(capture.id);
                                  setIsDetailsModalOpen(true);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="Détails"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              {isSuperviseur && (
                                <button
                                  onClick={() => {
                                    setSelectedCapture(capture);
                                    setIsValidationModalOpen(true);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                  title="Valider"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* Mobile View - Compact Cards */}
              <div className="md:hidden">
                {filteredCaptures.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Aucune capture trouvée</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredCaptures.map((capture) => (
                      <div key={capture.id} className="p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex gap-3">
                          {/* Photo */}
                          <div className="flex-shrink-0">
                            {capture.bandit.photo ? (
                              <img
                                src={capture.bandit.photo}
                                alt={capture.bandit.nom}
                                className="w-10 h-10 object-cover rounded-full border border-gray-200"
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
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{capture.bandit.nom}</p>
                                {capture.bandit.surnom && (
                                  <p className="text-xs text-gray-600">Surnom: {capture.bandit.surnom}</p>
                                )}
                              </div>
                              {validations[capture.id] ? (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatutBadgeColor(validations[capture.id].statut)}`}>
                                  {getStatutLabel(validations[capture.id].statut).substring(0, 6)}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 flex-shrink-0">
                                  -
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mb-2">
                              <div>
                                <p className="text-gray-500">OPJ</p>
                                <p className="font-medium text-gray-900">{capture.opj.prenom} {capture.opj.nom}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Date</p>
                                <p className="font-medium text-gray-900">{capture.dateCaptureFormatted || capture.dateCapture || '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Lieu</p>
                                <div className="flex items-center gap-1">
                                  <p className="font-medium text-gray-900 truncate">{capture.lieuCapture ? capture.lieuCapture.substring(0, 15) : '-'}</p>
                                  {capture.lieuCapture && (
                                    <button
                                      onClick={() => openMapLocation(capture.lieuCapture)}
                                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500">Enreg.</p>
                                <p className="font-medium text-gray-900">{capture.createdAt || '-'}</p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCaptureId(capture.id);
                                  setIsDetailsModalOpen(true);
                                }}
                                className="flex-1 text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                              >
                                Détails
                              </button>
                              {isSuperviseur && (
                                <button
                                  onClick={() => {
                                    setSelectedCapture(capture);
                                    setIsValidationModalOpen(true);
                                  }}
                                  className="flex-1 text-xs px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                                >
                                  Valider
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
      <AddCaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCapture={handleAddCapture}
      />
      <CaptureDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCaptureId(null);
        }}
        captureId={selectedCaptureId}
      />
      <ValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => {
          setIsValidationModalOpen(false);
          setSelectedCapture(null);
        }}
        onValidationUpdate={handleValidationUpdate}
        capture={selectedCapture}
      />
    </MainLayout>
  );
}

export default Captures;

