import { useState } from 'react';
import Swal from 'sweetalert2';
import { getApiUrl } from '../api/config';

function ProposeInfractionModal({ isOpen, onClose, onPropose }) {
  const [formData, setFormData] = useState({
    libelle: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Effacer l'erreur du champ modifié
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
      newErrors.libelle = 'Le libellé est obligatoire';
    }
    if (formData.libelle.length < 3) {
      newErrors.libelle = 'Le libellé doit contenir au moins 3 caractères';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Créer une note de proposition (on va la stocker comme une infraction avec un statut spécial)
      // ou créer une nouvelle table de propositions. Pour maintenant, on va envoyer une alerte
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const proposalData = {
        libelle: formData.libelle,
        description: formData.description,
        proposedBy: user.id,
        proposedByName: `${user.prenom} ${user.nom}`,
        proposedAt: new Date().toISOString(),
        status: 'PENDING', // À approuver par un superviseur
      };

      // Envoyer la proposition au serveur
      const response = await fetch(getApiUrl('/api/infractions/propose'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(proposalData),
      });

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Proposition envoyée',
          text: 'Votre proposition d\'infraction a été envoyée aux superviseurs pour approbation.',
          confirmButtonColor: '#111827',
        });
        
        // Réinitialiser le formulaire
        setFormData({
          libelle: '',
          description: '',
        });
        setErrors({});
        onClose();
        
        // Notifier le parent
        if (onPropose) {
          onPropose();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorData.message || 'Impossible de soumettre la proposition',
          confirmButtonColor: '#111827',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la proposition:', error);
      await Swal.fire({
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Proposer une nouvelle infraction</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Libellé */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Libellé de l'infraction *
              </label>
              <input
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleChange}
                placeholder="Ex: Vol avec violence"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.libelle ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.libelle && (
                <p className="text-red-500 text-xs mt-1">{errors.libelle}</p>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optionnel)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez cette infraction en détail..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={loading}
              />
            </div>

            {/* Info message */}
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Note :</strong> Votre proposition sera envoyée aux superviseurs pour examen et approbation.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Envoi...
                  </>
                ) : (
                  'Proposer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProposeInfractionModal;
