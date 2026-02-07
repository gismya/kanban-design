import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import App from './App'
import './index.css'
import { convex } from './lib/convexClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <HashRouter>
        <App />
      </HashRouter>
    </ConvexAuthProvider>
  </StrictMode>,
)
