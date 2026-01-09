import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function AddInfractionModal({ isOpen, onClose, onAddInfraction }) {
  const [formData, setFormData] = useState({
    libelle: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        libelle: '',
        description: '',
      });
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.libelle.trim()) {
      newErrors.libelle = 'Le libellé est requis';
    } else if (formData.libelle.length > 150) {
      newErrors.libelle = 'Le libellé ne doit pas dépasser 150 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) {
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/infractions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          libelle: formData.libelle.trim(),
          description: formData.description.trim() || null,
        }),
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Succès !',
          text: 'Infraction créée avec succès',
          confirmButtonColor: '#111827',
          timer: 2000,
          timerProgressBar: true,
        });

        setFormData({
          libelle: '',
          description: '',
        });
        setErrors({});
        setLoading(false);
        onClose();
        onAddInfraction();
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
            text: 'Vous n\'avez pas les permissions nécessaires pour créer une infraction.',
            confirmButtonColor: '#111827',
          });
          setLoading(false);
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Erreur lors de la création de l\'infraction';

        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'infraction:', error);
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
      libelle: '',
      description: '',
    });
    setErrors({});
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

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
            <h2 className="text-2xl font-bold text-gray-900">Ajouter une infraction</h2>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Libellé */}
              <div>
                <label htmlFor="libelle" className="block text-sm font-medium text-gray-900 mb-2">
                  Libellé <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="libelle"
                  name="libelle"
                  value={formData.libelle}
                  onChange={handleChange}
                  maxLength={150}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                    errors.libelle ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Vol à main armée"
                />
                {errors.libelle && (
                  <p className="mt-1 text-sm text-red-600">{errors.libelle}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.libelle.length}/150 caractères
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  placeholder="Description détaillée de l'infraction..."
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
                className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Création...</span>
                  </>
                ) : (
                  'Créer l\'infraction'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddInfractionModal;

