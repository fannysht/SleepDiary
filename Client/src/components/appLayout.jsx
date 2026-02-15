// Layout de l'application web

import { Link, Outlet } from 'react-router-dom';

export default function AppLayout ({ user, onLogout }) {
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" to="/home">
            <span className="ms-2">SleepTracker</span>
          </Link>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/home">Accueil</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/timeline">Timeline</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/statistiques">Stats</Link>
              </li>
            </ul>
            
            <div className="d-flex align-items-center">
              <span className="navbar-text me-3 text-light">
                Salut, {user?.firstName}
              </span>
              <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mt-4">
        <Outlet />
      </main>
    </>
  );
};