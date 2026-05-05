import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    
    // For now we'll simulate auth state. In full app, we map this to useAuth / context.
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <header className="main-header">
            <div className="header-logo">
                <img 
                    src="/IMAGES/logo.png" 
                    alt="BU Logo" 
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Bugema_logo.png';
                    }} 
                />
            </div>
            <h1 className="header-title">BU ROOM RESERVATION SYSTEM</h1>
            <nav className="center-nav">
                <ul className="nav-links">
                    <li><Link to="/" className={`nav-item ${isActive('/')}`}>Home</Link></li>
                    <li><Link to="/hostels" className={`nav-item ${isActive('/hostels')}`}>View Hostels</Link></li>
                    <li><Link to="/inquiry" className={`nav-item ${isActive('/inquiry')}`}>Inquiry</Link></li>
                    
                    {!currentUser ? (
                        <>
                            <li><Link to="/login" className="nav-btn nav-btn-outline">Sign In</Link></li>
                            <li><Link to="/register" className="nav-btn nav-btn-solid">Sign Up</Link></li>
                        </>
                    ) : (
                        <>
                            {currentUser.role === 'admin' && (
                                <li>
                                    <Link 
                                        to="/admin" 
                                        className={`nav-item nav-btn-solid ${isActive('/admin')}`} 
                                        style={{ backgroundColor: '#000', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px' }}
                                    >
                                        Admin Panel
                                    </Link>
                                </li>
                            )}
                            <li>
                                <button onClick={handleLogout} className="nav-btn nav-btn-outline">Logout</button>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </header>
    );
};

export default Navbar;
