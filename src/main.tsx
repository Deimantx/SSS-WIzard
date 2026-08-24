import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { GameShell } from './app/GameShell'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><GameShell /></React.StrictMode>,
)
