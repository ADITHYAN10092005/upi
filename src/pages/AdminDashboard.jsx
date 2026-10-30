import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Check, X, Image as ImageIcon } from 'lucide-react';

function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*, upi_ids(upi_id, total_reports, risk_score)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending reports:', error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const handleAction = async (reportId, action) => {
    const status = action === 'approve' ? 'approved' : 'rejected';

    // Update report status
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId);

    if (!error) {
      // Remove from list
      setReports(reports.filter(r => r.id !== reportId));
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading moderation queue...</div>;
  }

  return (
    <div className="animate-fade-in glass-panel" style={{ padding: '1.5rem', marginTop: '1rem', maxWidth: '800px', margin: '1rem auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <ShieldCheck size={28} style={{ color: 'var(--safe)' }} />
        <h2 style={{ fontSize: '1.4rem' }}>Moderation Dashboard</h2>
      </div>

      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
        Pending reports: {reports.length}
      </p>

      {reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
          <ShieldCheck size={48} style={{ color: 'var(--safe)', margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No pending reports in the queue. Great job!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reports.map(report => (
            <div key={report.id} style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{report.upi_ids?.upi_id}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Reported on {new Date(report.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {report.category.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description:</div>
                <p style={{ fontSize: '0.95rem' }}>{report.description || 'No description provided.'}</p>
              </div>

              {report.evidence_url && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <a href={report.evidence_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>
                    <ImageIcon size={16} /> View Evidence Screenshot
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="btn"
                  style={{ flex: 1, backgroundColor: 'var(--safe)', color: 'white' }}
                  onClick={() => handleAction(report.id, 'approve')}
                >
                  <Check size={18} /> Approve (Affects Score)
                </button>
                <button
                  className="btn"
                  style={{ flex: 1, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                  onClick={() => handleAction(report.id, 'reject')}
                >
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
