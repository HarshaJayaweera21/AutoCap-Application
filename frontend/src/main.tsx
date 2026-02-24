import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import DocumentationPage from './pages/DocumentationPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/docs" replace />} />
        <Route path="/docs" element={<DocumentationPage />} />
        <Route path="/docs/:id" element={<DocumentationPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
