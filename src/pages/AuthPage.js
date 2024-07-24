import React, { useState } from 'react';
import { signInUser } from '../firebase'; // Ensure the correct path to your firebase.js file
import './AuthPage.css'; // Import your CSS for styling
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State to handle authentication errors
  const navigate = useNavigate(); // Initialize useNavigate for redirection

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Reset error state before attempting to login

    try {
      // Attempt to sign in user
      await signInUser(email, password);

      // Initialize auth and db
      const auth = getAuth();
      const db = getFirestore();

      // Check authentication state
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Fetch user role from Firestore
          const q = query(collection(db, 'users'), where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            
            if (userData.role === 'admin') {
              navigate('/dashboard'); // Redirect to dashboard for admin
            } else {
              navigate('/map'); // Redirect to map for other users
            }
          } else {
            // Handle case where user data is not found
            setError('User data not found.');
          }
        } else {
          // Handle case where user is not authenticated
          setError('User authentication failed.');
        }
      });
    } catch (err) {
      // Set the error message if login fails
      setError('Failed to login. Please check your email and password.');
      console.error('Login error:', err.message);
    }
  };

  return (
    <div className="auth-page">
        <nav className="navbar">
      <div className="navbar-title">
        <h1>Oascanner</h1>
      </div>
      </nav>
      <div className="background-image"></div>
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Login</h2>
          {error && <p className="error-message">{error}</p>} {/* Display error message */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Oascanner. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AuthPage;
