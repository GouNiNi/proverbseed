import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, MoreVertical, Download, X, Tags, List, Sprout } from 'lucide-react';
import { dbStore, dbOptions } from '../data/db';

export default function TutorialOverlay({ onClose }) {
    const [step, setStep] = useState(1);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Petite animation d'entrée
        requestAnimationFrame(() => setIsVisible(true));
        return () => setIsVisible(false);
    }, []);

    const handleNext = () => {
        setStep(2);
    };

    const handleClose = async () => {
        setIsVisible(false);

        // Mettre à jour les paramètres pour dire que le tutoriel a été vu
        try {
            const settings = await dbStore.getItem(dbOptions.SETTINGS) || {};
            await dbStore.setItem(dbOptions.SETTINGS, { ...settings, hasSeenTutorial: true });
        } catch (err) {
            console.error(err);
        }

        setTimeout(onClose, 300); // Laisse le temps à l'animation de sortie
    };

    return (
        <div className={`tutorial-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="tutorial-modal">
                <button className="tutorial-close-btn" onClick={handleClose}>
                    <X size={24} />
                </button>

                {step === 1 && (
                    <div className="tutorial-content fade-enter fade-enter-active">
                        <h2 className="title-font" style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '8px' }}>Installer l'app</h2>
                        <p style={{ textAlign: 'center', color: 'var(--color-supporting)', marginBottom: '32px' }}>
                            (sur mon écran d'accueil)
                        </p>

                        <div className="tutorial-illustration">
                            <div className="os-section">
                                <h3>Sur iOS (Safari)</h3>
                                <div className="icon-row">
                                    <div className="icon-step">
                                        <Share size={28} className="bouncing-icon" />
                                        <span>Partager</span>
                                    </div>
                                    <div className="arrow">→</div>
                                    <div className="icon-step">
                                        <PlusSquare size={28} className="bouncing-icon" style={{ animationDelay: '0.2s' }} />
                                        <span>Sur l'écran d'accueil</span>
                                    </div>
                                </div>
                            </div>

                            <div className="os-section" style={{ marginTop: '24px' }}>
                                <h3>Sur Android (Chrome)</h3>
                                <div className="icon-row">
                                    <div className="icon-step">
                                        <MoreVertical size={28} className="bouncing-icon" />
                                        <span>Menu</span>
                                    </div>
                                    <div className="arrow">→</div>
                                    <div className="icon-step">
                                        <Download size={28} className="bouncing-icon" style={{ animationDelay: '0.2s' }} />
                                        <span>Installer l'app</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem' }}>
                            Installez ProverbSeed pour l'utiliser hors-ligne et y accéder rapidement.
                        </p>
                    </div>
                )}

                {step === 2 && (
                    <div className="tutorial-content fade-enter fade-enter-active" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                        <h2 className="title-font" style={{ fontSize: '2.5rem', alignSelf: 'center', marginBottom: '24px' }}>Utilisez l'app</h2>

                        <p style={{ marginBottom: '16px' }}>
                            C'est toujours un peu difficile de savoir comment lire les proverbes après le chapitre 9. Les prendre les uns à la suite des autres donne parfois le tournis, puisqu'on change de thème tous les versets.
                        </p>

                        <p style={{ marginBottom: '16px' }}>
                            ProverbSeed vous propose de passer sur l'ensemble des proverbes, à partir de 10.1 jusqu'à 29.27, et de les méditer à votre rythme pour laisser s'installer en vous, en leur donnant une ou des <strong>"étiquettes"</strong>.
                        </p>

                        <div style={{ backgroundColor: 'var(--color-background)', padding: '16px', borderRadius: '8px', marginBottom: '16px', width: '100%' }}>
                            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Une étiquette peut être ce que vous voulez :</p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li><strong>Thème :</strong> Parole, Travail, Réputation...</li>
                                <li><strong>Contexte :</strong> Au bureau, En famille, Conflits...</li>
                                <li><strong>Personne :</strong> Pierre, Marie (pour nos proches).</li>
                                <li><strong>Émotion :</strong> Joie, Colère, Découragement...</li>
                                <li><strong>Suivi :</strong> À méditer, Top, En progression...</li>
                                <li style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>À vous d'inventer les vôtres !</li>
                            </ul>
                        </div>

                        <p style={{ marginBottom: '16px' }}>
                            Vous retrouverez vos étiquettes avec la liste des proverbes associés. En les relisant par groupe, vous laisserez la sagesse de Dieu agir sur votre propre sagesse.
                        </p>

                        <p style={{ marginBottom: '24px' }}>
                            D'ici quelques mois, vous aurez couvert tous les proverbes et créé <strong>votre propre bibliothèque</strong> qui vous parle.
                        </p>
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
                        onClick={step === 1 ? handleNext : handleClose}
                    >
                        {step === 1 ? 'J\'ai compris' : 'Commencer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
