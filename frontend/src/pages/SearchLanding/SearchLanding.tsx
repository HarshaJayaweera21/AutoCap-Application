import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import './SearchLanding.css';

export const SearchLanding: React.FC = () => {
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchText.trim()) {
            navigate(`/search-results?query=${encodeURIComponent(searchText)}`);
        }
    };

    return (
        <div className="mds-page" style={{ overflowX: 'hidden' }}>
            <Header />
            <main className="mds-landing-main">
                {/* Hero Section */}
                <div className="mds-landing-intro">
                    <h1 className="mds-landing-title">
                        Curate Your Dataset
                    </h1>
                    <p className="mds-landing-subtitle">
                        Search across verified public datasets using captions to find exactly what your model needs.
                    </p>
                </div>

                {/* Search Container */}
                <div className="mds-landing-search-wrap">
                    <form className="mds-landing-search" onSubmit={handleSearch}>
                        <div className="mds-landing-search-icon">
                            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>search</span>
                        </div>
                        <input 
                            className="mds-search-input" 
                            placeholder="Search image captions (e.g. 'classroom')" 
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="mds-search-btn">
                            Search
                        </button>
                    </form>

                    {/* Annotation-based subtext */}
                    <div className="mds-search-subtext-wrap">
                        <p className="mds-search-subtext">
                            SEARCH ACROSS VERIFIED PUBLIC DATASETS USING CAPTIONS
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SearchLanding;
