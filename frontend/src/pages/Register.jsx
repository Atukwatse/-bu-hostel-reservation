import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, API_CONFIG } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
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
            alert('Passwords do not match!');
            return;
        }

        const trimmedName = formData.name.trim();
        if (trimmedName.split(/\s+/).length < 2) {
            alert('Please enter your full name (at least two names).');
            return;
        }

        // Validate phone numbers - digits only
        const phoneRegex = /^\d+$/;
        if (!phoneRegex.test(formData.phone.trim())) {
            alert('Phone number must contain only digits (no letters or special characters).');
            return;
        }
        if (!phoneRegex.test(formData.kinPhone.trim())) {
            alert('Next of kin phone number must contain only digits (no letters or special characters).');
            return;
        }

        // Validate phone length (minimum 6 digits for most countries)
        if (formData.phone.trim().length < 6) {
            alert('Phone number must be at least 6 digits long.');
            return;
        }
        if (formData.kinPhone.trim().length < 6) {
            alert('Next of kin phone number must be at least 6 digits long.');
            return;
        }

        try {
            const newUser = {
                username: formData.email.trim(), // Use email as username for uniqueness
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                country_code: formData.countryCode,
                password: formData.password,
                password_confirm: formData.confirmPassword,
                role: 'student',
                gender: formData.gender,
                program_of_study: formData.course,
                first_name: trimmedName.split(/\s+/)[0] || '',
                last_name: trimmedName.split(/\s+/).slice(1).join(' ') || '',
                next_of_kin_name: formData.kinName.trim(),
                next_of_kin_phone: formData.kinPhone.trim(),
                next_of_kin_country_code: formData.kinCountryCode
            };

            const response = await api.post(API_CONFIG.AUTH.REGISTER, newUser);

            api.setToken(response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            alert('Account created successfully! You are now logged in.');
            window.location.href = '/';
        } catch (error) {
            console.error('Registration error:', error);
            alert(`Registration failed: ${error.message}`);
        }
    };

    return (
        <section id="create-account" className="page-section active">
            <div className="form-container">
                <h2>Sign Up</h2>
                <p style={{ marginBottom: '20px', fontSize: '0.95rem', color: '#64748b' }}>Join BU Online Hostel Booking</p>
                <form onSubmit={handleRegister} className="vertical-form">
                    
                    <h3 className="form-section-heading">PERSONAL DETAILS</h3>
                    <label htmlFor="name">Name</label>
                    <input type="text" id="name" placeholder="e.g. John Mukasa" value={formData.name} onChange={handleChange} required />

                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" placeholder="e.g. john.mukasa@gmail.com" value={formData.email} onChange={handleChange} required />

                    <label htmlFor="phone">Phone Number</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select id="countryCode" value={formData.countryCode} onChange={handleChange} required style={{ width: '30%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                            <option value="">Select Country</option>
                            <optgroup label="East Africa">
                                <option value="+256" selected>🇺🇬 Uganda (+256)</option>
                                <option value="+250">🇷🇼 Rwanda (+250)</option>
                                <option value="+255">🇹🇿 Tanzania (+255)</option>
                                <option value="+254">🇰🇪 Kenya (+254)</option>
                                <option value="+211">🇸🇸 South Sudan (+211)</option>
                                <option value="+257">🇧🇮 Burundi (+257)</option>
                            </optgroup>
                            <optgroup label="West Africa">
                                <option value="+234">🇳🇬 Nigeria (+234)</option>
                                <option value="+233">🇬🇭 Ghana (+233)</option>
                                <option value="+225">🇨🇮 Côte d'Ivoire (+225)</option>
                                <option value="+229">🇧🇯 Benin (+229)</option>
                            </optgroup>
                            <optgroup label="Southern Africa">
                                <option value="+27">🇿🇦 South Africa (+27)</option>
                                <option value="+263">🇿🇼 Zimbabwe (+263)</option>
                                <option value="+260">🇿🇲 Zambia (+260)</option>
                                <option value="+265">🇲🇼 Malawi (+265)</option>
                            </optgroup>
                            <optgroup label="International">
                                <option value="+1">🇺🇸 United States (+1)</option>
                                <option value="+44">🇬🇧 United Kingdom (+44)</option>
                                <option value="+33">🇫🇷 France (+33)</option>
                                <option value="+49">🇩🇪 Germany (+49)</option>
                                <option value="+91">🇮🇳 India (+91)</option>
                                <option value="+86">🇨🇳 China (+86)</option>
                            </optgroup>
                        </select>
                        <input type="tel" id="phone" placeholder="e.g. 712345678" style={{ flex: 1 }} value={formData.phone} onChange={handleChange} required />
                    </div>

                    <label htmlFor="kinName">Next of Kin Name</label>
                    <input type="text" id="kinName" placeholder="e.g. Jane Mukasa" value={formData.kinName} onChange={handleChange} required />

                    <label htmlFor="kinPhone">Next of Kin Contact</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select id="kinCountryCode" value={formData.kinCountryCode} onChange={handleChange} required style={{ width: '30%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                            <option value="">Select Country</option>
                            <optgroup label="East Africa">
                                <option value="+256" selected>🇺🇬 Uganda (+256)</option>
                                <option value="+250">🇷🇼 Rwanda (+250)</option>
                                <option value="+255">🇹🇿 Tanzania (+255)</option>
                                <option value="+254">🇰🇪 Kenya (+254)</option>
                                <option value="+211">🇸🇸 South Sudan (+211)</option>
                                <option value="+257">🇧🇮 Burundi (+257)</option>
                            </optgroup>
                            <optgroup label="West Africa">
                                <option value="+234">🇳🇬 Nigeria (+234)</option>
                                <option value="+233">🇬🇭 Ghana (+233)</option>
                                <option value="+225">🇨🇮 Côte d'Ivoire (+225)</option>
                                <option value="+229">🇧🇯 Benin (+229)</option>
                            </optgroup>
                            <optgroup label="Southern Africa">
                                <option value="+27">🇿🇦 South Africa (+27)</option>
                                <option value="+263">🇿🇼 Zimbabwe (+263)</option>
                                <option value="+260">🇿🇲 Zambia (+260)</option>
                                <option value="+265">🇲🇼 Malawi (+265)</option>
                            </optgroup>
                            <optgroup label="International">
                                <option value="+1">🇺🇸 United States (+1)</option>
                                <option value="+44">🇬🇧 United Kingdom (+44)</option>
                                <option value="+33">🇫🇷 France (+33)</option>
                                <option value="+49">🇩🇪 Germany (+49)</option>
                                <option value="+91">🇮🇳 India (+91)</option>
                                <option value="+86">🇨🇳 China (+86)</option>
                            </optgroup>
                        </select>
                        <input type="tel" id="kinPhone" placeholder="e.g. 712345678" style={{ flex: 1 }} value={formData.kinPhone} onChange={handleChange} required />
                    </div>

                    <h3 className="form-section-heading">ACADEMIC INFO</h3>
                    <label htmlFor="gender">Gender</label>
                    <select id="gender" value={formData.gender} onChange={handleChange} required>
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    
                    <label htmlFor="course">Course / Programme</label>
                    <select id="course" value={formData.course} onChange={handleChange} required>
                        <option value="">Select course</option>
                        <option value="Bsc Computer Science">Bsc Computer Science</option>
                        <option value="Bsc Information Technology">Bsc Information Technology</option>
                        <option value="Business Administration">Business Administration</option>
                        <option value="Nursing">Nursing</option>
                        <option value="Theology">Theology</option>
                        <option value="Other">Other</option>
                    </select>

                    <h3 className="form-section-heading">SECURITY</h3>
                    <label htmlFor="password">Password</label>
                    <div style={{ position: 'relative', width: '100%', marginBottom: '15px' }}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            id="password" 
                            minLength="8" 
                            placeholder="e.g. SecurePass123! (Min 8 characters)" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            style={{ width: '100%', paddingRight: '40px', marginBottom: 0 }}
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            title={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                    </div>
                    
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
                        <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            id="confirmPassword" 
                            minLength="8" 
                            placeholder="e.g. SecurePass123!" 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            required 
                            style={{ width: '100%', paddingRight: '40px', marginBottom: 0 }}
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            title={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                            {showConfirmPassword ? "🙈" : "👁️"}
                        </button>
                    </div>

                    <button type="submit" className="primary-btn black-btn">Sign Up</button>
                    <p className="form-footer-text">Already have an account? <Link to="/login">Sign in</Link></p>
                </form>
            </div>
        </section>
    );
};

export default Register;
