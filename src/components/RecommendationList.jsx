import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RecommendationList = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Existing token management effect
  useEffect(() => {
    const getToken = async () => {
      if (user) {
        try {
          const newToken = await user.getIdToken(true);
          setToken(newToken);
        } catch (err) {
          console.error('Token error:', err);
          setError('Authentication error');
        }
      }
    };
    getToken();
  }, [user]);

  // Existing recommendations fetching effect
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user || !token) {
        setLoading(false);
        if (!user) setError('No user logged in');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/recommendations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        console.log('Received recommendations:', data);
        setRecommendations(data.recommendations || []);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, token]);

  const handleFeedback = async (isPositive) => {
    try {
      setHasFeedback(true);
      // Here you would typically send the feedback to your backend
      await fetch('http://localhost:8000/api/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPositive,
          recommendationIds: recommendations.map(r => r.id)
        }),
        credentials: 'include',
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const getCategoryText = (category) => {
    if (typeof category === 'string') return category;
    if (typeof category === 'object') {
      return category.term || category.label || '';
    }
    return '';
  };

  // Existing rendering conditions
  if (!user) {
    return <div className="text-center p-4">Please log in to see recommendations</div>;
  }

  if (loading) {
    return (
      <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Recommended Articles</h1>
      </div>
      
      {/* Keep the same margin and structure as the loaded state */}
      <h3 className="mb-4">Articles you may like to read:</h3>
      
      {/* Loading Placeholder Cards - exact same structure as loaded cards */}
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {[1, 2, 3].map((num) => (
          <div key={num} className="col">
            <div className="card h-100">
              {/* Match the image height from the loaded state */}
              <div className="placeholder-glow">
                <div className="placeholder col-12 bg-secondary" style={{ height: '200px' }} />
              </div>
              <div className="card-body">
                <div className="placeholder-glow">
                  <h5 className="card-title">
                    <span className="placeholder col-6"></span>
                  </h5>
                  <p className="card-text">
                    <span className="placeholder col-7 mb-1"></span>
                    <span className="placeholder col-4 mb-1"></span>
                    <span className="placeholder col-4 mb-1"></span>
                    <span className="placeholder col-6"></span>
                  </p>
                  <div className="d-flex justify-content-between align-items-center small text-muted">
                    <span className="placeholder col-3"></span>
                    <span className="placeholder col-2"></span>
                  </div>
                  <div className="mt-2">
                    <span className="placeholder col-2 me-1"></span>
                    <span className="placeholder col-2 me-1"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-muted mt-4 text-center">
        <p className="small fst-italic">
          "The best content is worth the wait. We're making sure you get exactly what you're interested in."
        </p>
      </div>
    </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center">
          <h1>Recommended Articles</h1>
        </div>
        <div className="text-center p-4 text-danger">Error: {error}</div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center">
          <h1>Recommended Articles</h1>
        </div>
        <div className="text-center p-4">No recommendations available</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h1>Recommended Articles</h1>
    </div>
    
    {/* Same margin as loading state */}
    <h3 className="mb-4">Articles you may like to read:</h3>
    
    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      {recommendations.map((article, index) => (
        <div key={index} className="col">
          <div className="card h-100">
            {article.thumbnail && (
              <img
                src={article.thumbnail}
                alt={article.title}
                className="card-img-top"
                style={{ height: '200px', objectFit: 'cover' }}
              />
            )}
            <div className="card-body">
              <h5 className="card-title">
                <a 
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  {article.title}
                </a>
              </h5>
              <p className="card-text small">{article.description}</p>
              <div className="d-flex justify-content-between align-items-center small text-muted">
                {article.author && <span>By {article.author}</span>}
                {article.published && (
                  <time dateTime={article.published}>
                    {new Date(article.published).toLocaleDateString()}
                  </time>
                )}
              </div>
              {article.categories && article.categories.length > 0 && (
                <div className="mt-2">
                  {article.categories.map((category, idx) => (
                    <span 
                      key={idx}
                      className="badge bg-secondary me-1"
                    >
                      {getCategoryText(category)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

      {/* Feedback Section */}
      <div className="card mt-5">
        <div className="card-body text-center py-4">
          {!feedbackSubmitted ? (
            <>
              <h3 className="h5 mb-4">
                How are these recommendations for you?
              </h3>
              <div className="d-flex justify-content-center gap-3">
                <button
                  onClick={() => handleFeedback(true)}
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                  disabled={hasFeedback}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M7 10v12"/>
                    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
                  </svg>
                  Just right
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                  disabled={hasFeedback}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M17 14V2"/>
                    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/>
                  </svg>
                  Not for me
                </button>
              </div>
            </>
          ) : (
            <p className="h5 mb-0">Thanks for your feedback!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationList;