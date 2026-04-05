import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../public/css/themes.css'
import '../../public/css/styles.css'
import App from './App'

const root = document.getElementById('root')
if (root == null) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
