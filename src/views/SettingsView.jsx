import React from 'react';

export default function SettingsView() {
    return (
        <div>
            <h2 className="title-font" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '20px' }}>Réglages</h2>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Aide à la catégorisation</span>
                    <input type="checkbox" style={{ width: 'auto' }} defaultChecked />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Notifications Quotidiennes (Android)</span>
                    <input type="checkbox" style={{ width: 'auto' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Heure du rappel</span>
                    <input type="time" defaultValue="08:00" style={{ width: 'auto', padding: '6px' }} />
                </div>
            </div>
        </div>
    );
}
