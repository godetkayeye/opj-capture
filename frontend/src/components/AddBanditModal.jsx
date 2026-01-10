import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function AddBanditModal({ isOpen, onClose, onAddBandit }) {
  const [formData, setFormData] = useState({
    nom: '',
    surnom: '',
    dateNaissance: '',
    sexe: 'M',
    etat: 'CAPTURE',
    photo: null,
    infractions: [],
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [infractions, setInfractions] = useState([]);
  const [loadingInfractions, setLoadingInfractions] = useState(true);

  // Charger les infractions disponibles et réinitialiser l'état
  useEffect(() => {
    if (isOpen) {
      // Réinitialiser l'état de chargement quand le modal s'ouvre
      setLoading(false);
      setErrors({});
      setPhotoPreview(null);
      loadInfractions();
    }
  }, [isOpen]);

  const loadInfractions = async () => {
    try {
      setLoadingInfractions(true);
      const response = await fetch('http://72.61.97.77:8000/api/infractions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setInfractions(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infractions:', error);
    } finally {
      setLoadingInfractions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'photo' && files && files[0]) {
      const file = files[0];
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({
          ...prev,
          photo: 'Le fichier doit être une image',
        }));
        return;
      }
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photo: 'L\'image ne doit pas dépasser 5MB',
        }));
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
      
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Effacer l'erreur
      if (errors.photo) {
        setErrors((prev) => ({
          ...prev,
          photo: '',
        }));
      }
    } else {
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
    }
  };

  const handleInfractionChange = (infractionId) => {
    setFormData((prev) => {
      const infractions = prev.infractions;
      const index = infractions.indexOf(infractionId);
      if (index > -1) {
        return {
          ...prev,
          infractions: infractions.filter((id) => id !== infractionId),
        };
      } else {
        return {
          ...prev,
          infractions: [...infractions, infractionId],
        };
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.sexe) {
      newErrors.sexe = 'Le sexe est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResponse = async (response) => {
    if (response.ok) {
      const data = await response.json();

      await Swal.fire({
        icon: 'success',
        title: 'Succès !',
        text: 'Bandit créé avec succès',
        confirmButtonColor: '#111827',
        timer: 2000,
        timerProgressBar: true,
      });

      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        surnom: '',
        dateNaissance: '',
        sexe: 'M',
        etat: 'CAPTURE',
        photo: null,
        infractions: [],
      });
      setPhotoPreview(null);
      setErrors({});
      setLoading(false); // Réinitialiser l'état de chargement
      onClose();

      // Notifier le parent pour recharger la liste
      onAddBandit();
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
      const errorMessage = errorData.message || 'Erreur lors de la création du bandit';

      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
        confirmButtonColor: '#111827',
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Empêcher la propagation de l'événement

    if (!validateForm()) {
      return;
    }

    // S'assurer que loading n'est pas déjà à true
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      // Préparer les données pour l'envoi
      const dataToSend = {
        nom: formData.nom,
        surnom: formData.surnom || null,
        dateNaissance: formData.dateNaissance || null,
        sexe: formData.sexe,
        etat: formData.etat,
        infractions: formData.infractions,
      };

      // Si une photo est sélectionnée, convertir en base64
      if (formData.photo) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          dataToSend.photo = reader.result; // base64 string
          
          const response = await fetch('http://72.61.97.77:8000/api/bandits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(dataToSend),
          });

          handleResponse(response);
        };
        reader.readAsDataURL(formData.photo);
      } else {
        const response = await fetch('http://72.61.97.77:8000/api/bandits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(dataToSend),
        });

        handleResponse(response);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du bandit:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur de connexion au serveur. Vérifiez que le serveur Symfony est démarré.',
        confirmButtonColor: '#111827',
      });
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nom: '',
      surnom: '',
      dateNaissance: '',
      sexe: 'M',
      etat: 'CAPTURE',
      photo: null,
      infractions: [],
    });
    setPhotoPreview(null);
    setErrors({});
    setLoading(false); // Réinitialiser l'état de chargement
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
            <h2 className="text-2xl font-bold text-gray-900">Ajouter un bandit</h2>
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
          <form 
            onSubmit={handleSubmit} 
            className="p-6"
            onKeyDown={(e) => {
              // Empêcher la soumission du formulaire avec la touche Entrée
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
          >
            <div className="space-y-4">
              {/* Nom et Surnom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-gray-900 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                      errors.nom ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.nom && (
                    <p className="mt-1 text-sm text-red-600">{errors.nom}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="surnom" className="block text-sm font-medium text-gray-900 mb-2">
                    Surnom
                  </label>
                  <input
                    type="text"
                    id="surnom"
                    name="surnom"
                    value={formData.surnom}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                    placeholder="Le dangereux"
                  />
                </div>
              </div>

              {/* Date de naissance et Sexe */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateNaissance" className="block text-sm font-medium text-gray-900 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    id="dateNaissance"
                    name="dateNaissance"
                    value={formData.dateNaissance}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="sexe" className="block text-sm font-medium text-gray-900 mb-2">
                    Sexe <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="sexe"
                    name="sexe"
                    value={formData.sexe}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                      errors.sexe ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                  {errors.sexe && (
                    <p className="mt-1 text-sm text-red-600">{errors.sexe}</p>
                  )}
                </div>
              </div>

              {/* État */}
              <div>
                <label htmlFor="etat" className="block text-sm font-medium text-gray-900 mb-2">
                  État
                </label>
                <select
                  id="etat"
                  name="etat"
                  value={formData.etat}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                >
                  <option value="CAPTURE">Capturé</option>
                  <option value="TRANSFERE">Transféré</option>
                  <option value="LIBERE">Libéré</option>
                </select>
              </div>

              {/* Photo */}
              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-900 mb-2">
                  Photo
                </label>
                <div className="space-y-3">
                  {photoPreview && (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, photo: null }));
                          setPhotoPreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Supprimer la photo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    accept="image/*"
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 text-sm ${
                      errors.photo ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.photo && (
                    <p className="mt-1 text-sm text-red-600">{errors.photo}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Formats acceptés : JPG, PNG, GIF. Taille maximale : 5MB
                  </p>
                </div>
              </div>

              {/* Infractions */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Infractions
                </label>
                {loadingInfractions ? (
                  <div className="text-sm text-gray-500">Chargement des infractions...</div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {infractions.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucune infraction disponible</p>
                    ) : (
                      <div className="space-y-2">
                        {infractions.map((infraction) => (
                          <label
                            key={infraction.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.infractions.includes(infraction.id)}
                              onChange={() => handleInfractionChange(infraction.id)}
                              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                            />
                            <span className="text-sm text-gray-900">{infraction.libelle}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
                    <span>Ajout en cours...</span>
                  </>
                ) : (
                  'Ajouter le bandit'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddBanditModal;

