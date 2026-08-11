import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import { Camera, Upload, Keyboard, Search, Phone } from 'lucide-react';

function Home() {
  const [activeTab, setActiveTab] = useState('camera');
  const [manualUpi, setManualUpi] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    let html5QrCode;
    
    if (activeTab === 'camera') {
      html5QrCode = new Html5Qrcode("reader");
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleScannedData(decodedText);
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch(console.error);
          }
        },
        (errorMessage) => {
          // ignore scan errors
        }
      ).catch((err) => {
        console.error("Camera error:", err);
        setError("Camera permission denied or not available.");
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [activeTab]);

  const extractUpiId = (text) => {
    if (text.includes('upi://pay')) {
      const url = new URL(text);
      return url.searchParams.get('pa');
    }
    const regex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/;
    const match = text.match(regex);
    return match ? match[0] : null;
  };

  const handleScannedData = (text) => {
    const upiId = extractUpiId(text);
    if (upiId) {
      navigate(`/risk/${encodeURIComponent(upiId)}`);
    } else {
      setError("No valid UPI ID found in QR code.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleScannedData(code.data);
        } else {
          setError("Could not read QR code from image.");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualUpi.trim()) return;
    const upiId = extractUpiId(manualUpi) || manualUpi.trim();
    navigate(`/risk/${encodeURIComponent(upiId)}`);
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    // Format as a generic UPI if just a phone number, or just pass the phone number to risk check
    navigate(`/risk/${encodeURIComponent(phoneNumber.trim())}`);
  };

  return (
    <div className="animate-fade-in glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Check UPI Risk</h2>
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Scan or enter details before paying</p>

      <div className="tabs" style={{ fontSize: '0.8rem' }}>
        <div className={`tab ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')} style={{ padding: '0.5rem 0.2rem' }}>
          <Camera size={14} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> Scan
        </div>
        <div className={`tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')} style={{ padding: '0.5rem 0.2rem' }}>
          <Upload size={14} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> Upload
        </div>
        <div className={`tab ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')} style={{ padding: '0.5rem 0.2rem' }}>
          <Keyboard size={14} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> UPI ID
        </div>
        <div className={`tab ${activeTab === 'phone' ? 'active' : ''}`} onClick={() => setActiveTab('phone')} style={{ padding: '0.5rem 0.2rem' }}>
          <Phone size={14} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> Phone
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {activeTab === 'camera' && (
        <div>
          <div className="scanner-frame">
            <div id="reader" style={{ width: '100%', height: '100%' }}></div>
            <div className="scanner-overlay"></div>
            <div className="scanner-corner tl"></div>
            <div className="scanner-corner tr"></div>
            <div className="scanner-corner bl"></div>
            <div className="scanner-corner br"></div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.875rem' }}>Point your camera at a UPI QR Code</p>
        </div>
      )}

      {activeTab === 'upload' && (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '2px dashed var(--border-glass)', borderRadius: 'var(--radius-lg)' }}>
          <Upload size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <h3>Upload QR Image</h3>
          <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>Select a screenshot of a QR code</p>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
            Choose File
          </button>
        </div>
      )}

      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit}>
          <div className="input-group">
            <label>UPI ID</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g., merchant@sbi" 
              value={manualUpi}
              onChange={(e) => setManualUpi(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Search size={18} /> Verify UPI ID
          </button>
        </form>
      )}

      {activeTab === 'phone' && (
        <form onSubmit={handlePhoneSubmit}>
          <div className="input-group">
            <label>Phone Number</label>
            <input 
              type="tel" 
              className="input" 
              placeholder="e.g., 9876543210" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Search size={18} /> Verify Phone Number
          </button>
        </form>
      )}
    </div>
  );
}

export default Home;
