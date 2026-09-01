import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, API_CONFIG } from '../services/api';
import { PhoneInput, digitsOnly, isValidPhoneNumber } from '../components/PhoneInput';

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

        // Validate phone numbers - digits only and correct length
        const phone = digitsOnly(formData.phone);
        const kinPhone = digitsOnly(formData.kinPhone);
        if (!isValidPhoneNumber(phone, formData.countryCode)) {
            alert('Please enter a valid phone number (digits only, matching the selected country code).');
            return;
        }
        if (!isValidPhoneNumber(kinPhone, formData.kinCountryCode)) {
            alert('Please enter a valid next of kin phone number (digits only, matching the selected country code).');
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
                    <PhoneInput
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        countryCode={formData.countryCode}
                        onCountryCodeChange={handleChange}
                        countryCodeId="countryCode"
                    />

                    <label htmlFor="kinName">Next of Kin Name</label>
                    <input type="text" id="kinName" placeholder="e.g. Jane Mukasa" value={formData.kinName} onChange={handleChange} required />

                    <label htmlFor="kinPhone">Next of Kin Contact</label>
                    <PhoneInput
                        id="kinPhone"
                        value={formData.kinPhone}
                        onChange={handleChange}
                        countryCode={formData.kinCountryCode}
                        onCountryCodeChange={handleChange}
                        countryCodeId="kinCountryCode"
                    />

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
