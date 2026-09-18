import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, API_CONFIG } from '../services/api';
import { PhoneInput, digitsOnly, isValidPhoneNumber } from '../components/PhoneInput';

const Register = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', countryCode: '+256',
        kinName: '', kinPhone: '', kinCountryCode: '+256',
        gender: '', course: '', password: '', confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value});
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert(t('auth.passwordsNoMatch'));
            return;
        }

        const trimmedName = formData.name.trim();
        if (trimmedName.split(/\s+/).length < 2) {
            alert(t('auth.enterFullName'));
            return;
        }

        // Validate phone numbers - digits only and correct length
        const phone = digitsOnly(formData.phone);
        const kinPhone = digitsOnly(formData.kinPhone);
        if (!isValidPhoneNumber(phone, formData.countryCode)) {
            alert(t('auth.enterValidPhone'));
            return;
        }
        if (!isValidPhoneNumber(kinPhone, formData.kinCountryCode)) {
            alert(t('auth.enterValidKinPhone'));
            return;
        }

        try {
            const newUser = {
                username: formData.email.trim(), // Use email as username for uniqueness
                email: formData.email.trim(),
                phone: phone,
                country_code: formData.countryCode,
                password: formData.password,
                password_confirm: formData.confirmPassword,
                role: 'student',
                gender: formData.gender,
                program_of_study: formData.course,
                first_name: trimmedName.split(/\s+/)[0] || '',
                last_name: trimmedName.split(/\s+/).slice(1).join(' ') || '',
                next_of_kin_name: formData.kinName.trim(),
                next_of_kin_phone: kinPhone,
                next_of_kin_country_code: formData.kinCountryCode
            };

            const response = await api.post(API_CONFIG.AUTH.REGISTER, newUser);

            api.setToken(response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            alert(t('auth.accountCreated'));
            window.location.href = '/';
        } catch (error) {
            console.error('Registration error:', error);
            alert(t('auth.registrationFailed') + error.message);
        }
    };

    return (
        <section id="create-account" className="page-section active">
            <div className="form-container">
                <h2>{t('auth.signUp')}</h2>
                <p style={{ marginBottom: '20px', fontSize: '0.95rem', color: '#64748b' }}>{t('auth.joinBU')}</p>
                <form onSubmit={handleRegister} className="vertical-form">
                    
                    <h3 className="form-section-heading">{t('auth.personalDetails')}</h3>
                    <label htmlFor="name">{t('auth.name')}</label>
                    <input type="text" id="name" placeholder={t('auth.namePlaceholder')} value={formData.name} onChange={handleChange} required />

                    <label htmlFor="email">{t('auth.emailAddress')}</label>
                    <input type="email" id="email" placeholder={t('auth.emailPlaceholder')} value={formData.email} onChange={handleChange} required />

                    <label htmlFor="phone">{t('auth.phoneNumber')}</label>
                    <PhoneInput
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        countryCode={formData.countryCode}
                        onCountryCodeChange={handleChange}
                        countryCodeId="countryCode"
                    />

                    <label htmlFor="kinName">{t('auth.nextOfKinName')}</label>
                    <input type="text" id="kinName" placeholder={t('auth.kinNamePlaceholder')} value={formData.kinName} onChange={handleChange} required />

                    <label htmlFor="kinPhone">{t('auth.nextOfKinContact')}</label>
                    <PhoneInput
                        id="kinPhone"
                        value={formData.kinPhone}
                        onChange={handleChange}
                        countryCode={formData.kinCountryCode}
                        onCountryCodeChange={handleChange}
                        countryCodeId="kinCountryCode"
                    />

                    <h3 className="form-section-heading">{t('auth.academicInfo')}</h3>
                    <label htmlFor="gender">{t('auth.gender')}</label>
                    <select id="gender" value={formData.gender} onChange={handleChange} required>
                        <option value="">{t('auth.selectGender')}</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    
                    <label htmlFor="course">{t('auth.course')}</label>
                    <select id="course" value={formData.course} onChange={handleChange} required>
                        <option value="">{t('auth.selectCourse')}</option>
                        <option value="Bsc Computer Science">Bsc Computer Science</option>
                        <option value="Bsc Information Technology">Bsc Information Technology</option>
                        <option value="Business Administration">Business Administration</option>
                        <option value="Nursing">Nursing</option>
                        <option value="Theology">Theology</option>
                        <option value="Other">Other</option>
                    </select>

                    <h3 className="form-section-heading">{t('auth.security')}</h3>
                    <label htmlFor="password">{t('auth.password')}</label>
                    <div style={{ position: 'relative', width: '100%', marginBottom: '15px' }}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            id="password" 
                            minLength="8" 
                            placeholder={t('auth.passwordPlaceholderRegister')} 
                            value={formData.password} 
                            onChange={handleChange} 
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
                    
                    <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
                    <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
                        <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            id="confirmPassword" 
                            minLength="8" 
                            placeholder={t('auth.confirmPasswordPlaceholder')} 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            required 
                            style={{ width: '100%', paddingRight: '40px', marginBottom: 0 }}
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                            aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                            title={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                        >
                            {showConfirmPassword ? "🙈" : "👁️"}
                        </button>
                    </div>

                    <button type="submit" className="primary-btn black-btn">{t('auth.signUp')}</button>
                    <p className="form-footer-text">{t('auth.alreadyHaveAccount')} <Link to="/login">{t('auth.signInLink')}</Link></p>
                </form>
            </div>
        </section>
    );
};

export default Register;
