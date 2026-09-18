import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { displayUserName } from '../../utils/userDisplayName';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../LanguageSelector';

const Navbar = () => {
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const { t } = useTranslation();
    
    const raw = localStorage.getItem('currentUser');
    let currentUser = null;
    try {
        currentUser = raw ? JSON.parse(raw) : null;
    } catch {
        currentUser = null;
    }
    const who = displayUserName(currentUser);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/';
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`main-header ${isScrolled ? 'scrolled' : ''}`}>
            <div className="header-logo-section">
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
                <div className="header-text">
                    <h1 className="header-title">{t('nav.portal')}</h1>
                    <p className="header-subtitle">{t('nav.subtitle')}</p>
                </div>
            </div>
            <nav className="center-nav">
                <ul className="nav-links">
                    <li><Link to="/" className={`nav-glow-link ${isActive('/')}`}>{t('nav.home')}</Link></li>
                    <li><Link to="/hostels" className={`nav-glow-link ${isActive('/hostels')}`}>{t('nav.viewHostels')}</Link></li>
                    <li><Link to="/inquiry" className={`nav-glow-link ${isActive('/inquiry')}`}>{t('nav.inquiry')}</Link></li>
                    <li><Link to="/reviews" className={`nav-glow-link ${isActive('/reviews')}`}>⭐ {t('nav.reviews')}</Link></li>
                    <li className="nav-lang-item">
                        <LanguageSelector />
                    </li>
                    
                    {!currentUser ? (
                        <>
                            <li><Link to="/login" className="nav-btn nav-btn-glow">{t('nav.signIn')}</Link></li>
                            <li><Link to="/register" className="nav-btn nav-btn-solid">{t('nav.signUp')}</Link></li>
                            <li>
                                <Link
                                    to="/register/caretaker"
                                    className="nav-btn"
                                    style={{ color: '#fff', backgroundColor: '#2563eb', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '4px' }}
                                >
                                    {t('nav.addYourHostel')}
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            {['admin', 'caretaker'].includes(currentUser.role) && (
                                <li>
                                    <Link 
                                        to="/admin" 
                                        className={`nav-item nav-btn-solid ${isActive('/admin')}`} 
                                        style={{ backgroundColor: '#000', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px' }}
                                    >
                                        {currentUser.role === 'admin' ? t('nav.adminPanel') : t('nav.myHostel')}
                                    </Link>
                                </li>
                            )}
{who && (
                                <li className="nav-item" style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 600 }}>
                                    {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'caretaker' ? 'Caretaker' : 'Hi'}, {who}
                                </li>
                            )}
                            <li>
                                <Link
                                    to="/profile"
                                    className={`nav-btn nav-btn-outline ${isActive('/profile') ? 'active' : ''}`}
                                    title={t('nav.profileTitle')}
                                >
                                    👤 {t('nav.myProfile')}
                                </Link>
                            </li>
                            <li>
                                <button onClick={handleLogout} className="nav-btn nav-btn-outline">{t('nav.logout')}</button>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </header>
    );
};

export default Navbar;
