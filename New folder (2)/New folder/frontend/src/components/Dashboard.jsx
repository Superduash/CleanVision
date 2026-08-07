import React, { useEffect, useState } from 'react';
import { Camera, History, BarChart3, Settings, ShieldCheck, ClipboardCheck, Bell, AlertTriangle, CheckCircle2, QrCode } from 'lucide-react';
import { fetchTrends, fetchClientReports, resolveClientReport } from '../services/api';
import './Dashboard.css';

export default function Dashboard({ user, navigateTo, onOpenClientPortal }) {
  const [stats, setStats] = useState({ todayCount: 0, avgScore: 0 });
  const [clientAlerts, setClientAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [trends, alerts] = await Promise.all([
        fetchTrends(),
        fetchClientReports()
      ]);
      setStats(trends);
      setClientAlerts(alerts);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveAlert = async (reportId) => {
    await resolveClientReport(reportId);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const pendingAlerts = clientAlerts.filter(a => a.status === 'PENDING');

  return (
    <div className="dashboard-container animate-fade">
      {/* Header section with brand and inspector profile */}
      <div className="dashboard-header">
        <div className="header-brand">
          <ShieldCheck size={20} className="text-primary" />
          <span className="brand-title">CleanVision Staff</span>
        </div>

        <div className="header-actions-right">
          {/* Notification bell badge */}
          {pendingAlerts.length > 0 && (
            <div className="alerts-badge-pill" title={`${pendingAlerts.length} Active Client Alerts`}>
              <Bell size={14} className="bell-pulse" />
              <span>{pendingAlerts.length} Alerts</span>
            </div>
          )}

          <div className="inspector-pill">
            <div className="inspector-avatar">
              {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'UI'}
            </div>
            <span className="inspector-name-text">{user.name || 'Worker'}</span>
          </div>
        </div>
      </div>

      {/* Greeting Banner */}
      <div className="welcome-banner">
        <div className="welcome-text-group">
          <h2 className="welcome-title">{getGreeting()},</h2>
          <h3 className="welcome-user">{user.name || 'Worker'}</h3>
          <p className="welcome-subtitle">Role: {user.role?.toUpperCase()} · Access: Block {user.block_access || 'ALL'}</p>
        </div>
        <button 
          className="visitor-qr-quick-btn" 
          onClick={onOpenClientPortal}
          title="Open Visitor QR Complaint Screen"
        >
          <QrCode size={18} />
          <span>Visitor QR</span>
        </button>
      </div>

      {/* Visitor / Patient Complaint Alerts Section */}
      {pendingAlerts.length > 0 && (
        <div className="client-alerts-section animate-slide-up">
          <div className="alerts-section-hdr">
            <AlertTriangle size={16} className="text-danger" />
            <h4 className="alerts-section-title">Active Patient/Visitor Alerts ({pendingAlerts.length})</h4>
          </div>

          <div className="alerts-cards-list">
            {pendingAlerts.map(alert => (
              <div key={alert.report_id} className="alert-card glass-card">
                <div className="alert-card-header">
                  <span className="alert-location-tag">
                    📍 Block {alert.block} · Floor {alert.floor_number} · Room {alert.room_number}
                  </span>
                  <span className="alert-time-tag">
                    {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="alert-card-body">
                  <span className="alert-issue-name">{alert.issue_type}</span>
                  {alert.notes && <p className="alert-notes">"{alert.notes}"</p>}
                </div>

                <div className="alert-card-actions">
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleResolveAlert(alert.report_id)}
                  >
                    <CheckCircle2 size={14} /> Mark Resolved & Initiate Clean Scan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Metrics Ribbon */}
      <div className="metrics-summary glass-card">
        <div className="metric-item">
          <span className="metric-label">Today's Audits</span>
          <span className="metric-value">
            {loading ? '...' : stats.todayCount}
          </span>
          <span className="metric-subtext">completed</span>
        </div>
        <div className="metric-divider"></div>
        <div className="metric-item">
          <span className="metric-label">Average Score</span>
          <span className={`metric-value ${stats.avgScore >= 70 ? 'text-success' : 'text-warning'}`}>
            {loading ? '...' : `${stats.avgScore}%`}
          </span>
          <span className="metric-subtext">quality index</span>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <h4 className="section-label">Staff Workspace</h4>
      <div className="menu-grid">
        <button className="menu-card glass-card" onClick={() => navigateTo('scan')}>
          <div className="card-icon-wrapper scan-icon">
            <Camera size={26} />
          </div>
          <div className="card-info">
            <span className="card-title">Scan Bathroom</span>
            <span className="card-description">Trigger AI cleanliness audit</span>
          </div>
        </button>

        <button className="menu-card glass-card" onClick={() => navigateTo('history')}>
          <div className="card-icon-wrapper history-icon">
            <History size={26} />
          </div>
          <div className="card-info">
            <span className="card-title">Inspection Logs</span>
            <span className="card-description">View logs and details</span>
          </div>
        </button>

        <button className="menu-card glass-card" onClick={() => navigateTo('reports')}>
          <div className="card-icon-wrapper reports-icon">
            <BarChart3 size={26} />
          </div>
          <div className="card-info">
            <span className="card-title">Reports & Trends</span>
            <span className="card-description">Hygiene charts for managers</span>
          </div>
        </button>

        <button className="menu-card glass-card" onClick={() => navigateTo('settings')}>
          <div className="card-icon-wrapper settings-icon">
            <Settings size={26} />
          </div>
          <div className="card-info">
            <span className="card-title">System Settings</span>
            <span className="card-description">Languages, dark mode & info</span>
          </div>
        </button>
      </div>

      <div className="safety-card">
        <ClipboardCheck size={18} className="safety-icon" />
        <p className="safety-text">
          Keep our hospital safe. Complete audits promptly after receiving visitor alerts.
        </p>
      </div>
    </div>
  );
}
