import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Plants from './pages/Plants';
import Assets from './pages/Assets';
import Setr from './pages/Setr';
import AssetDetail from './pages/AssetDetail';
import TestsPage from './pages/TestsPage';
import DCSPage from './pages/DCSPage';
import AlarmsPage from './pages/AlarmsPage';
import EventsPage from './pages/EventsPage';
import './styles/global.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          
          <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/plants" element={<Plants />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/setr" element={<Setr />} />
            <Route path="/assets/:assetId" element={<AssetDetail />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/dcs" element={<DCSPage />} />
            <Route path="/alarms" element={<AlarmsPage />} />
            <Route path="/events" element={<EventsPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
