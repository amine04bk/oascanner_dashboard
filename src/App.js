import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import AddUserPage from './pages/AddUserPage';
import Dashboard from './pages/Dashboard';
import MapContainer from './components/MapContainer';
import { getAuth } from 'firebase/auth';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/map" />} />
        <Route path="/*" element={<Layout />}>
          <Route path="add-user" element={isAuthenticated ? <AddUserPage /> : <Navigate to="/" />} />
          <Route path="dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="map" element={isAuthenticated ? <MapContainer /> : <Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
