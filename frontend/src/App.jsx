import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Bandits from './pages/Bandits';
import Captures from './pages/Captures';
import Validations from './pages/Validations';
import Infractions from './pages/Infractions';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!user);
    setLoading(false);

    // Écouter les changements de hash pour la navigation
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '') || 'dashboard';
      setCurrentPage(hash);
    };

    // Initialiser la page courante
    handleHashChange();

    // Écouter les changements de hash
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  if (loading) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Afficher la page correspondante
  switch (currentPage) {
    case 'profile':
      return <Profile />;
    case 'bandits':
      return <Bandits />;
    case 'captures':
      return <Captures />;
    case 'validations':
      return <Validations />;
    case 'infractions':
      return <Infractions />;
    case 'dashboard':
    default:
      return <Dashboard />;
  }
}

export default App;
