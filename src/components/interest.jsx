import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Check, ArrowRight, Bookmark } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Recommendation = () => {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();

  const MAX_SELECTIONS = 3;

  useEffect(() => {
    const checkFirstLogin = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/signup');
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && !userDoc.data().firstLogin) {
        navigate('/library');
      }
    };

    checkFirstLogin();
  }, [navigate]);

  const handleContinue = async () => {
    if (selectedInterests.length === MAX_SELECTIONS) {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          interests: selectedInterests.map(interest => interest.name),
          firstLogin: false
        });
        setIsComplete(true);
      }
    }
  };

  const interests = [
    { id: 1, name: 'Technology', icon: '💻' },
    { id: 2, name: 'Science', icon: '🔬' },
    { id: 3, name: 'Business', icon: '💼' },
    { id: 4, name: 'Arts', icon: '🎨' },
    { id: 5, name: 'Health', icon: '🏥' },
    { id: 6, name: 'Sports', icon: '⚽' },
    { id: 7, name: 'Politics', icon: '📰' },
    { id: 8, name: 'Education', icon: '📚' },
    { id: 9, name: 'Travel', icon: '✈️' },
    { id: 10, name: 'Food', icon: '🍳' },
    { id: 11, name: 'Music', icon: '🎵' },
    { id: 12, name: 'Movies', icon: '🎬' },
    { id: 13, name: 'Gaming', icon: '🎮' },
    { id: 14, name: 'Fashion', icon: '👗' },
    { id: 15, name: 'Environment', icon: '🌍' }
  ];

  const toggleInterest = (interest) => {
    setSelectedInterests(prevSelected => {
      // If already selected, remove it
      if (prevSelected.find(i => i.id === interest.id)) {
        return prevSelected.filter(i => i.id !== interest.id);
      }
      // If not selected and haven't reached max, add it
      if (prevSelected.length < MAX_SELECTIONS) {
        return [...prevSelected, interest];
      }
      // If already at max selections, don't add
      return prevSelected;
    });
  };

  const isInterestSelected = (interest) => {
    return selectedInterests.some(i => i.id === interest.id);
  };

  if (isComplete) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="card shadow-lg mx-auto" style={{ maxWidth: '400px' }}>
          <div className="card-body text-center p-4">
            <div className="rounded-circle bg-success bg-opacity-25 d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '64px', height: '64px' }}>
              <Check className="text-success" size={32} />
            </div>
            <h2 className="fw-bold mb-4 text-center">You're all set!</h2>
            <p className="text-muted mb-4">
              We'll use your interests to recommend articles and content you'll love.
            </p>
            <button
              onClick={() => navigate('/mainhome')}
              className="btn btn-primary w-100 py-2"
            >
              View some Articles !
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light d-flex flex-column align-items-center justify-content-center p-4">
      <div className="card shadow-lg w-100" style={{ maxWidth: '1200px' }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="display-6 fw-bold mb-2">Welcome to BookmarkHub</h1>
              <p className="text-muted">
                Select exactly 3 topics you're interested in to help us personalize your experience
              </p>
            </div>
            <Bookmark className="text-primary" size={48} />
          </div>

          <div className="row g-4 mb-4">
            {interests.map((interest) => (
              <div key={interest.id} className="col-6 col-md-4 col-lg-3">
                <button
                  onClick={() => toggleInterest(interest)}
                  disabled={!isInterestSelected(interest) && selectedInterests.length >= MAX_SELECTIONS}
                  className={`btn w-100 h-100 position-relative p-3 ${
                    isInterestSelected(interest)
                      ? 'btn-primary'
                      : selectedInterests.length >= MAX_SELECTIONS
                        ? 'btn-outline-secondary opacity-50'
                        : 'btn-outline-secondary'
                  }`}
                  style={{ minHeight: '120px' }}
                >
                  {isInterestSelected(interest) && (
                    <div className="position-absolute top-0 end-0 mt-2 me-2">
                      <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px' }}>
                        <Check className="text-primary" size={12} />
                      </div>
                    </div>
                  )}
                  <div className="fs-3 mb-2">{interest.icon}</div>
                  <div className="small fw-medium">{interest.name}</div>
                </button>
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              {selectedInterests.length} of {MAX_SELECTIONS} selected
            </small>
            <button
              onClick={handleContinue}
              disabled={selectedInterests.length !== MAX_SELECTIONS}
              className={`btn ${
                selectedInterests.length === MAX_SELECTIONS
                  ? 'btn-primary'
                  : 'btn-secondary opacity-50'
              } d-flex align-items-center px-4 py-2`}
            >
              Continue
              <ArrowRight className="ms-2" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendation;