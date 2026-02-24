// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FeedbackForm from './components/feedback/FeedbackForm';
import FeedbackList from './components/feedback/FeedbackList';
import FeedbackDetail from './components/feedback/FeedbackDetail';
import FeedbackStats from './components/feedback/FeedbackStats';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <nav className="navbar">
                    <div className="nav-brand">
                        <Link to="/">AutoCap</Link>
                    </div>
                    <ul className="nav-links">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/feedback">Submit Feedback</Link></li>
                        <li><Link to="/admin/feedback">Manage Feedback</Link></li>
                    </ul>
                </nav>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/feedback" element={<FeedbackForm />} />
                        <Route path="/admin/feedback" element={<FeedbackList />} />
                        <Route path="/admin/feedback/:id" element={<FeedbackDetailWrapper />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

import { useParams } from 'react-router-dom';

function FeedbackDetailWrapper() {
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Invalid ID</div>;
    return <FeedbackDetail id={parseInt(id, 10)} />;
}


function Home() {
    return (
        <div className="home-container">
            <h1>Welcome to AutoCap</h1>
            <p className="tagline">Domain-Adaptive Multimodal Data Engine</p>

            <div className="features">
                <div className="feature-card">
                    <h3>Generate Captions</h3>
                    <p>Upload images and generate high-quality captions automatically</p>
                </div>

                <div className="feature-card">
                    <h3>Quality Filtering</h3>
                    <p>CLIP-based semantic validation ensures high-quality outputs</p>
                </div>

                <div className="feature-card">
                    <h3>Export Datasets</h3>
                    <p>Download validated image-caption pairs in JSON/CSV format</p>
                </div>
            </div>

            <div className="stats-wrapper">
                <FeedbackStats />
            </div>
        </div>
    );
}

export default App;