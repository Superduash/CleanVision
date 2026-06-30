import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

/**
 * CleanVision top navigation bar.
 * - Sticky, dark-themed header with SVG logo mark.
 * - Fetches /api/health once on mount to show a mock-mode indicator badge.
 * - Highlights active route breadcrumb.
 */
function Header() {
  const [isMock, setIsMock] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API_BASE}/health`)
      .then((res) => {
        if (!cancelled) setIsMock(res.data.mock_mode);
      })
      .catch(() => {
        if (!cancelled) setIsMock(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isHome = location.pathname === '/';

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 no-underline group"
          aria-label="CleanVision home"
        >
          {/* SVG logo mark */}
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>

          <div>
            <p
              className="text-base font-bold leading-tight tracking-tight group-hover:text-emerald-400 transition-colors"
              style={{ color: '#e6edf3' }}
            >
              CleanVision
            </p>
            <p className="text-xs leading-tight" style={{ color: '#8b949e' }}>
              Hospital Cleanliness Monitor
            </p>
          </div>
        </Link>

        {/* Right side — mock badge + dashboard link */}
        <div className="flex items-center gap-3">
          {isMock === true && (
            <span
              className="cv-badge text-xs"
              style={{
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#fcd34d',
              }}
            >
              🔧 Mock Mode
            </span>
          )}

          {!isHome && (
            <Link
              to="/"
              className="cv-btn-secondary text-xs px-3 py-1.5 no-underline"
            >
              ← Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;