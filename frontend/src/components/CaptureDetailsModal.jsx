import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function CaptureDetailsModal({ isOpen, onClose, captureId }) {
  const [capture, setCapture] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && captureId) {
      loadCaptureDetails();
    }
  }, [isOpen, captureId]);

  const loadCaptureDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/captures/${captureId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCapture(data);
      } else {
        if (response.status === 401) {
          Swal.fire({
            icon: 'warning',
            title: 'Session expirée',
            text: 'Votre session a expiré. Veuillez vous reconnecter.',
            confirmButtonColor: '#111827',
          });
          localStorage.removeItem('user');
          window.location.href = '/';
          return;
        }
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les détails de la capture',
          confirmButtonColor: '#111827',
        });
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur de connexion au serveur',
        confirmButtonColor: '#111827',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const openMapLocation = (lieuCapture) => {
    const coordMatch = lieuCapture.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = coordMatch[1];
      const lon = coordMatch[2];
      window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15`, '_blank');
    } else {
      window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(lieuCapture)}`, '_blank');
    }
  };

  const openPreuve = (preuve) => {
    if (preuve.type === 'PHOTO') {
      Swal.fire({
        imageUrl: preuve.fichier,
        imageAlt: preuve.description || 'Preuve',
        showConfirmButton: false,
        showCloseButton: true,
        width: 'auto',
        padding: '0',
        background: 'transparent',
        backdrop: 'rgba(0,0,0,0.8)',
      });
    } else if (preuve.type === 'PDF') {
      window.open(preuve.fichier, '_blank');
    } else if (preuve.type === 'VIDEO') {
      Swal.fire({
        html: `<video controls style="max-width: 100%; max-height: 70vh;">
          <source src="${preuve.fichier}" type="video/mp4">
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>`,
        showConfirmButton: false,
        showCloseButton: true,
        width: 'auto',
        padding: '20px',
        background: 'transparent',
        backdrop: 'rgba(0,0,0,0.8)',
      });
    }
  };

  if (!isOpen || !captureId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Détails de la capture</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">Chargement...</div>
          ) : capture ? (
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
              {/* Informations du bandit */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-3">Bandit capturé</h3>
                <div className="flex items-center gap-3 sm:gap-4">
                  {capture.bandit.photo ? (
                    <img
                      src={capture.bandit.photo}
                      alt={capture.bandit.nom}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 border-gray-300 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base sm:text-lg font-semibold text-gray-900">{capture.bandit.nom}</p>
                    {capture.bandit.surnom && (
                      <p className="text-xs sm:text-sm text-gray-600">Surnom: {capture.bandit.surnom}</p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">État: <span className="font-medium">{capture.bandit.etat}</span></p>
                  </div>
                </div>
              </div>

              {/* Informations de la capture */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">Date de capture</h3>
                  <p className="text-sm sm:text-base font-medium text-gray-900">{capture.dateCaptureFormatted || capture.dateCapture}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">OPJ</h3>
                  <p className="text-sm sm:text-base font-medium text-gray-900">
                    {capture.opj.prenom} {capture.opj.nom}
                  </p>
                  <p className="text-xs text-gray-600">Mat: {capture.opj.matricule}</p>
                </div>
                <div className="sm:col-span-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Lieu de capture</h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <p className="text-sm sm:text-base text-gray-900 flex-1">{capture.lieuCapture}</p>
                    <button
                      onClick={() => openMapLocation(capture.lieuCapture)}
                      className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 flex-shrink-0 w-full sm:w-auto justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="hidden sm:inline">Voir sur la carte</span>
                      <span className="sm:hidden">Carte</span>
                    </button>
                  </div>
                </div>
                {capture.commentaire && (
                  <div className="sm:col-span-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h3 className="text-xs sm:text-sm font-medium text-blue-900 mb-1 uppercase tracking-wide">Commentaire</h3>
                    <p className="text-sm text-blue-900">{capture.commentaire}</p>
                  </div>
                )}
              </div>

              {/* Preuves */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Preuves <span className="text-gray-500">({capture.preuves?.length || 0})</span>
                </h3>
                {capture.preuves && capture.preuves.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {capture.preuves.map((preuve) => (
                      <div
                        key={preuve.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white"
                        onClick={() => openPreuve(preuve)}
                      >
                        {preuve.type === 'PHOTO' && preuve.fichier ? (
                          <img
                            src={preuve.fichier}
                            alt={preuve.description || 'Preuve'}
                            className="w-full h-24 sm:h-32 object-cover"
                          />
                        ) : preuve.type === 'PDF' ? (
                          <div className="w-full h-24 sm:h-32 bg-red-100 flex flex-col items-center justify-center">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-medium text-red-900">PDF</span>
                          </div>
                        ) : (
                          <div className="w-full h-24 sm:h-32 bg-blue-100 flex flex-col items-center justify-center">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-medium text-blue-900">VID</span>
                          </div>
                        )}
                        <div className="p-2 bg-white border-t border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-800 rounded">
                              {preuve.type}
                            </span>
                          </div>
                          {preuve.description && (
                            <p className="text-xs text-gray-600 truncate">{preuve.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg text-sm">
                    Aucune preuve associée à cette capture
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">Aucune donnée disponible</div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaptureDetailsModal;

