import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, API_CONFIG } from '../services/api';
import { PhoneInput, digitsOnly, isValidPhoneNumber } from '../components/PhoneInput';

const SUBSCRIPTION_PRICE = 100000; // UGX per period (adjust as needed)
const SUBSCRIPTION_DAYS = 365; // 1 year

const CaretakerRegister = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', countryCode: '+256', gender: '',
        password: '', confirmPassword: '',
        hostelName: '', hostelType: '', price: '', genderPref: '', occupancy: '',
        caretakerPhone: '', description: '', facilities: '', location: '',
    });
    const [paidVia, setPaidVia] = useState('mobile_money');
    const [transactionId, setTransactionId] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [receiptFile, setReceiptFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.id]: e.target.value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError(t('caretakerRegister.passwordsNoMatch'));
            return;
        }
        if (formData.name.trim().split(/\s+/).length < 2) {
            setError(t('caretakerRegister.enterFullName'));
            return;
        }
        const phone = digitsOnly(formData.phone);
        if (!isValidPhoneNumber(phone, formData.countryCode)) {
            setError(t('caretakerRegister.enterValidPhone'));
            return;
        }

        const formPayload = new FormData();
        // Account
        formPayload.append('name', formData.name.trim());
        formPayload.append('email', formData.email.trim());
        formPayload.append('phone', phone);
        formPayload.append('gender', formData.gender);
        formPayload.append('password', formData.password);
        formPayload.append('password_confirm', formData.confirmPassword);
        // Hostel
        formPayload.append('hostel_name', formData.hostelName.trim());
        formPayload.append('hostel_type', formData.hostelType);
        formPayload.append('price', formData.price.trim());
        formPayload.append('gender_pref', formData.genderPref);
        if (formData.occupancy) formPayload.append('occupancy', formData.occupancy.trim());
        formPayload.append('caretaker_phone', formData.caretakerPhone.trim());
        formPayload.append('description', formData.description.trim());
        formPayload.append('facilities', formData.facilities.trim());
        formPayload.append('location', formData.location.trim());
        if (imageFile) formPayload.append('image', imageFile);
        // Subscription
        formPayload.append('amount_paid', SUBSCRIPTION_PRICE);
        formPayload.append('paid_via', paidVia);
        formPayload.append('start_date', new Date().toISOString().split('T')[0]);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + SUBSCRIPTION_DAYS);
        formPayload.append('end_date', endDate.toISOString().split('T')[0]);
        if (transactionId) formPayload.append('transaction_id', transactionId.trim());
        if (receiptFile) formPayload.append('receipt_image', receiptFile);

        setLoading(true);
        try {
            const response = await api.upload(API_CONFIG.HOSTELS.ONBOARD, formPayload, 'POST');
            setSuccess(
                response.message ||
                t('caretakerRegister.onboardSuccess')
            );
        } catch (err) {
            console.error('Onboarding error:', err);
            setError(err.message || t('caretakerRegister.submissionFailed'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <section id="caretaker-register" className="page-section active">
                <div className="form-container" style={{ maxWidth: '760px' }}>
                    <h2>{t('caretakerRegister.addYourHostel')}</h2>
                    <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>
                        <strong>{t('caretakerRegister.submitted')}</strong> {success}
                        <div style={{ marginTop: '0.75rem' }}>
                            <Link to="/login" className="primary-btn black-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                                {t('caretakerRegister.signIn')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="caretaker-register" className="page-section active">
            {!termsAccepted && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: '12px', maxWidth: '640px', width: '100%',
                        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                        padding: '2rem',
                    }}>
                        <h2 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.5rem' }}>{t('caretakerRegister.termsTitle')}</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                            {t('caretakerRegister.termsIntro')}
                        </p>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.95rem' }}>🏨 {t('caretakerRegister.listingSubscription')}</h4>
                                <p style={{ margin: 0, color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                                    {t('caretakerRegister.listingDesc', { price: SUBSCRIPTION_PRICE.toLocaleString() })}
                                </p>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.95rem' }}>💳 {t('caretakerRegister.paymentRefunds')}</h4>
                                <p style={{ margin: 0, color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                                    {t('caretakerRegister.paymentDesc')}
                                </p>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.95rem' }}>⚖️ {t('caretakerRegister.responsibilities')}</h4>
                                <p style={{ margin: 0, color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                                    {t('caretakerRegister.responsibilitiesDesc')}
                                </p>
                            </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '1.5rem', cursor: 'pointer', color: '#334155', fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={termsChecked}
                                onChange={(e) => setTermsChecked(e.target.checked)}
                                style={{ marginTop: '0.15rem', width: '17px', height: '17px' }}
                            />
                            <span>{t('caretakerRegister.agreeTerms')}</span>
                        </label>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                            <Link to="/" style={{
                                padding: '0.6rem 1.25rem', borderRadius: '6px', border: '1px solid #cbd5e1',
                                color: '#334155', textDecoration: 'none', fontSize: '0.9rem', background: '#fff',
                            }}>
                                {t('caretakerRegister.cancel')}
                            </Link>
                            <button
                                type="button"
                                className="primary-btn black-btn"
                                disabled={!termsChecked}
                                style={{ margin: 0, opacity: termsChecked ? 1 : 0.5 }}
                                onClick={() => setTermsAccepted(true)}
                            >
                                {t('caretakerRegister.agreeContinue')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="form-container" style={{ maxWidth: '760px' }}>
                <h2>{t('caretakerRegister.addYourHostel')}</h2>
                <p style={{ marginBottom: '20px', fontSize: '0.95rem', color: '#64748b' }}>
                    {t('caretakerRegister.createSubtitle')}
                </p>

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}

                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#075985', fontSize: '0.95rem' }}>{t('caretakerRegister.howItWorks')}</h4>
                    <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', fontSize: '0.88rem', lineHeight: 1.7 }}>
                        <li>{t('caretakerRegister.step1')}</li>
                        <li>{t('caretakerRegister.step2')}</li>
                        <li>{t('caretakerRegister.step3')}</li>
                    </ol>
                </div>

                <form onSubmit={handleSubmit} className="vertical-form">
                        <h3 className="form-section-heading">{t('caretakerRegister.section1')}</h3>
                        <label htmlFor="name">{t('caretakerRegister.fullName')}</label>
                        <input type="text" id="name" placeholder={t('caretakerRegister.namePlaceholder')} value={formData.name} onChange={handleChange} required />

                        <label htmlFor="email">{t('caretakerRegister.emailAddress')}</label>
                        <input type="email" id="email" placeholder={t('caretakerRegister.emailPlaceholder')} value={formData.email} onChange={handleChange} required />

                        <label htmlFor="phone">{t('caretakerRegister.phoneNumber')}</label>
                        <PhoneInput
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            countryCode={formData.countryCode}
                            onCountryCodeChange={handleChange}
                            countryCodeId="countryCode"
                        />

                        <label htmlFor="gender">{t('caretakerRegister.gender')}</label>
                        <select id="gender" value={formData.gender} onChange={handleChange} required>
                            <option value="">{t('caretakerRegister.selectGender')}</option>
                            <option value="Male">{t('common.male')}</option>
                            <option value="Female">{t('common.female')}</option>
                        </select>

                        <label htmlFor="password">{t('caretakerRegister.password')}</label>
                        <div style={{ position: 'relative', width: '100%', marginBottom: '15px' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                minLength="8"
                                placeholder={t('caretakerRegister.passwordPlaceholder')}
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
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>

                        <label htmlFor="confirmPassword">{t('caretakerRegister.confirmPassword')}</label>
                        <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                minLength="8"
                                placeholder={t('caretakerRegister.passwordPlaceholder')}
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
                            >
                                {showConfirmPassword ? "🙈" : "👁️"}
                            </button>
                        </div>

                        <h3 className="form-section-heading">{t('caretakerRegister.section2')}</h3>
                        <label htmlFor="hostelName">{t('caretakerRegister.hostelName')}</label>
                        <input type="text" id="hostelName" placeholder={t('caretakerRegister.hostelNamePlaceholder')} value={formData.hostelName} onChange={handleChange} required />

                        <label htmlFor="hostelType">{t('caretakerRegister.hostelType')}</label>
                        <select id="hostelType" value={formData.hostelType} onChange={handleChange} required>
                            <option value="">{t('caretakerRegister.selectType')}</option>
                            <option value="university">{t('caretakerRegister.university')}</option>
                            <option value="private">{t('caretakerRegister.private')}</option>
                        </select>

                        <label htmlFor="price">{t('caretakerRegister.price')}</label>
                        <input type="text" id="price" placeholder={t('caretakerRegister.pricePlaceholder')} value={formData.price} onChange={handleChange} required />

                        <label htmlFor="genderPref">{t('caretakerRegister.genderPreference')}</label>
                        <select id="genderPref" value={formData.genderPref} onChange={handleChange} required>
                            <option value="">{t('caretakerRegister.selectGenderPref')}</option>
                            <option value="Male">{t('common.male')}</option>
                            <option value="Female">{t('common.female')}</option>
                            <option value="Mixed">{t('caretakerRegister.mixed')}</option>
                        </select>

                        <label htmlFor="occupancy">{t('caretakerRegister.occupancy')}</label>
                        <input type="text" id="occupancy" placeholder={t('caretakerRegister.occupancyPlaceholder')} value={formData.occupancy} onChange={handleChange} />

                        <label htmlFor="caretakerPhone">{t('caretakerRegister.caretakerPhone')}</label>
                        <input type="text" id="caretakerPhone" placeholder={t('caretakerRegister.caretakerPhonePlaceholder')} value={formData.caretakerPhone} onChange={handleChange} required />

                        <label htmlFor="location">{t('caretakerRegister.location')}</label>
                        <input type="text" id="location" placeholder={t('caretakerRegister.locationPlaceholder')} value={formData.location} onChange={handleChange} />

                        <label htmlFor="description">{t('caretakerRegister.description')}</label>
                        <textarea id="description" rows="3" placeholder={t('caretakerRegister.descriptionPlaceholder')} value={formData.description} onChange={handleChange} />

                        <label htmlFor="facilities">{t('caretakerRegister.facilities')}</label>
                        <input type="text" id="facilities" placeholder={t('caretakerRegister.facilitiesPlaceholder')} value={formData.facilities} onChange={handleChange} />

                        <label>{t('caretakerRegister.hostelImage')}</label>
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />

                        <h3 className="form-section-heading">{t('caretakerRegister.section3')}</h3>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('caretakerRegister.subscriptionFee')}</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e3a8a' }}>
                                UGX {SUBSCRIPTION_PRICE.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                {t('caretakerRegister.perYear')}
                            </div>
                        </div>

                        <label>{t('caretakerRegister.paymentMethod')}</label>
                        <select value={paidVia} onChange={(e) => setPaidVia(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
                            <option value="mobile_money">{t('caretakerRegister.mobileMoney')}</option>
                            <option value="bank_transfer">{t('caretakerRegister.bankTransfer')}</option>
                            <option value="cash">{t('caretakerRegister.cash')}</option>
                            <option value="upload_receipt">{t('caretakerRegister.uploadReceipt')}</option>
                        </select>

                        {paidVia === 'mobile_money' && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                                    {t('caretakerRegister.momoInstruction', { price: SUBSCRIPTION_PRICE.toLocaleString() })}
                                </p>
                                <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('caretakerRegister.adminMomoNumber')}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#065f46', fontFamily: 'monospace' }}>0769559707</div>
                                </div>
                            </div>
                        )}

                        <label htmlFor="transactionId">{t('caretakerRegister.transactionId')}</label>
                        <input
                            type="text" id="transactionId"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder={t('caretakerRegister.transactionPlaceholder')}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                        />

                        <label>{t('caretakerRegister.uploadPaymentReceipt')}</label>
                        <input
                            type="file" accept=".pdf, image/*"
                            onChange={(e) => setReceiptFile(e.target.files[0])}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                        />

                        <button type="submit" className="primary-btn black-btn" disabled={loading}>
                            {loading ? t('caretakerRegister.submitting') : t('caretakerRegister.submitApproval')}
                        </button>
                        <p className="form-footer-text">
                            {t('caretakerRegister.alreadyCaretaker')} <Link to="/login">{t('caretakerRegister.signInLink')}</Link>
                        </p>
                    </form>
            </div>
        </section>
    );
};

export default CaretakerRegister;
