import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, MoreVertical, Download, X } from 'lucide-react';
import { dbStore, dbOptions } from '../data/db';
import { useT } from '../i18n/LanguageContext';

export default function TutorialOverlay({ onClose }) {
    const [step, setStep] = useState(1);
    const [isVisible, setIsVisible] = useState(false);
    const t = useT();

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
        return () => setIsVisible(false);
    }, []);

    const handleClose = async () => {
        setIsVisible(false);
        try {
            const settings = await dbStore.getItem(dbOptions.SETTINGS) || {};
            await dbStore.setItem(dbOptions.SETTINGS, { ...settings, hasSeenTutorial: true });
        } catch (err) {
            console.error(err);
        }
        setTimeout(onClose, 300);
    };

    return (
        <div className={`tutorial-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="tutorial-modal">
                <button className="tutorial-close-btn" onClick={handleClose}>
                    <X size={24} />
                </button>

                {step === 1 && (
                    <div className="tutorial-content fade-enter fade-enter-active">
                        <h2 className="title-font" style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '8px' }}>
                            {t('tutorial', 'step1Title')}
                        </h2>
                        <p style={{ textAlign: 'center', color: 'var(--color-supporting)', marginBottom: '16px' }}>
                            {t('tutorial', 'step1Sub')}
                        </p>
                        <p style={{ textAlign: 'center', marginBottom: '24px', fontSize: '0.9rem', padding: '0 10px' }}>
                            {t('tutorial', 'step1Desc')}
                        </p>

                        <div className="tutorial-illustration">
                            <div className="os-section">
                                <h3>{t('tutorial', 'iosLabel')}</h3>
                                <div className="icon-row">
                                    <div className="icon-step">
                                        <Share size={28} />
                                        <span>{t('tutorial', 'shareLabel')}</span>
                                    </div>
                                    <div className="arrow">→</div>
                                    <div className="icon-step">
                                        <PlusSquare size={28} />
                                        <span>{t('tutorial', 'addLabel')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="os-section" style={{ marginTop: '24px' }}>
                                <h3>{t('tutorial', 'androidLabel')}</h3>
                                <div className="icon-row">
                                    <div className="icon-step">
                                        <MoreVertical size={28} />
                                        <span>{t('tutorial', 'menuLabel')}</span>
                                    </div>
                                    <div className="arrow">→</div>
                                    <div className="icon-step">
                                        <Download size={28} />
                                        <span>{t('tutorial', 'installLabel')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="tutorial-content fade-enter fade-enter-active" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                        <h2 className="title-font" style={{ fontSize: '2.5rem', alignSelf: 'center', marginBottom: '24px' }}>
                            {t('tutorial', 'step2Title')}
                        </h2>

                        <p style={{ marginBottom: '16px' }}>{t('tutorial', 'step2P1')}</p>

                        <p style={{ marginBottom: '16px' }}
                            dangerouslySetInnerHTML={{ __html: t('tutorial', 'step2P2') }}
                        />

                        <div style={{ backgroundColor: 'var(--color-background)', padding: '16px', borderRadius: '8px', marginBottom: '16px', width: '100%' }}>
                            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>{t('tutorial', 'step2BoxTitle')}</p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {['step2Li1', 'step2Li2', 'step2Li3', 'step2Li4', 'step2Li5'].map(key => (
                                    <li key={key} dangerouslySetInnerHTML={{ __html: t('tutorial', key) }} />
                                ))}
                                <li style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}
                                    dangerouslySetInnerHTML={{ __html: t('tutorial', 'step2Li6') }}
                                />
                            </ul>
                        </div>

                        <p style={{ marginBottom: '16px' }}>{t('tutorial', 'step2P3')}</p>
                        <p style={{ marginBottom: '24px' }}
                            dangerouslySetInnerHTML={{ __html: t('tutorial', 'step2P4') }}
                        />
                    </div>
                )}

                <div className="tutorial-footer">
                    <div className="tutorial-dots">
                        <div className={`dot ${step === 1 ? 'active' : ''}`} />
                        <div className={`dot ${step === 2 ? 'active' : ''}`} />
                    </div>

                    <button
                        className="btn-primary"
                        style={{ width: '100%' }}
                        onClick={step === 1 ? () => setStep(2) : handleClose}
                    >
                        {step === 1 ? t('tutorial', 'compris') : t('tutorial', 'commencer')}
                    </button>
                </div>
            </div>
        </div>
    );
}
