import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function ValidationModal({ isOpen, onClose, onValidationUpdate, capture }) {
  const [formData, setFormData] = useState({
    statut: 'VALIDEE',
    remarque: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [existingValidation, setExistingValidation] = useState(null);

  useEffect(() => {
    if (isOpen && capture) {
      loadExistingValidation();
    }
  }, [isOpen, capture]);

  const loadExistingValidation = async () => {
    if (!capture?.id) return;

    try {
      const response = await fetch(`http://72.61.97.77:8000/api/validations/capture/${capture.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setExistingValidation(data);
        setFormData({
          statut: data.statut || 'VALIDEE',
          remarque: data.remarque || '',
        });
      } else if (response.status === 404) {
        // Pas de validation existante, on peut en créer une
        setExistingValidation(null);
        setFormData({
          statut: 'VALIDEE',
          remarque: '',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la validation:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      let response;
      
      if (existingValidation) {
        // Mettre à jour la validation existante
        response = await fetch(`http://72.61.97.77:8000/api/validations/${existingValidation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            statut: formData.statut,
            remarque: formData.remarque || null,
          }),
        });
      } else {
        // Créer une nouvelle validation
        response = await fetch(`http://72.61.97.77:8000/api/validations/capture/${capture.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            statut: formData.statut,
            remarque: formData.remarque || null,
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();
        const action = existingValidation ? 'modifiée' : 'créée';
        const statutLabel = formData.statut === 'VALIDEE' ? 'validée' : formData.statut === 'REJETEE' ? 'rejetée' : 'en attente';

        await Swal.fire({
          icon: 'success',
          title: 'Succès !',
          text: `La validation a été ${action} avec succès. La capture a été ${statutLabel}.`,
          confirmButtonColor: '#111827',
          timer: 2000,
          timerProgressBar: true,
        });

        setFormData({
          statut: 'VALIDEE',
          remarque: '',
        });
        setErrors({});
        setLoading(false);
        onClose();
        onValidationUpdate();
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

        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Erreur lors de la validation';

        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur de connexion au serveur. Vérifiez que le serveur Symfony est démarré.',
        confirmButtonColor: '#111827',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      statut: 'VALIDEE',
      remarque: '',
    });
    setErrors({});
    setLoading(false);
    setExistingValidation(null);
    onClose();
  };

  if (!isOpen || !capture) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {existingValidation ? 'Modifier la validation' : 'Valider la capture'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="p-6">
            {/* Informations de la capture */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Informations de la capture</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  {capture.bandit?.photo ? (
                    <img
                      src={capture.bandit.photo}
                      alt={`${capture.bandit.nom} ${capture.bandit.surnom || ''}`}
                      className="w-12 h-12 object-cover rounded-full border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {capture.bandit?.nom} {capture.bandit?.surnom && `(${capture.bandit.surnom})`}
                    </p>
                    <p className="text-gray-600">
                      Capturé le {capture.dateCaptureFormatted || capture.dateCapture}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600">
                    <span className="font-medium">Lieu:</span> {capture.lieuCapture}
                  </p>
                </div>
                {capture.commentaire && (
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Commentaire:</span> {capture.commentaire}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form */}
            <form 
              onSubmit={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
            >
              <div className="space-y-4">
                {/* Statut */}
                <div>
                  <label htmlFor="statut" className="block text-sm font-medium text-gray-900 mb-2">
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="statut"
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                      errors.statut ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="VALIDEE">Validée</option>
                    <option value="REJETEE">Rejetée</option>
                  </select>
                  {errors.statut && (
                    <p className="mt-1 text-sm text-red-600">{errors.statut}</p>
                  )}
                </div>

                {/* Remarque */}
                <div>
                  <label htmlFor="remarque" className="block text-sm font-medium text-gray-900 mb-2">
                    Remarque
                  </label>
                  <textarea
                    id="remarque"
                    name="remarque"
                    value={formData.remarque}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                    placeholder="Ajouter une remarque sur cette validation..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                    formData.statut === 'VALIDEE'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : formData.statut === 'REJETEE'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      {formData.statut === 'VALIDEE' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {formData.statut === 'REJETEE' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span>
                        {formData.statut === 'VALIDEE' ? 'Valider' : formData.statut === 'REJETEE' ? 'Rejeter' : 'Enregistrer'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ValidationModal;

