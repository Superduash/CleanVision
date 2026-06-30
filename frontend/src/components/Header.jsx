import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-emerald-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <Link to="/" className="flex items-center space-x-3 no-underline">
          <div className="text-2xl">🏥</div>
          <div>
            <h1 className="text-xl font-bold leading-tight">CleanVision</h1>
            <p className="text-xs text-emerald-100 leading-tight">Hospital Cleanliness Monitor</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Header;