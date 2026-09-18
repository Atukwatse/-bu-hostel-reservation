import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, API_CONFIG } from '../services/api';
import { displayUserName } from '../utils/userDisplayName';
import '../Login.css';

const Login = () => {
    const { t } = useTranslation();
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const cleanName = name.trim();
            const cleanUsername = username.trim();
            const payload =
                role === 'admin'
                    ? { username: cleanUsername, password, role }
                    : { name: cleanName, password, role };

            console.log('Attempting login with:', { ...payload, password: '***' });
            const response = await api.post(API_CONFIG.AUTH.LOGIN, payload);

            api.setToken(response.token);
            let user = response.user;
            try {
                // Try to get fresh user data
                const freshUser = await api.get(API_CONFIG.AUTH.CURRENT_USER);
                user = freshUser;
            } catch (meErr) {
                console.warn('Could not refresh profile from /auth/me/, using login payload', meErr);
                // Use the user data from login response if /me/ fails
            }
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = ['admin', 'caretaker'].includes(role) ? '/admin' : '/';
        } catch (error) {
            console.error('Login error details:', error);
            const errorMsg = error.message || t('auth.checkCredentials');
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="login" className="page-section active">
            <div className="form-container">
                <h2>{t('auth.welcomeBack')}</h2>
                <p style={{ marginTop: '5px', marginBottom: '25px', color: '#64748b', fontSize: '0.95rem' }}>{t('auth.signInSubtitle')}</p>
                
                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleLogin} className="vertical-form">
                    <div className="auth-tabs">
                        <button type="button" className={`auth-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>{t('auth.student')}</button>
                        <button type="button" className={`auth-tab ${role === 'caretaker' ? 'active' : ''}`} onClick={() => setRole('caretaker')}>{t('auth.caretaker')}</button>
                        <button type="button" className={`auth-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>{t('auth.admin')}</button>
                    </div>

                    {role === 'admin' ? (
                        <>
                            <label htmlFor="loginName">{t('auth.adminEmailOrUsername')}</label>
                            <input 
                                type="text" 
                                id="loginName" 
                                placeholder={t('auth.adminEmailPlaceholder')} 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                required 
                            />
                        </>
                    ) : (
                        <>
                            <label htmlFor="loginName">{t('auth.emailOrName')}</label>
                            <input 
                                type="text" 
                                id="loginName" 
                                placeholder={t('auth.emailOrNamePlaceholder')} 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                            />
                        </>
                    )}

                    <label htmlFor="loginPassword">{t('auth.password')}</label>
                    <div style={{ position: 'relative', width: '100%', marginBottom: '15px' }}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            id="loginPassword" 
                            placeholder={t('auth.passwordPlaceholder')} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', paddingRight: '40px', marginBottom: 0 }}
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                            title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                    </div>

                    <button type="submit" className="primary-btn black-btn">{t('auth.signIn')}</button>
                    <p className="form-footer-text">
                        {role === 'caretaker' ? (
                            <>{t('auth.noCaretakerAccount')} <Link to="/register/caretaker">{t('auth.addYourHostel')}</Link></>
                        ) : (
                            <>{t('auth.noAccount')} <Link to="/register">{t('auth.signUpHere')}</Link></>
                        )}
                    </p>
                    {role === 'caretaker' && (
                        <p className="form-footer-text" style={{ marginTop: '0.5rem' }}>
                            {t('auth.wantToList')} <Link to="/register/caretaker">{t('auth.addYourHostelLink')}</Link>{t('auth.fillInOneStep')}
                        </p>
                    )}
                </form>
            </div>
        </section>
    );
};

export default Login;
