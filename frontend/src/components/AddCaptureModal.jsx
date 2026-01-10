import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function AddCaptureModal({ isOpen, onClose, onAddCapture }) {
  const [formData, setFormData] = useState({
    banditId: '',
    dateCapture: '',
    lieuCapture: '',
    latitude: null,
    longitude: null,
    commentaire: '',
  });
  const [preuves, setPreuves] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [bandits, setBandits] = useState([]);
  const [loadingBandits, setLoadingBandits] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Charger les bandits disponibles
  useEffect(() => {
    if (isOpen) {
      loadBandits();
      // Initialiser la date et l'heure actuelles
      const now = new Date();
      const dateTimeString = now.toISOString().slice(0, 16);
      setFormData((prev) => ({
        ...prev,
        dateCapture: dateTimeString,
      }));
    }
  }, [isOpen]);

  const loadBandits = async () => {
    try {
      setLoadingBandits(true);
      const response = await fetch('http://72.61.97.77:8000/api/bandits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBandits(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bandits:', error);
    } finally {
      setLoadingBandits(false);
    }
  };

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

  const handlePreuveAdd = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      // Déterminer le type de fichier
      let type = 'PHOTO';
      if (file.type === 'application/pdf') {
        type = 'PDF';
      } else if (file.type.startsWith('video/')) {
        type = 'VIDEO';
      }

      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Fichier trop volumineux',
          text: `Le fichier ${file.name} dépasse 10MB`,
          confirmButtonColor: '#111827',
        });
        return;
      }

      // Convertir en base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreuve = {
          id: Date.now() + Math.random(),
          type: type,
          fichier: reader.result,
          description: '',
          file: file,
        };
        setPreuves((prev) => [...prev, newPreuve]);
      };
      reader.readAsDataURL(file);
    });
    // Réinitialiser l'input
    e.target.value = '';
  };

  const handlePreuveRemove = (preuveId) => {
    setPreuves((prev) => prev.filter((p) => p.id !== preuveId));
  };

  const handlePreuveDescriptionChange = (preuveId, description) => {
    setPreuves((prev) =>
      prev.map((p) => (p.id === preuveId ? { ...p, description } : p))
    );
  };

  const createPreuves = async (captureId, preuvesList = null) => {
    const preuvesToProcess = preuvesList || preuves;
    const results = [];
    console.log(`createPreuves appelé avec captureId: ${captureId}, nombre de preuves: ${preuvesToProcess.length}`);
    
    for (let i = 0; i < preuvesToProcess.length; i++) {
      const preuve = preuvesToProcess[i];
      console.log(`Création de la preuve ${i + 1}/${preuvesToProcess.length}`, {
        type: preuve.type,
        hasFichier: !!preuve.fichier,
        fichierLength: preuve.fichier?.length || 0,
        description: preuve.description,
      });
      
      try {
        const preuveData = {
          type: preuve.type,
          fichier: preuve.fichier,
          description: preuve.description || null,
        };
        
        console.log(`Envoi de la requête POST pour la preuve ${i + 1}...`);
        const response = await fetch(`http://72.61.97.77:8000/api/preuves/capture/${captureId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(preuveData),
        });

        console.log(`Réponse pour la preuve ${i + 1}:`, response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Erreur lors de la création de la preuve ${i + 1}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            preuveType: preuve.type,
          });
          results.push({ success: false, error: errorData, index: i });
        } else {
          const data = await response.json();
          console.log(`Preuve ${i + 1} créée avec succès:`, data);
          results.push({ success: true, data, index: i });
        }
      } catch (error) {
        console.error(`Erreur lors de la création de la preuve ${i + 1}:`, error);
        results.push({ success: false, error: error.message, index: i });
      }
    }
    
    console.log('Résultats de création des preuves:', results);
    return results;
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: 'error',
        title: 'Géolocalisation non supportée',
        text: 'Votre navigateur ne supporte pas la géolocalisation.',
        confirmButtonColor: '#111827',
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Mettre à jour les coordonnées
        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));

        // Convertir les coordonnées en adresse (géocodage inverse)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'OPJ-Capture-App/1.0',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `${latitude}, ${longitude}`;
            
            setFormData((prev) => ({
              ...prev,
              lieuCapture: address,
            }));

            Swal.fire({
              icon: 'success',
              title: 'Localisation obtenue',
              text: 'Votre position a été enregistrée avec succès.',
              confirmButtonColor: '#111827',
              timer: 2000,
              timerProgressBar: true,
            });
          } else {
            // Si le géocodage échoue, utiliser les coordonnées
            setFormData((prev) => ({
              ...prev,
              lieuCapture: `${latitude}, ${longitude}`,
            }));
          }
        } catch (error) {
          console.error('Erreur lors du géocodage inverse:', error);
          // Utiliser les coordonnées en cas d'erreur
          setFormData((prev) => ({
            ...prev,
            lieuCapture: `${latitude}, ${longitude}`,
          }));
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = 'Erreur lors de la récupération de la position.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre position.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé.';
            break;
        }

        Swal.fire({
          icon: 'error',
          title: 'Erreur de géolocalisation',
          text: errorMessage,
          confirmButtonColor: '#111827',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.banditId) {
      newErrors.banditId = 'Le bandit est requis';
    }
    if (!formData.dateCapture) {
      newErrors.dateCapture = 'La date de capture est requise';
    }
    if (!formData.lieuCapture.trim()) {
      newErrors.lieuCapture = 'Le lieu de capture est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResponse = async (response, captureId = null, data = null, preuvesToCreate = []) => {
    if (response.ok) {
      const responseData = data || await response.json();
      const finalCaptureId = captureId || responseData.capture?.id || responseData.id;

      console.log('handleResponse - finalCaptureId:', finalCaptureId);
      console.log('handleResponse - preuvesToCreate.length:', preuvesToCreate.length);
      console.log('handleResponse - preuvesToCreate:', preuvesToCreate);
      console.log('handleResponse - preuves state length:', preuves.length);

      // Utiliser les preuves passées en paramètre ou l'état
      const preuvesToProcess = preuvesToCreate.length > 0 ? preuvesToCreate : preuves;

      // Si des preuves ont été ajoutées, les créer
      if (preuvesToProcess.length > 0 && finalCaptureId) {
        console.log(`Création de ${preuvesToProcess.length} preuve(s) pour la capture ${finalCaptureId}`);
        try {
          const results = await createPreuves(finalCaptureId, preuvesToProcess);
          const failed = results.filter(r => !r.success);
          const succeeded = results.filter(r => r.success);
          
          console.log(`Preuves créées: ${succeeded.length}/${preuvesToProcess.length}`, results);
          
          if (failed.length > 0) {
            console.warn(`${failed.length} preuve(s) n'ont pas pu être créée(s)`, failed);
            // Afficher un avertissement mais ne pas bloquer
            Swal.fire({
              icon: 'warning',
              title: 'Avertissement',
              text: `${failed.length} preuve(s) sur ${preuvesToProcess.length} n'ont pas pu être enregistrée(s). La capture a été créée avec succès.`,
              confirmButtonColor: '#111827',
              timer: 3000,
            });
          } else if (succeeded.length > 0) {
            console.log('Toutes les preuves ont été créées avec succès');
          }
        } catch (error) {
          console.error('Erreur lors de la création des preuves:', error);
          // Ne pas bloquer si les preuves échouent
        }
      } else {
        console.log('Aucune preuve à créer ou captureId manquant', { 
          preuvesLength: preuvesToProcess.length, 
          finalCaptureId,
          hasPreuves: preuvesToProcess.length > 0,
          hasCaptureId: !!finalCaptureId
        });
      }

      await Swal.fire({
        icon: 'success',
        title: 'Succès !',
        text: 'Capture créée avec succès',
        confirmButtonColor: '#111827',
        timer: 2000,
        timerProgressBar: true,
      });

      // Réinitialiser le formulaire
      const now = new Date();
      const dateTimeString = now.toISOString().slice(0, 16);
      setFormData({
        banditId: '',
        dateCapture: dateTimeString,
        lieuCapture: '',
        latitude: null,
        longitude: null,
        commentaire: '',
      });
      setPreuves([]);
      setErrors({});
      setLoading(false);
      onClose();

      // Notifier le parent pour recharger la liste
      onAddCapture();
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
      const errorMessage = errorData.message || 'Erreur lors de la création de la capture';

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
    e.stopPropagation();

    if (!validateForm()) {
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        banditId: parseInt(formData.banditId),
        dateCapture: formData.dateCapture,
        lieuCapture: formData.lieuCapture,
        commentaire: formData.commentaire || null,
      };

      // Ajouter les coordonnées si disponibles
      if (formData.latitude && formData.longitude) {
        dataToSend.latitude = formData.latitude;
        dataToSend.longitude = formData.longitude;
      }

      const response = await fetch('http://72.61.97.77:8000/api/captures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const captureData = await response.json();
        const captureId = captureData.capture?.id || captureData.id;
        console.log('Capture créée avec ID:', captureId);
        console.log('Preuves à créer:', preuves.length);
        console.log('Preuves state:', preuves);
        // Passer les preuves directement pour éviter les problèmes de closure
        await handleResponse(response, captureId, captureData, [...preuves]);
      } else {
        await handleResponse(response);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la capture:', error);
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
    const now = new Date();
    const dateTimeString = now.toISOString().slice(0, 16);
    setFormData({
      banditId: '',
      dateCapture: dateTimeString,
      lieuCapture: '',
      latitude: null,
      longitude: null,
      commentaire: '',
    });
    setPreuves([]);
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
            <h2 className="text-2xl font-bold text-gray-900">Enregistrer une capture</h2>
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
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
          >
            <div className="space-y-4">
              {/* Bandit */}
              <div>
                <label htmlFor="banditId" className="block text-sm font-medium text-gray-900 mb-2">
                  Bandit <span className="text-red-500">*</span>
                </label>
                {loadingBandits ? (
                  <div className="text-sm text-gray-500">Chargement des bandits...</div>
                ) : (
                  <select
                    id="banditId"
                    name="banditId"
                    value={formData.banditId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                      errors.banditId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner un bandit</option>
                    {bandits.map((bandit) => (
                      <option key={bandit.id} value={bandit.id}>
                        {bandit.nom} {bandit.surnom ? `(${bandit.surnom})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {errors.banditId && (
                  <p className="mt-1 text-sm text-red-600">{errors.banditId}</p>
                )}
              </div>

              {/* Date de capture */}
              <div>
                <label htmlFor="dateCapture" className="block text-sm font-medium text-gray-900 mb-2">
                  Date et heure de capture <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="dateCapture"
                  name="dateCapture"
                  value={formData.dateCapture}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                    errors.dateCapture ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.dateCapture && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateCapture}</p>
                )}
              </div>

              {/* Lieu de capture avec géolocalisation */}
              <div>
                <label htmlFor="lieuCapture" className="block text-sm font-medium text-gray-900 mb-2">
                  Lieu de capture <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="lieuCapture"
                    name="lieuCapture"
                    value={formData.lieuCapture}
                    onChange={handleChange}
                    placeholder="Adresse ou coordonnées GPS"
                    className={`flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                      errors.lieuCapture ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    title="Obtenir ma position actuelle"
                  >
                    {gettingLocation ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Localisation...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Ma position</span>
                      </>
                    )}
                  </button>
                </div>
                {errors.lieuCapture && (
                  <p className="mt-1 text-sm text-red-600">{errors.lieuCapture}</p>
                )}
                {formData.latitude && formData.longitude && (
                  <p className="mt-1 text-xs text-gray-500">
                    Coordonnées: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Commentaire */}
              <div>
                <label htmlFor="commentaire" className="block text-sm font-medium text-gray-900 mb-2">
                  Commentaire
                </label>
                <textarea
                  id="commentaire"
                  name="commentaire"
                  value={formData.commentaire}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  placeholder="Détails supplémentaires sur la capture..."
                />
              </div>

              {/* Preuves */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Preuves (Photos, PDF, Vidéos)
                </label>
                <input
                  type="file"
                  id="preuves"
                  multiple
                  accept="image/*,application/pdf,video/*"
                  onChange={handlePreuveAdd}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Formats acceptés : Images (JPG, PNG, GIF), PDF, Vidéos. Taille maximale : 10MB par fichier.
                </p>

                {/* Liste des preuves ajoutées */}
                {preuves.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {preuves.map((preuve) => (
                      <div
                        key={preuve.id}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex-shrink-0">
                          {preuve.type === 'PHOTO' && preuve.fichier ? (
                            <img
                              src={preuve.fichier}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded border border-gray-300"
                            />
                          ) : preuve.type === 'PDF' ? (
                            <div className="w-16 h-16 bg-red-100 rounded border border-gray-300 flex items-center justify-center">
                              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-blue-100 rounded border border-gray-300 flex items-center justify-center">
                              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {preuve.file?.name || `Preuve ${preuve.type}`}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-800 rounded">
                              {preuve.type}
                            </span>
                          </div>
                          <input
                            type="text"
                            placeholder="Description (optionnel)"
                            value={preuve.description}
                            onChange={(e) => handlePreuveDescriptionChange(preuve.id, e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePreuveRemove(preuve.id)}
                          className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
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
                    <span>Enregistrement en cours...</span>
                  </>
                ) : (
                  'Enregistrer la capture'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddCaptureModal;

