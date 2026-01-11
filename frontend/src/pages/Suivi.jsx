import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import Swal from 'sweetalert2';
import { getApiUrl } from '../api/config';

function Suivi() {
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [officiers, setOfficiers] = useState([]);
  const [stats, setStats] = useState({
    totalCaptures: 0,
    capturesByOfficier: {},
    capturesByStatus: { EN_ATTENTE: 0, VALIDEE: 0, REJETEE: 0 },
  });

  // Filtres
  const [selectedOfficier, setSelectedOfficier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Charger les captures au montage
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
        const data = await response.json();
        setCaptures(data);
        
        // Extraire les officiers uniques
        const uniqueOfficiers = [...new Set(data.map(c => JSON.stringify(c.opj)))].map(o => JSON.parse(o));
        setOfficiers(uniqueOfficiers);
        
        // Calculer les statistiques
        calculateStats(data);
      } else if (response.status === 401) {
        Swal.fire({
          icon: 'warning',
          title: 'Session expirée',
          text: 'Votre session a expiré. Veuillez vous reconnecter.',
          confirmButtonColor: '#111827',
        }).then(() => {
          localStorage.removeItem('user');
          window.location.href = '/';
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des captures:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur de connexion au serveur',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      totalCaptures: data.length,
      capturesByOfficier: {},
      capturesByStatus: { EN_ATTENTE: 0, VALIDEE: 0, REJETEE: 0 },
    };

    data.forEach(capture => {
      // Captures par officier
      const officierKey = `${capture.opj.nom} ${capture.opj.prenom}`;
      stats.capturesByOfficier[officierKey] = (stats.capturesByOfficier[officierKey] || 0) + 1;

      // Captures par statut
      if (capture.status && stats.capturesByStatus.hasOwnProperty(capture.status)) {
        stats.capturesByStatus[capture.status]++;
      }
    });

    setStats(stats);
  };

  // Filtrer les captures selon les critères
  const getFilteredCaptures = () => {
    return captures.filter(capture => {
      // Filtre par officier
      if (selectedOfficier !== 'all' && capture.opj.id.toString() !== selectedOfficier) {
        return false;
      }

      // Filtre par statut
      if (selectedStatus !== 'all' && capture.status !== selectedStatus) {
        return false;
      }

      // Filtre par plage de dates
      if (startDate || endDate) {
        const captureDate = new Date(capture.dateCapture);
        if (startDate) {
          const start = new Date(startDate);
          if (captureDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (captureDate > end) return false;
        }
      }

      // Filtre par recherche (bandit, lieu)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          capture.bandit.nom.toLowerCase().includes(term) ||
          capture.bandit.surnom?.toLowerCase().includes(term) ||
          capture.lieuCapture.toLowerCase().includes(term)
        );
      }

      return true;
    });
  };

  const filteredCaptures = getFilteredCaptures();

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'VALIDEE':
        return 'bg-green-100 text-green-800';
      case 'REJETEE':
        return 'bg-red-100 text-red-800';
      case 'EN_ATTENTE':
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'VALIDEE':
        return 'Validée';
      case 'REJETEE':
        return 'Rejetée';
      case 'EN_ATTENTE':
        return 'En attente';
      default:
        return status;
    }
  };

  return (
    <MainLayout currentPage="captures">
      <div>
        {/* Header */}
        <div className="mb-3 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-0.5">Suivi des captures</h1>
          <p className="text-xs text-gray-600">Suivi et validation</p>
        </div>

        {/* Statistiques - Compact 2x2 on mobile, 1x4 on desktop */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-3 mb-3 sm:mb-6">
            {/* Total Captures */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded sm:rounded-xl border border-blue-200 p-2 sm:p-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-500 rounded p-1.5 mb-1">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-gray-700 text-xs font-medium mb-0.5">Total</p>
                <p className="text-xl sm:text-3xl font-bold text-blue-600">{stats.totalCaptures}</p>
              </div>
            </div>

            {/* En attente */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded sm:rounded-xl border border-orange-200 p-2 sm:p-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="bg-orange-500 rounded p-1.5 mb-1">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 text-xs font-medium mb-0.5">Attente</p>
                <p className="text-xl sm:text-3xl font-bold text-orange-600">{stats.capturesByStatus.EN_ATTENTE}</p>
              </div>
            </div>

            {/* Validées */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded sm:rounded-xl border border-green-200 p-2 sm:p-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-500 rounded p-1.5 mb-1">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 text-xs font-medium mb-0.5">Validées</p>
                <p className="text-xl sm:text-3xl font-bold text-green-600">{stats.capturesByStatus.VALIDEE}</p>
              </div>
            </div>

            {/* Rejetées */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded sm:rounded-xl border border-red-200 p-2 sm:p-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-500 rounded p-1.5 mb-1">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-gray-700 text-xs font-medium mb-0.5">Rejetées</p>
                <p className="text-xl sm:text-3xl font-bold text-red-600">{stats.capturesByStatus.REJETEE}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filtres - Collapsible on Mobile */}
        <div className="bg-white rounded sm:rounded-xl border border-gray-200 p-2 sm:p-4 mb-3 sm:mb-6">
          <h2 className="text-xs sm:text-base font-semibold text-gray-900 mb-2">Filtres</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 sm:gap-3">
            {/* Recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Bandit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-2.5 sm:pr-4 py-1.5 sm:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-gray-900"
              />
            </div>

            {/* Filtre Officier */}
            <div className="relative">
              <select
                value={selectedOfficier}
                onChange={(e) => setSelectedOfficier(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded px-2.5 sm:px-4 py-1.5 sm:py-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm text-gray-900 w-full"
              >
                <option value="all">Officier</option>
                {officiers.map((officier) => (
                  <option key={officier.id} value={officier.id}>
                    {officier.prenom} {officier.nom}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Filtre Statut */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded px-2.5 sm:px-4 py-1.5 sm:py-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm text-gray-900 w-full"
              >
                <option value="all">Statut</option>
                <option value="EN_ATTENTE">Attente</option>
                <option value="VALIDEE">Validée</option>
                <option value="REJETEE">Rejetée</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Date début */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-gray-900"
              />
            </div>

            {/* Date fin */}
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Tableau des captures - Desktop View */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Bandit
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Officier
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Lieu
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCaptures.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-gray-500 text-sm">
                          Aucune capture trouvée
                        </td>
                      </tr>
                    ) : (
                      filteredCaptures.map((capture) => (
                        <tr key={capture.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {capture.bandit.photo && (
                                <img
                                  src={capture.bandit.photo}
                                  alt={capture.bandit.nom}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                  {capture.bandit.nom} {capture.bandit.surnom && `(${capture.bandit.surnom})`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-xs sm:text-sm text-gray-900">
                              {capture.opj.prenom} {capture.opj.nom}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-xs sm:text-sm text-gray-600">{capture.dateCaptureFormatted}</span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-xs sm:text-sm text-gray-600">{capture.lieuCapture}</span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(capture.status)}`}>
                              {getStatusLabel(capture.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-3 sm:px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs sm:text-sm text-gray-600">
                {filteredCaptures.length} capture{filteredCaptures.length !== 1 ? 's' : ''} affichée{filteredCaptures.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2">
              {filteredCaptures.length === 0 ? (
                <div className="bg-white rounded border border-gray-200 p-3 text-center text-gray-500 text-xs">
                  Aucune capture trouvée
                </div>
              ) : (
                filteredCaptures.map((capture) => (
                  <div
                    key={capture.id}
                    className="bg-white rounded border border-gray-200 p-2.5 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    {/* Header with Photo and Name + Status */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {capture.bandit.photo && (
                          <img
                            src={capture.bandit.photo}
                            alt={capture.bandit.nom}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold text-gray-900 truncate">
                            {capture.bandit.nom}
                          </h3>
                          {capture.bandit.surnom && (
                            <p className="text-xs text-gray-600 truncate">({capture.bandit.surnom})</p>
                          )}
                        </div>
                      </div>
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getStatusBadgeColor(capture.status)}`}>
                        {getStatusLabel(capture.status)}
                      </span>
                    </div>

                    {/* Info Grid - 3 columns compact */}
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <div className="bg-blue-50 rounded p-1.5 border border-blue-100">
                        <p className="text-gray-600 text-xs mb-0.5 font-medium">Officier</p>
                        <p className="font-semibold text-gray-900 text-xs truncate">{capture.opj.prenom}</p>
                        <p className="text-gray-700 text-xs truncate">{capture.opj.nom}</p>
                      </div>
                      <div className="bg-green-50 rounded p-1.5 border border-green-100">
                        <p className="text-gray-600 text-xs mb-0.5 font-medium">Date</p>
                        <p className="font-semibold text-gray-900 text-xs">{capture.dateCaptureFormatted}</p>
                      </div>
                      <div className="bg-purple-50 rounded p-1.5 border border-purple-100">
                        <p className="text-gray-600 text-xs mb-0.5 font-medium">Lieu</p>
                        <p className="font-semibold text-gray-900 text-xs truncate">{capture.lieuCapture}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="text-center text-xs text-gray-600 mt-2">
                {filteredCaptures.length} capture{filteredCaptures.length !== 1 ? 's' : ''}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default Suivi;
