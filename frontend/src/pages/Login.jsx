import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, API_CONFIG } from '../services/api';
import { displayUserName } from '../utils/userDisplayName';
import '../Login.css';

const Login = () => {
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            window.location.href = role === 'admin' ? '/admin' : '/';
        } catch (error) {
            console.error('Login error details:', error);
            const errorMsg = error.message || 'Check your credentials and try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="login" className="page-section active">
            <div className="form-container">
                <h2>Welcome Back</h2>
                <p style={{ marginTop: '5px', marginBottom: '25px', color: '#64748b', fontSize: '0.95rem' }}>Sign in to your BU Hostel account</p>
                
                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleLogin} className="vertical-form">
                    <div className="auth-tabs">
                        <button type="button" className={`auth-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>Student</button>
                        <button type="button" className={`auth-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>Admin</button>
                    </div>

                    {role === 'admin' ? (
                        <>
                            <label htmlFor="loginName">Admin email or username</label>
                            <input 
                                type="text" 
                                id="loginName" 
                                placeholder="e.g. admin@bugema.ac.ug" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                required 
                            />
                        </>
                    ) : (
                        <>
                            <label htmlFor="loginName">Full Name</label>
                            <input 
                                type="text" 
                                id="loginName" 
                                placeholder="e.g. John Mukasa" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                            />
                        </>
                    )}

                    <label htmlFor="loginPassword">Password</label>
                    <input type="password" id="loginPassword" placeholder="e.g. studentpass123" value={password} onChange={e => setPassword(e.target.value)} required />

                    <button type="submit" className="primary-btn black-btn">Sign In</button>
                    <p className="form-footer-text">No account? <Link to="/register">Sign up here</Link></p>
                </form>
            </div>
        </section>
    );
};

export default Login;
