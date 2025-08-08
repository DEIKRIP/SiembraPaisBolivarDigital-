import React from 'react';
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, Outlet } from 'react-router-dom';
import ScrollToTop from 'components/ScrollToTop';
import ErrorBoundary from 'components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';

// Auth Components
import Login from 'pages/login';

// Main Application Pages
import Dashboard from 'features/dashboard/Dashboard';
import FarmerList from 'features/farmers/FarmerList';
import PlotList from 'features/parcels/PlotList';
import InspectionList from 'features/inspections/InspectionList';
import FinancingManagement from 'features/financing/FinancingManagement';
import NotFound from 'pages/NotFound';

// Componente para proteger rutas
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Ruta de login público */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farmers" element={<FarmerList />} />
            <Route path="/parcels" element={<PlotList />} />
            <Route path="/inspections" element={<InspectionList />} />
            <Route path="/financing" element={<FinancingManagement />} />
            
            {/* Redirecciones para mantener compatibilidad */}
            <Route path="/farmer-dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/parcel-management" element={<Navigate to="/parcels" replace />} />
            <Route path="/farmer-management" element={<Navigate to="/farmers" replace />} />
            <Route path="/inspection-workflow" element={<Navigate to="/inspections" replace />} />
            <Route path="/financing-management" element={<Navigate to="/financing" replace />} />
          </Route>
          
          {/* Redirección desde rutas antiguas */}
          <Route path="/auth/login" element={<Navigate to="/login" replace />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;