import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ShieldCheck, AlertTriangle, XOctagon, ArrowRight, X, Clock, FileText, AlertCircle, Link as LinkIcon } from 'lucide-react';

function RiskResult() {
  const { upiId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState(null);
  const [reports, setReports] = useState([]);
  const [networkAlerts, setNetworkAlerts] = useState([]);
  const [osintSignals, setOsintSignals] = useState([]);

  useEffect(() => {
    const fetchRisk = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('upi_ids')
        .select('*')
        .eq('upi_id', upiId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching UPI data:", error);
      }
      
      if (data) {
        setRiskData(data);
        
        // Fetch citizen reports
        if (data.total_reports > 0) {
          const { data: reportData } = await supabase
            .from('reports')
            .select('category, created_at, description')
            .eq('upi_id_ref', data.id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(5);
          if (reportData) setReports(reportData);
        }

        // Fetch OSINT signals
        if (data.osint_signal_count > 0) {
          const { data: osintData } = await supabase
            .from('osint_signals')
            .select('source_url, reason, osint_sources(name)')
            .eq('linked_upi_id_ref', data.id)
            .limit(5);
          if (osintData) setOsintSignals(osintData);
        }

        // Check Scammer Network
        if (data.linked_phone) {
          const { data: networkData } = await supabase
            .from('upi_ids')
            .select('upi_id, total_reports')
            .eq('linked_phone', data.linked_phone)
            .neq('id', data.id)
            .gt('total_reports', 0);
          if (networkData && networkData.length > 0) {
            setNetworkAlerts(networkData);
          }
        }
      } else {
        const potentialPhone = upiId.match(/([0-9]{10})/) ? upiId.match(/([0-9]{10})/)[1] : null;
        if (potentialPhone) {
          const { data: networkData } = await supabase
            .from('upi_ids')
            .select('upi_id, total_reports')
            .eq('linked_phone', potentialPhone)
            .gt('total_reports', 0);
            
          if (networkData && networkData.length > 0) {
            setNetworkAlerts(networkData);
            setRiskData({ risk_score: 'Network Risk', total_reports: 0, osint_signal_count: 0 });
            setLoading(false);
            return;
          }
        }
        setRiskData({ risk_score: 'Safe', total_reports: 0, osint_signal_count: 0 });
      }
      setLoading(false);
    };

    fetchRisk();
  }, [upiId]);

  const handleProceed = () => {
    window.location.href = `upi://pay?pa=${upiId}`;
  };

  const getRiskConfig = () => {
    switch (riskData?.risk_score) {
      case 'High risk':
        return { color: 'var(--danger)', bg: 'var(--danger-bg)', icon: XOctagon, title: 'High Risk (8+)', text: 'Multiple fraud reports confirmed.' };
      case 'Medium risk':
        return { color: 'var(--caution)', bg: 'var(--caution-bg)', icon: AlertTriangle, title: 'Medium Risk (4-7)', text: 'Several suspicious activities reported.' };
      case 'Low risk':
        return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', icon: AlertTriangle, title: 'Low Risk (1-3)', text: 'A few reports. Exercise caution.' };
      case 'Network Risk':
        return { color: 'var(--danger)', bg: 'var(--danger-bg)', icon: AlertCircle, title: 'Scammer Network', text: 'This number is associated with other fraudulent accounts.' };
      case 'Safe':
      default:
        return { color: 'var(--safe)', bg: 'var(--safe-bg)', icon: ShieldCheck, title: 'Safe', text: 'No spam reports found.' };
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Analyzing risk...</div>;
  }

  const config = getRiskConfig();
  const Icon = config.icon;

  return (
    <div className="animate-fade-in glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          padding: '1.5rem', 
          borderRadius: '50%', 
          backgroundColor: config.bg,
          color: config.color,
          marginBottom: '1rem',
          boxShadow: riskData?.risk_score === 'High risk' ? '0 0 30px rgba(239, 68, 68, 0.4)' : 'none'
        }}>
          <Icon size={48} />
        </div>
        <h2 style={{ color: config.color, marginBottom: '0.5rem' }}>{config.title}</h2>
        <p style={{ fontSize: '1.1rem', wordBreak: 'break-all', fontWeight: '500' }}>{upiId}</p>
        <p style={{ marginTop: '0.5rem' }}>{config.text}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{riskData?.total_reports || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Citizen Reports</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: riskData?.osint_signal_count > 0 ? 'var(--caution)' : 'inherit' }}>
            {riskData?.osint_signal_count || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>OSINT Flags</div>
        </div>
      </div>

      {networkAlerts.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
          <h3 style={{ color: 'var(--danger)', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> Network Alert
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>This user's phone number is linked to these reported accounts:</p>
          <ul style={{ paddingLeft: '1.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {networkAlerts.map(a => (
              <li key={a.upi_id}><strong>{a.upi_id}</strong> ({a.total_reports} reports)</li>
            ))}
          </ul>
        </div>
      )}

      {osintSignals.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--caution)' }}>
            <AlertCircle size={18} /> Public Web Signals (Unverified)
          </h3>
          {osintSignals.map((signal, idx) => (
            <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', borderLeft: `3px solid var(--caution)`, fontSize: '0.9rem' }}>
              <div style={{ marginBottom: '4px' }}>Flagged in public source: <strong>{signal.osint_sources?.name || 'Unknown Source'}</strong></div>
              {signal.reason && <div style={{ marginBottom: '4px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Reason: {signal.reason}</div>}
              {signal.source_url && (
                <a href={signal.source_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', textDecoration: 'none', marginTop: '4px', fontSize: '0.8rem' }}>
                  <LinkIcon size={12} /> View original context
                </a>
              )}
            </div>
          ))}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.5rem' }}>
            *OSINT signals alone cannot trigger a High Risk classification.
          </p>
        </div>
      )}

      {reports.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Verified Citizen Reports
          </h3>
          {reports.map((report, idx) => (
            <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', borderLeft: `3px solid ${config.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{report.category.replace('_', ' ')}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              {report.description && <p style={{ fontSize: '0.9rem' }}>{report.description}</p>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/')}>
          <X size={18} /> Cancel
        </button>
        <button 
          className="btn" 
          style={{ 
            flex: 2, 
            backgroundColor: (riskData?.risk_score === 'High risk' || riskData?.risk_score === 'Network Risk') ? 'var(--bg-secondary)' : 'var(--accent)',
            color: (riskData?.risk_score === 'High risk' || riskData?.risk_score === 'Network Risk') ? 'var(--text-secondary)' : 'white',
            border: (riskData?.risk_score === 'High risk' || riskData?.risk_score === 'Network Risk') ? '1px solid var(--border-glass)' : 'none'
          }} 
          onClick={handleProceed}
        >
          Proceed to Pay <ArrowRight size={18} />
        </button>
      </div>
      
      {(riskData?.risk_score === 'High risk' || riskData?.risk_score === 'Network Risk') && (
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.75rem' }}>
          Proceeding is highly discouraged. Your payment app will now open.
        </p>
      )}
    </div>
  );
}

export default RiskResult;
