import React from 'react'
import ReactDOM from 'react-dom/client'
import { applyStoredUiPreferences } from './ui/theme/themeManager'
import './styles/index.css'
import { AppRoot } from './app/AppRoot'

applyStoredUiPreferences()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AppRoot /></React.StrictMode>,
)
