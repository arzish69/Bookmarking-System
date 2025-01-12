import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Check, ArrowRight, Bookmark } from 'lucide-react';

const Recommendation = () => {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkFirstLogin = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/signup');
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && !userDoc.data().firstLogin) {
        // If not first login, redirect to library
        navigate('/library');
      }
    };

    checkFirstLogin();
  }, [navigate]);

  const handleContinue = async () => {
    if (selectedInterests.length >= 3) {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          interests: selectedInterests.map(interest => interest.name),
          firstLogin: false // Update first login flag
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
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">You're all set!</h2>
          <p className="text-gray-600 mb-6">
            We'll use your interests to recommend articles and content you'll love.
          </p>
          <button
            onClick={() => navigate('/library')}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to BookmarkHub</h1>
            <p className="text-gray-600">
              Select at least 3 topics you're interested in to help us personalize your experience
            </p>
          </div>
          <Bookmark className="w-12 h-12 text-blue-500" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {interests.map((interest) => (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest)}
              className={`
                relative p-4 rounded-lg border-2 text-center transition-all
                ${selectedInterests.includes(interest)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
                }
              `}
            >
              {selectedInterests.includes(interest) && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
              <div className="text-2xl mb-2">{interest.icon}</div>
              <div className="text-sm font-medium">{interest.name}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedInterests.length} of 3 minimum selected
          </div>
          <button
            onClick={handleContinue}
            disabled={selectedInterests.length < 3}
            className={`
              flex items-center px-6 py-3 rounded-lg font-medium transition-colors
              ${selectedInterests.length >= 3
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recommendation;