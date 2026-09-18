import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'lg', name: 'Luganda' },
    { code: 'zh', name: '中文' },
    { code: 'fr', name: 'Français' },
    { code: 'sw', name: 'Kiswahili' },
];

const LanguageSelector = () => {
    const { i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en';
    const current = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code) => {
        i18n.changeLanguage(code);
        setOpen(false);
    };

    return (
        <div className="lang-selector" ref={containerRef}>
            <button
                type="button"
                className="lang-selector-trigger"
                onClick={() => setOpen(!open)}
                aria-haspopup="true"
                aria-expanded={open}
                title="Select language / Salawo olulimi / 选择语言"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="lang-icon">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                <span className="lang-trigger-name">{current.name}</span>
                <span className="lang-caret">▾</span>
            </button>
            {open && (
                <div className="lang-selector-dropdown">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            type="button"
                            className={`lang-option ${lang.code === currentLang ? 'active' : ''}`}
                            onClick={() => handleSelect(lang.code)}
                        >
                            <span className="lang-name">{lang.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
