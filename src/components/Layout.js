// src/components/Layout.js
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  const location = useLocation();
  const isAuthenticated = location.pathname !== '/'; // Adjust this based on authentication logic

  return (
    <div>
      {isAuthenticated && <Navbar />}
      <Outlet /> {/* Renders the matching child route */}
    </div>
  );
};

export default Layout;
