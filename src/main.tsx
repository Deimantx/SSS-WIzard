import React from 'react'
import ReactDOM from 'react-dom/client'
import { applyStoredUiPreferences } from './ui/theme/themeManager'
import './styles/index.css'
import { GameShell } from './app/GameShell'

applyStoredUiPreferences()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><GameShell /></React.StrictMode>,
)
