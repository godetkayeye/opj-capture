import { useState } from 'react';
import Swal from 'sweetalert2';
import { getApiUrl } from '../api/config';

function EditUserModal({ isOpen, onClose, user, onUserUpdated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: user?.email || '',
    matricule: user?.matricule || '',
    role: user?.role || 'ROLE_OPJ',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.prenom?.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    if (!formData.nom?.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Effacer l'erreur du champ si l'utilisateur corrige
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/users/${user.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Utilisateur modifié avec succès',
          confirmButtonColor: '#111827',
        });
        onUserUpdated();
        onClose();
      } else {
        const error = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message || 'Erreur lors de la modification',
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 flex items-center justify-between border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-white">Modifier l'utilisateur</h2>
            <p className="text-gray-300 text-sm mt-1">Mettez à jour les informations</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Prénom */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              placeholder="Entrez le prénom"
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition ${
                errors.prenom
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              }`}
            />
            {errors.prenom && (
              <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Entrez le nom"
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition ${
                errors.nom
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              }`}
            />
            {errors.nom && (
              <p className="text-red-500 text-sm mt-1">{errors.nom}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Entrez l'email"
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition ${
                errors.email
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Matricule */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Matricule
            </label>
            <input
              type="text"
              name="matricule"
              value={formData.matricule}
              onChange={handleChange}
              placeholder="Entrez le matricule (optionnel)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rôle
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer bg-white text-gray-900 font-medium"
            >
              <option value="ROLE_ADMIN" className="text-gray-900 font-medium">
                👤 Administrateur
              </option>
              <option value="ROLE_SUPERVISEUR" className="text-gray-900 font-medium">
                🔍 Superviseur
              </option>
              <option value="ROLE_OPJ" className="text-gray-900 font-medium">
                📋 Officier
              </option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              {formData.role === 'ROLE_ADMIN' && '👤 Accès complet à la plateforme'}
              {formData.role === 'ROLE_SUPERVISEUR' && '🔍 Supervise les captures et valide les infractions'}
              {formData.role === 'ROLE_OPJ' && '📋 Crée et soumet les captures'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h6m0 0h6" />
                  </svg>
                  Enregistrement...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mettre à jour
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;
