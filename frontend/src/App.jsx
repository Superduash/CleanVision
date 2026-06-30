import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import RoomSetup from './pages/RoomSetup';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <Router>
      {/* Dark full-page background defined in index.css (--color-bg) */}
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <Routes>
            <Route path="/"                   element={<Dashboard />} />
            <Route path="/setup"              element={<RoomSetup />} />
            <Route path="/scan/:roomId"       element={<ScanPage />} />
            <Route path="/history/:roomId"    element={<HistoryPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;