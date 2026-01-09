import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import Swal from 'sweetalert2';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    matricule: '',
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Charger les données de l'utilisateur connecté
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    setFormData({
      nom: userData.nom || '',
      prenom: userData.prenom || '',
      email: userData.email || '',
      matricule: userData.matricule || '',
    });
    setLoading(false);
  }, []);

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

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    if (!formData.matricule.trim()) {
      newErrors.matricule = 'Le matricule est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Pour l'instant, on simule la sauvegarde (plus tard on fera un appel API)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mettre à jour les données dans localStorage
      const updatedUser = {
        ...user,
        ...formData,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      await Swal.fire({
        icon: 'success',
        title: 'Succès !',
        text: 'Profil mis à jour avec succès',
        confirmButtonColor: '#111827',
        timer: 2000,
        timerProgressBar: true,
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la mise à jour du profil',
        confirmButtonColor: '#111827',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      'ROLE_ADMIN': 'Administrateur',
      'ROLE_SUPERVISEUR': 'Superviseur',
      'ROLE_OPJ': 'Officier',
    };
    return roles[role] || 'Utilisateur';
  };

  const getInitials = (prenom, nom) => {
    if (prenom && nom) {
      return `${prenom[0]}${nom[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <MainLayout currentPage="profile">
        <div className="p-8">
          <div className="text-center text-gray-500">Chargement...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout currentPage="profile">
      <div>
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Mon profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles et vos paramètres de compte.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carte de profil */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-2xl mx-auto mb-4">
                  {getInitials(user?.prenom, user?.nom)}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {user?.prenom} {user?.nom}
                </h2>
                <p className="text-sm text-gray-500 mb-2">{user?.email}</p>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {getRoleLabel(user?.role)}
                </span>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Matricule</p>
                    <p className="text-sm font-medium text-gray-900">{user?.matricule || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Statut</p>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Actif
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire d'édition */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Modifier</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      />
                      {errors.nom && (
                        <p className="mt-1 text-sm text-red-600">{errors.nom}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="prenom" className="block text-sm font-medium text-gray-900 mb-2">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="prenom"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                          errors.prenom ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.prenom && (
                        <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="matricule" className="block text-sm font-medium text-gray-900 mb-2">
                      Matricule <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="matricule"
                      name="matricule"
                      value={formData.matricule}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 ${
                        errors.matricule ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.matricule && (
                      <p className="mt-1 text-sm text-red-600">{errors.matricule}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          nom: user?.nom || '',
                          prenom: user?.prenom || '',
                          email: user?.email || '',
                          matricule: user?.matricule || '',
                        });
                        setErrors({});
                      }}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Sauvegarde...</span>
                        </>
                      ) : (
                        'Enregistrer'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nom</p>
                      <p className="text-sm font-medium text-gray-900">{user?.nom || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Prénom</p>
                      <p className="text-sm font-medium text-gray-900">{user?.prenom || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">{user?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Matricule</p>
                    <p className="text-sm font-medium text-gray-900">{user?.matricule || '-'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Profile;

