import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { AlertOctagon, Upload, CheckCircle } from 'lucide-react';

function ReportSpam() {
  const [formData, setFormData] = useState({ upiId: '', category: 'fake_qr', description: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error('You must be logged in to submit a report.');
      }

      let upiRecordId;
      
      // 1. Check if UPI ID exists in upi_ids, if not, create it
      const { data: existingUpi, error: upiError } = await supabase
        .from('upi_ids')
        .select('id')
        .eq('upi_id', formData.upiId)
        .single();
        
      if (upiError && upiError.code !== 'PGRST116') throw upiError;
      
      if (existingUpi) {
        upiRecordId = existingUpi.id;
      } else {
        const { data: newUpi, error: createError } = await supabase
          .from('upi_ids')
          .insert([{ upi_id: formData.upiId }])
          .select('id')
          .single();
          
        if (createError) throw createError;
        upiRecordId = newUpi.id;
      }

      // 2. Upload evidence if exists
      let evidenceUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${upiRecordId}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('evidence')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(filePath);
        evidenceUrl = urlData.publicUrl;
      }

      // 3. Create report (status is now default 'approved' in Postgres)
      const { error: reportError } = await supabase
        .from('reports')
        .insert([{
          upi_id_ref: upiRecordId,
          reporter_id: userId,
          category: formData.category,
          description: formData.description,
          evidence_url: evidenceUrl
        }]);

      if (reportError) throw reportError;
      
      setSuccess(true);
      setFormData({ upiId: '', category: 'fake_qr', description: '' });
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while submitting the report.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fade-in glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
        <CheckCircle size={64} style={{ color: 'var(--safe)', margin: '0 auto 1rem' }} />
        <h2>Report Approved</h2>
        <p style={{ margin: '1rem 0' }}>Your report has been successfully filed and is immediately active on the network. Thank you for keeping the community safe.</p>
        <button className="btn btn-primary" onClick={() => setSuccess(false)}>Submit Another Report</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <AlertOctagon size={28} style={{ color: 'var(--caution)' }} />
        <h2 style={{ fontSize: '1.4rem' }}>Report Spam UPI</h2>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Fraudulent UPI ID or Phone</label>
          <input 
            type="text" 
            className="input" 
            required 
            placeholder="e.g., scammer@bank or 9876543210"
            value={formData.upiId}
            onChange={e => setFormData({...formData, upiId: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label>Scam Category</label>
          <select 
            className="select" 
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          >
            <option value="fake_qr">Fake QR Code Scanner</option>
            <option value="otp_scam">OTP / Refund Scam</option>
            <option value="fake_merchant">Fake Merchant / Delivery</option>
            <option value="loan_scam">Fraudulent Loan App</option>
            <option value="investment_scam">Fake Investment</option>
            <option value="impersonation">Impersonation (Family/Friend)</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="input-group">
          <label>Description (Optional)</label>
          <textarea 
            className="textarea" 
            rows="3" 
            placeholder="How did the scam happen?"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          ></textarea>
        </div>

        <div className="input-group">
          <label>Upload Evidence (Screenshot)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => document.getElementById('evidence-upload').click()}>
              <Upload size={18} /> Choose File
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {file ? file.name : 'No file chosen'}
            </span>
          </div>
          <input 
            type="file" 
            id="evidence-upload" 
            accept="image/*" 
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}

export default ReportSpam;
