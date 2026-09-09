import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, API_CONFIG } from '../services/api';

const SUBSCRIPTION_PRICE = 100000; // UGX per period (adjust as needed)
const SUBSCRIPTION_DAYS = 365; // 1 year

const Subscribe = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paidVia, setPaidVia] = useState('mobile_money');
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState(SUBSCRIPTION_PRICE);
    const [receiptFile, setReceiptFile] = useState(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const u = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (!u) {
                window.location.href = '/login';
                return false;
            }
            if (u.role !== 'caretaker') {
                alert('Only caretakers can subscribe to list hostels.');
                window.location.href = '/';
                return false;
            }
            return true;
        };
        if (checkAuth()) {
            fetchSubscription();
        }
    }, []);

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            const res = await api.get(API_CONFIG.SUBSCRIPTIONS.MY_SUBSCRIPTION);
            setSubscription(res.subscription || null);
        } catch (e) {
            console.error('Failed to load subscription:', e);
        } finally {
            setLoading(false);
        }
    };

    const hasActive = subscription &&
        subscription.status === 'active' &&
        new Date(subscription.start_date) <= new Date() &&
        new Date(subscription.end_date) >= new Date();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData();
        formData.append('amount_paid', amount);
        formData.append('paid_via', paidVia);
        formData.append('start_date', new Date().toISOString().split('T')[0]);

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + SUBSCRIPTION_DAYS);
        formData.append('end_date', endDate.toISOString().split('T')[0]);

        if (transactionId) formData.append('transaction_id', transactionId);
        if (receiptFile) formData.append('receipt_image', receiptFile);

        setSubmitting(true);
        try {
            const res = await api.upload(API_CONFIG.SUBSCRIPTIONS.CREATE, formData, 'POST');
            alert('Subscription request submitted!\n\nThe system admin will verify your payment and activate your subscription. Once active, you\'ll be able to add and manage your hostel.');
            setSubscription(res);
            fetchSubscription();
        } catch (err) {
            console.error('Subscription error:', err);
            setError(err.message || 'Failed to submit subscription. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <section className="page-section active">
                <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>
            </section>
        );
    }

    return (
        <section id="subscribe" className="page-section active">
            <div className="form-container" style={{ maxWidth: '600px' }}>
                <h2>Subscribe to List Your Hostel</h2>
                <p style={{ marginBottom: '20px', fontSize: '0.95rem', color: '#64748b' }}>
                    Pay a subscription fee to the system admin so your hostel can be listed, monitored, and receive bookings on our site.
                </p>

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}

                {hasActive ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Your Subscription is Active</h3>
                        <p style={{ color: '#166534', fontSize: '0.95rem', margin: '0 0 ' }}>
                            You can now add and manage your hostel on our site.
                        </p>
                        <p style={{ color: '#166534', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem 0' }}>
                            Valid until: <strong>{subscription.end_date}</strong>
                        </p>
                        <button className="primary-btn black-btn" onClick={() => navigate('/admin')} style={{ width: 'auto', display: 'inline-block', margin: 0 }}>
                            Go to My Hostel Panel
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1rem' }}>Subscription Fee</h3>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e3a8a' }}>
                                UGX {SUBSCRIPTION_PRICE.toLocaleString()}
                            </div>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                                per {SUBSCRIPTION_DAYS === 365 ? 'year' : `${SUBSCRIPTION_DAYS} days`}
                            </p>
                            <p style={{ margin: '0.75rem 0 0 0', color: '#475569', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                This fee is paid by caretakers/hostel owners to the system admin (Dean of Students) to keep their hostels listed, monitored, and receiving bookings on the BU Hostel Booking site.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="vertical-form">
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

                            <label htmlFor="amount">Amount Paid (UGX)</label>
                            <input
                                type="number" id="amount" required min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                            />

                            <label htmlFor="transactionId">Transaction / Reference ID</label>
                            <input
                                type="text" id="transactionId"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="e.g. MP240622.1430.A67890"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                            />

                            <label>Upload Receipt</label>
                            <input
                                type="file" accept=".pdf, image/*"
                                onChange={(e) => setReceiptFile(e.target.files[0])}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                            />

                            <button type="submit" className="primary-btn black-btn" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Subscription'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </section>
    );
};

export default Subscribe;
