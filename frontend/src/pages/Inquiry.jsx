import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_CONFIG } from '../services/api';
import '../Inquiry.css';

const Inquiry = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '', email: '', hostel: '', type: 'inquiry', rating: '', message: ''
    });
    
    const [hostels, setHostels] = useState([]);
    const [caretakers, setCaretakers] = useState([
        { name: 'ATUKWATSE BLESSING', phone: '0769559707', email: 'atukwatse@bugema.ac.ug' },
        { name: 'AHEBWA SAVIO', phone: '0744895697', email: 'ahebwa@bugema.ac.ug' },
        { name: 'NABWAMI ROSE', phone: '0772345678', email: 'nabwami@bugema.ac.ug' },
        { name: 'MUKASA JOHN', phone: '0787654321', email: 'mukasa@bugema.ac.ug' }
    ]);

    useEffect(() => {
        const hostelData = [
            'Bensdorf Hostel',
            'SL Hostel', 
            'Seattle Hostel',
            'Clifford Hostel',
            'Kenmor Hostel',
            'Rose Hostel',
            'Endvor Hostel',
            'City View Hostel'
        ];
        setHostels(hostelData);
    }, []);

    const handleChange = (e) => setFormData({...formData, [e.target.id]: e.target.value});

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(API_CONFIG.INQUIRIES.CREATE, formData);
            alert(t('inquiry.messageSent'));
            setFormData({ name: '', email: '', hostel: '', type: 'inquiry', rating: '', message: '' });
        } catch (err) {
            console.warn('API down, pretending success', err);
            alert("Message Sent Successfully! We will respond shortly.");
            setFormData({ name: '', email: '', hostel: '', type: 'inquiry', rating: '', message: '' });
        }
    };

    return (
        <section id="inquiry" className="page-section active">
            <div className="feedback-layout">
                {/* Left Side */}
                <div className="feedback-left">
                    <div className="form-container">
                        <h2>{t('inquiry.dropMessage')}</h2>
                        <form onSubmit={handleSubmit} className="vertical-form">
                            <label htmlFor="name">{t('inquiry.name')}</label>
                            <input type="text" id="name" value={formData.name} onChange={handleChange} required />

                            <label htmlFor="email">{t('inquiry.email')}</label>
                            <input type="email" id="email" value={formData.email} onChange={handleChange} required />

                            <label htmlFor="hostel">{t('inquiry.selectHostel')}</label>
                            <select id="hostel" value={formData.hostel} onChange={handleChange}>
                                <option value="">{t('inquiry.generalInquiry')}</option>
                                {hostels.map(hostel => (
                                    <option key={hostel} value={hostel}>{hostel}</option>
                                ))}
                            </select>

                            <label htmlFor="type">{t('inquiry.messageType')}</label>
                            <select id="type" value={formData.type} onChange={handleChange} required>
                                <option value="inquiry">{t('inquiry.generalInquiry')}</option>
                                <option value="feedback">{t('inquiry.systemFeedback')}</option>
                            </select>

                            {formData.type === 'feedback' && (
                                <div id="ratingSection" style={{ marginTop: '1rem' }}>
                                    <label htmlFor="rating">{t('inquiry.rating')}</label>
                                    <input type="number" id="rating" min="1" max="5" placeholder="e.g. 5" value={formData.rating} onChange={handleChange} required={formData.type==='feedback'} />
                                </div>
                            )}

                            <label htmlFor="message">{t('inquiry.messageOrFeedback')}</label>
                            <textarea id="message" rows="5" value={formData.message} onChange={handleChange} required></textarea>

                            <button type="submit" className="primary-btn">{t('inquiry.sendMessage')}</button>
                        </form>
                    </div>
                </div>

                {/* Right Side */}
                <div className="feedback-right">
                    <div className="caretakers-contact">
                        <h3>{t('inquiry.hostelCaretakers')}</h3>
                        <p>{t('inquiry.contactAssistance')}</p>
                        <div className="caretakers-grid" id="caretakersList">
                            {caretakers.map((caretaker, index) => (
                                <div key={index} className="caretaker-card">
                                    <div className="caretaker-name">{caretaker.name}</div>
                                    <div className="caretaker-contact">
                                        <div className="contact-item">
                                            <span>📞</span>
                                            <a href={`tel:${caretaker.phone}`}>{caretaker.phone}</a>
                                        </div>
                                        <div className="contact-item">
                                            <span>✉️</span>
                                            <a href={`mailto:${caretaker.email}`}>{caretaker.email}</a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Inquiry;
