import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initDB } from './data/db.js'

// Initialize the database and then render
initDB().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}).catch(err => {
  console.error("Failed to init db", err);
  // fallback render?
});
