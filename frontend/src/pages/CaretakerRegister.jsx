import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, API_CONFIG } from '../services/api';
import { PhoneInput, digitsOnly, isValidPhoneNumber } from '../components/PhoneInput';

const SUBSCRIPTION_PRICE = 100000; // UGX per period (adjust as needed)
const SUBSCRIPTION_DAYS = 365; // 1 year

const CaretakerRegister = () => {
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
            setError('Passwords do not match!');
            return;
        }
        if (formData.name.trim().split(/\s+/).length < 2) {
            setError('Please enter your full name (at least two names).');
            return;
        }
        const phone = digitsOnly(formData.phone);
        if (!isValidPhoneNumber(phone, formData.countryCode)) {
            setError('Please enter a valid phone number (digits only, matching the selected country code).');
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
                'Your account, hostel and subscription request were submitted. ' +
                'Please wait for the system admin to verify your payment and publish your hostel.'
            );
        } catch (err) {
            console.error('Onboarding error:', err);
            setError(err.message || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <section id="caretaker-register" className="page-section active">
                <div className="form-container" style={{ maxWidth: '760px' }}>
                    <h2>Add Your Hostel</h2>
                    <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>
                        <strong>Submitted!</strong> {success}
                        <div style={{ marginTop: '0.75rem' }}>
                            <Link to="/login" className="primary-btn black-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                                Sign in
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
                        <h2 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.5rem' }}>Terms &amp; Conditions</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                            Please read and accept these conditions before you continue to add your hostel.
                        </p>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.95rem' }}>🏨 Listing &amp; Subscription</h4>
                                <p style={{ margin: 0, color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                                    Your hostel will be shown on the site immediately. You have <strong>4 days (grace period)</strong> to pay the
                                    subscription fee of <strong>UGX {SUBSCRIPTION_PRICE.toLocaleString()}</strong>. If you do not pay within that time,
                                    your hostel will be removed from the site.
                                </p>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.95rem' }}>💳 Payment &amp; Refunds</h4>
                                <p style={{ margin: 0, color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                                    Hostel bookings are paid to you directly. If a student does not like their room at check-in, you agree to
                                    <strong> refund their money</strong>.
                                </p>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.95rem' }}>⚖️ Your Responsibilities</h4>
                                <p style={{ margin: 0, color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
                                    Keep your hostel information accurate and up to date, manage your bookings responsibly, and follow the
                                    rules of Bugema University.
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
                            <span>I have read and agree to the Terms &amp; Conditions above.</span>
                        </label>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                            <Link to="/" style={{
                                padding: '0.6rem 1.25rem', borderRadius: '6px', border: '1px solid #cbd5e1',
                                color: '#334155', textDecoration: 'none', fontSize: '0.9rem', background: '#fff',
                            }}>
                                Cancel
                            </Link>
                            <button
                                type="button"
                                className="primary-btn black-btn"
                                disabled={!termsChecked}
                                style={{ margin: 0, opacity: termsChecked ? 1 : 0.5 }}
                                onClick={() => setTermsAccepted(true)}
                            >
                                I Agree, Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="form-container" style={{ maxWidth: '760px' }}>
                <h2>Add Your Hostel</h2>
                <p style={{ marginBottom: '20px', fontSize: '0.95rem', color: '#64748b' }}>
                    Create your caretaker account, list your hostel, and pay the subscription fee — all in one step.
                </p>

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}

                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#075985', fontSize: '0.95rem' }}>How it works</h4>
                    <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', fontSize: '0.88rem', lineHeight: 1.7 }}>
                        <li>Fill in your account, hostel and payment details below.</li>
                        <li>Your hostel appears on the site right away. Pay the subscription fee within <strong>4 days</strong> to keep it listed.</li>
                        <li>Once the admin verifies your payment, your subscription is activated and your hostel stays on the site.</li>
                    </ol>
                </div>

                <form onSubmit={handleSubmit} className="vertical-form">
                        <h3 className="form-section-heading">1. YOUR ACCOUNT</h3>
                        <label htmlFor="name">Full Name</label>
                        <input type="text" id="name" placeholder="e.g. John Doe" value={formData.name} onChange={handleChange} required />

                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" placeholder="e.g. caretaker@example.com" value={formData.email} onChange={handleChange} required />

                        <label htmlFor="phone">Phone Number</label>
                        <PhoneInput
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            countryCode={formData.countryCode}
                            onCountryCodeChange={handleChange}
                            countryCodeId="countryCode"
                        />

                        <label htmlFor="gender">Gender</label>
                        <select id="gender" value={formData.gender} onChange={handleChange} required>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>

                        <label htmlFor="password">Password</label>
                        <div style={{ position: 'relative', width: '100%', marginBottom: '15px' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                minLength="8"
                                placeholder="Min 8 characters"
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
                                placeholder="Min 8 characters"
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
                            >
                                {showConfirmPassword ? "🙈" : "👁️"}
                            </button>
                        </div>

                        <h3 className="form-section-heading">2. YOUR HOSTEL</h3>
                        <label htmlFor="hostelName">Hostel Name</label>
                        <input type="text" id="hostelName" placeholder="e.g. Green Valley Hostel" value={formData.hostelName} onChange={handleChange} required />

                        <label htmlFor="hostelType">Hostel Type</label>
                        <select id="hostelType" value={formData.hostelType} onChange={handleChange} required>
                            <option value="">Select type</option>
                            <option value="university">University</option>
                            <option value="private">Private</option>
                        </select>

                        <label htmlFor="price">Price (per semester)</label>
                        <input type="text" id="price" placeholder="e.g. UGX 750,000 /sem" value={formData.price} onChange={handleChange} required />

                        <label htmlFor="genderPref">Gender Preference</label>
                        <select id="genderPref" value={formData.genderPref} onChange={handleChange} required>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Mixed">Mixed</option>
                        </select>

                        <label htmlFor="occupancy">Occupancy (optional)</label>
                        <input type="text" id="occupancy" placeholder="e.g. 45/60 Occupied" value={formData.occupancy} onChange={handleChange} />

                        <label htmlFor="caretakerPhone">Caretaker / Contact Phone</label>
                        <input type="text" id="caretakerPhone" placeholder="e.g. 0700123456" value={formData.caretakerPhone} onChange={handleChange} required />

                        <label htmlFor="location">Location</label>
                        <input type="text" id="location" placeholder="e.g. Bugema, Kayunga Rd" value={formData.location} onChange={handleChange} />

                        <label htmlFor="description">Description</label>
                        <textarea id="description" rows="3" placeholder="Briefly describe your hostel..." value={formData.description} onChange={handleChange} />

                        <label htmlFor="facilities">Facilities (comma-separated)</label>
                        <input type="text" id="facilities" placeholder="e.g. Wifi, Water, Security, Dining" value={formData.facilities} onChange={handleChange} />

                        <label>Hostel Image</label>
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />

                        <h3 className="form-section-heading">3. SUBSCRIPTION PAYMENT</h3>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Subscription Fee</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e3a8a' }}>
                                UGX {SUBSCRIPTION_PRICE.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                per {SUBSCRIPTION_DAYS === 365 ? 'year' : `${SUBSCRIPTION_DAYS} days`}
                            </div>
                        </div>

                        <label>Payment Method</label>
                        <select value={paidVia} onChange={(e) => setPaidVia(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="upload_receipt">I have already paid (Upload Receipt)</option>
                        </select>

                        {paidVia === 'mobile_money' && (
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                                    Send <strong>UGX {SUBSCRIPTION_PRICE.toLocaleString()}</strong> to the admin's mobile money number below, then enter the transaction details.
                                </p>
                                <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Admin Mobile Money Number</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#065f46', fontFamily: 'monospace' }}>0769559707</div>
                                </div>
                            </div>
                        )}

                        <label htmlFor="transactionId">Transaction / Reference ID</label>
                        <input
                            type="text" id="transactionId"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="e.g. MP240622.1430.A67890"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                        />

                        <label>Upload Payment Receipt</label>
                        <input
                            type="file" accept=".pdf, image/*"
                            onChange={(e) => setReceiptFile(e.target.files[0])}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                        />

                        <button type="submit" className="primary-btn black-btn" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit & Request Approval'}
                        </button>
                        <p className="form-footer-text">
                            Already a caretaker? <Link to="/login">Sign in</Link>
                        </p>
                    </form>
            </div>
        </section>
    );
};

export default CaretakerRegister;

