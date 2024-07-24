import React, { useState, useEffect, useCallback } from 'react';
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { FaTrash, FaKey, FaUserPlus } from 'react-icons/fa'; // Import icons
import './AddUserPage.css'; // Import your CSS for styling

function AddUserPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Add role state
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const auth = getAuth();
  const db = getFirestore(); // Initialize Firestore

  // Function to add a new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    setError(''); // Reset error state before attempting to add a user
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Add user data to Firestore with role
      await addDoc(collection(db, 'users'), {
        email,
        role, // Save role in Firestore
      });
      fetchUsers(); // Fetch updated list of users
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('Failed to add user. Please try again.');
      console.error('Error adding user:', err.message);
    }
  };

  // Function to delete a user
  const handleDeleteUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId); // Document reference
      await deleteDoc(userRef);
      fetchUsers(); // Fetch updated list of users
    } catch (err) {
      console.error('Error deleting user:', err.message);
    }
  };

  // Function to send a password reset email
  const handleResetPassword = async (userEmail) => {
    try {
      await sendPasswordResetEmail(auth, userEmail);
      alert('Password reset email sent!');
    } catch (err) {
      console.error('Error sending password reset email:', err.message);
    }
  };

  // Memoized function to fetch the list of users from Firestore
  const fetchUsers = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (err) {
      console.error('Error fetching users:', err.message);
    }
  }, [db]); // Add db to dependency array

  useEffect(() => {
    fetchUsers(); // Fetch users on component mount
  }, [fetchUsers]); // Add fetchUsers to dependency array

  return (
    <div className="user-management-page">
      <h2><FaUserPlus /> Add New User</h2>
      <form onSubmit={handleAddUser} className="user-form">
        {error && <p className="form-error">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="form-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="form-input"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="form-select"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="form-submit-button">Add User</button>
      </form>

      <h3>User List</h3>
      <table className="user-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => handleResetPassword(user.email)} className="action-button">
                  <FaKey /> Reset Password
                </button>
                <button onClick={() => handleDeleteUser(user.id)} className="action-button">
                  <FaTrash /> Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AddUserPage;
