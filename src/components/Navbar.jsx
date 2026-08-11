import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Home, AlertOctagon, User, LogOut, LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';

function Navbar({ session }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <header className="navbar">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'white' }}>
        <Shield className="animate-fade-in" style={{ color: 'var(--accent)' }} size={24} />
        <h1 style={{ fontSize: '1.25rem' }}>UPI Shield</h1>
      </Link>
      <nav className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/')}`}><Home size={20} /></Link>
        <Link to="/report" className={`nav-link ${isActive('/report')}`}><AlertOctagon size={20} /></Link>
        {session ? (
          <>
            <Link to="/profile" className={`nav-link ${isActive('/profile')}`}><User size={20} /></Link>
            <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><LogOut size={20} /></button>
          </>
        ) : (
          <Link to="/auth" className={`nav-link ${isActive('/auth')}`}><LogIn size={20} /></Link>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
