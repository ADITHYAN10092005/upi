import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    setLoading(true);
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    // Fetch only reports belonging to the current user
    const { data, error } = await supabase
      .from('reports')
      .select('*, upi_ids(upi_id)')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <CheckCircle size={16} color="var(--safe)" />;
      case 'rejected': return <XCircle size={16} color="var(--danger)" />;
      case 'pending':
      default: return <Clock size={16} color="var(--caution)" />;
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading your reports...</div>;
  }

  return (
    <div className="animate-fade-in glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <FileText size={28} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '1.4rem' }}>My Reports</h2>
      </div>

      {reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          You haven't submitted any reports yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reports.map(report => (
            <div key={report.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{report.upi_ids?.upi_id || 'Unknown UPI'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                  {getStatusIcon(report.status)} {report.status}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--accent)' }}>Category:</span> {report.category.replace('_', ' ')}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {new Date(report.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyReports;
