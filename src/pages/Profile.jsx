import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Save, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  // Profile Form State
  const [username, setUsername] = useState('');
  const [personalUpiId, setPersonalUpiId] = useState('');
  const [message, setMessage] = useState('');

  // Reports State
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchProfileAndReports();
  }, []);

  const fetchProfileAndReports = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUser(session.user);
      
      // Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profile) {
        setUsername(profile.username || '');
        setPersonalUpiId(profile.personal_upi_id || '');
      }

      // Fetch Reports
      const { data: userReports } = await supabase
        .from('reports')
        .select('*, upi_ids(upi_id)')
        .eq('reporter_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (userReports) {
        setReports(userReports);
      }
    }
    setLoading(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    const updates = {
      id: user.id,
      username,
      personal_upi_id: personalUpiId,
      updated_at: new Date()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(updates);

    if (error) {
      setMessage('Error updating profile: ' + error.message);
    } else {
      setMessage('Profile updated successfully!');
    }
    setSaving(false);
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
    return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading profile...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      
      {/* Profile Editor Section */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <User size={28} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1.4rem' }}>My Profile</h2>
        </div>

        <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Profile ID:</strong> {user?.id}</div>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="input-label">Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. cyber_samurai"
            />
          </div>
          <div>
            <label className="input-label">Personal UPI ID (Optional)</label>
            <input 
              type="text" 
              className="input-field" 
              value={personalUpiId}
              onChange={(e) => setPersonalUpiId(e.target.value)}
              placeholder="e.g. 9876543210@paytm"
            />
          </div>
          
          {message && (
            <div style={{ fontSize: '0.9rem', color: message.includes('Error') ? 'var(--danger)' : 'var(--safe)' }}>
              {message}
            </div>
          )}

          <button type="submit" className="btn" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Reports Section */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <FileText size={28} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '1.4rem' }}>My Reports</h2>
        </div>

        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
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

    </div>
  );
}

export default Profile;
