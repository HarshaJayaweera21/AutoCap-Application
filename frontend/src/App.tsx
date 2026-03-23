import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import UserLoginBar from './components/UserLoginBar'
import './App.css'
import DatasetRepository from './components/DatasetRepository'
import DatasetExplorer from './components/DatasetExplorer'

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="app">
          <nav className="app-nav">
            <a href="/repository">Dataset Repository</a>
            <UserLoginBar />
          </nav>
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Navigate to="/repository" replace />} />
              <Route path="/repository" element={<DatasetRepository />} />
              <Route path="/explorer/:id" element={<DatasetExplorer />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </UserProvider>
  )
}

export default App
