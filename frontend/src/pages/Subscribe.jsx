import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, API_CONFIG } from '../services/api';

const SUBSCRIPTION_PRICE = 100000; // UGX per period (adjust as needed)
const SUBSCRIPTION_DAYS = 365; // 1 year

const Subscribe = () => {
    const { t } = useTranslation();
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
                alert(t('subscribe.onlyCaretakers'));
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
            alert(t('subscribe.subscriptionSubmitted'));
            setSubscription(res);
            fetchSubscription();
        } catch (err) {
            console.error('Subscription error:', err);
            setError(err.message || t('subscribe.submissionFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <section className="page-section active">
                <div style={{ textAlign: 'center', padding: '4rem' }}>{t('subscribe.loading')}</div>
            </section>
        );
    }

    return (
        <section id="subscribe" className="page-section active">
            <div className="form-container" style={{ maxWidth: '600px' }}>
                <h2>{t('subscribe.subscribeTitle')}</h2>
                <p style={{ marginBottom: '20px', fontSize: '0.95rem', color: '#64748b' }}>
                    {t('subscribe.subscribeSubtitle')}
                </p>

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}

                {hasActive ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>{t('subscribe.subscriptionActive')}</h3>
                        <p style={{ color: '#166534', fontSize: '0.95rem', margin: '0 0 ' }}>
                            {t('subscribe.canNowAdd')}
                        </p>
                        <p style={{ color: '#166534', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem 0' }}>
                            {t('subscribe.validUntil')} <strong>{subscription.end_date}</strong>
                        </p>
                        <button className="primary-btn black-btn" onClick={() => navigate('/admin')} style={{ width: 'auto', display: 'inline-block', margin: 0 }}>
                            {t('subscribe.goToHostelPanel')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1rem' }}>{t('subscribe.subscriptionFee')}</h3>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e3a8a' }}>
                                UGX {SUBSCRIPTION_PRICE.toLocaleString()}
                            </div>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                                {t('subscribe.perYear')}
                            </p>
                            <p style={{ margin: '0.75rem 0 0 0', color: '#475569', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                {t('subscribe.feeDescription')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="vertical-form">
                            <label>{t('subscribe.paymentMethod')}</label>
                            <select value={paidVia} onChange={(e) => setPaidVia(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
                                <option value="mobile_money">{t('subscribe.mobileMoney')}</option>
                                <option value="bank_transfer">{t('subscribe.bankTransfer')}</option>
                                <option value="cash">{t('subscribe.cash')}</option>
                                <option value="upload_receipt">{t('subscribe.uploadReceipt')}</option>
                            </select>

                            {paidVia === 'mobile_money' && (
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#475569' }}>
                                        {t('subscribe.momoInstruction', { amount: SUBSCRIPTION_PRICE.toLocaleString() })}
                                    </p>
                                    <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.75rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('subscribe.adminMomoNumber')}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#065f46', fontFamily: 'monospace' }}>0769559707</div>
                                    </div>
                                </div>
                            )}

                            <label htmlFor="amount">{t('subscribe.amountPaid')}</label>
                            <input
                                type="number" id="amount" required min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                            />

                            <label htmlFor="transactionId">{t('subscribe.transactionId')}</label>
                            <input
                                type="text" id="transactionId"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder={t('subscribe.transactionPlaceholder')}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                            />

                            <label>{t('subscribe.uploadReceiptLabel')}</label>
                            <input
                                type="file" accept=".pdf, image/*"
                                onChange={(e) => setReceiptFile(e.target.files[0])}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                            />

                            <button type="submit" className="primary-btn black-btn" disabled={submitting}>
                                {submitting ? t('subscribe.submitting') : t('subscribe.submitSubscription')}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </section>
    );
};

export default Subscribe;
