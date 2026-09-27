import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import i18n from './i18n'
import { initAutoTranslate } from './lib/autoTranslate'
import App from './App.tsx'
import { store } from './store'

// Hindi covers the whole site, including text not written as i18n keys.
initAutoTranslate(i18n)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
