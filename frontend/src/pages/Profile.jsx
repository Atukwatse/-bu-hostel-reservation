import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_CONFIG } from '../services/api';
import { PhoneInput, digitsOnly, isValidPhoneNumber } from '../components/PhoneInput';


const Profile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '',
        phone: '', countryCode: '+256',
        gender: '', course: '', yearOfStudy: '',
        kinName: '', kinPhone: '', kinCountryCode: '+256',
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const user = await api.get(API_CONFIG.USERS.PROFILE);
                setFormData({
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    countryCode: user.country_code || '+256',
                    gender: user.gender || '',
                    course: user.program_of_study || '',
                    yearOfStudy: user.year_of_study ? String(user.year_of_study) : '',
                    kinName: user.next_of_kin_name || '',
                    kinPhone: user.next_of_kin_phone || '',
                    kinCountryCode: user.next_of_kin_country_code || '+256',
                });
            } catch (error) {
                setMessage({ type: 'error', text: `Failed to load your profile: ${error.message}` });
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (`${formData.firstName} ${formData.lastName}`.trim().split(/\s+/).length < 2) {
            setMessage({ type: 'error', text: 'Please provide your full name (at least two names).' });
            return;
        }

        if (!isValidPhoneNumber(digitsOnly(formData.phone), formData.countryCode)) {
            setMessage({ type: 'error', text: 'Please enter a valid phone number (digits only, matching the selected country code).' });
            return;
        }
        if (formData.kinPhone.trim() && !isValidPhoneNumber(digitsOnly(formData.kinPhone), formData.kinCountryCode)) {
            setMessage({ type: 'error', text: 'Please enter a valid next of kin phone number (digits only, matching the selected country code).' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                username: formData.email.trim(),
                email: formData.email.trim(),
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                phone: digitsOnly(formData.phone),
                country_code: formData.countryCode,
                gender: formData.gender,
                program_of_study: formData.course,
                next_of_kin_name: formData.kinName.trim(),
                next_of_kin_phone: digitsOnly(formData.kinPhone),
                next_of_kin_country_code: formData.kinCountryCode,
            };
            if (formData.yearOfStudy) {
                payload.year_of_study = parseInt(formData.yearOfStudy, 10);
            }

            const updatedUser = await api.patch(API_CONFIG.USERS.UPDATE_PROFILE, payload);

            // Keep localStorage in sync so the rest of the app shows fresh data
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            setMessage({ type: 'error', text: `Update failed: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };

    if (!localStorage.getItem('authToken')) {
        return (
            <section className="page-section active">
                <div className="form-container" style={{ textAlign: 'center' }}>
                    <h2>My Profile</h2>
                    <p style={{ margin: '20px 0', color: '#64748b' }}>Please sign in to view and update your profile.</p>
                    <button className="primary-btn black-btn" onClick={() => navigate('/login')}>Sign In</button>
                </div>
            </section>
        );
    }

    if (loading) {
        return (
            <section className="page-section active">
                <div className="form-container" style={{ textAlign: 'center' }}>
                    <h2>My Profile</h2>
                    <p style={{ color: '#64748b' }}>Loading your profile...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="page-section active">
            <div className="form-container">
                <h2>My Profile</h2>
                <p style={{ marginBottom: '20px', fontSize: '0.95rem', color: '#64748b' }}>View and update your personal details and next of kin information.</p>

                {message && (
                    <div
                        role="alert"
                        style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '6px',
                            marginBottom: '1.25rem',
                            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: message.type === 'success' ? '#166534' : '#991b1b',
                            border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`,
                            fontWeight: 600,
                        }}
                    >
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="vertical-form">
                    <h3 className="form-section-heading">PERSONAL DETAILS</h3>

                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" placeholder="e.g. John" value={formData.firstName} onChange={handleChange} required />

                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" placeholder="e.g. Mukasa" value={formData.lastName} onChange={handleChange} required />

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

                    <label htmlFor="yearOfStudy">Year of Study</label>
                    <select id="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange}>
                        <option value="">Not specified</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                        <option value="5">Year 5</option>
                    </select>

                    <h3 className="form-section-heading">NEXT OF KIN (EMERGENCY CONTACT)</h3>

                    <label htmlFor="kinName">Next of Kin Name</label>
                    <input type="text" id="kinName" placeholder="e.g. Jane Mukasa" value={formData.kinName} onChange={handleChange} />

                    <label htmlFor="kinPhone">Next of Kin Contact</label>
                    <PhoneInput
                        id="kinPhone"
                        value={formData.kinPhone}
                        onChange={handleChange}
                        countryCode={formData.kinCountryCode}
                        onCountryCodeChange={handleChange}
                        countryCodeId="kinCountryCode"
                    />

                    <button type="submit" className="primary-btn black-btn" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default Profile;
