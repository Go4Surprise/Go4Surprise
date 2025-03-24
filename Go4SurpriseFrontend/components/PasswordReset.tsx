import { useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '@/constants/apiUrl';

// ESTE ARCHIVO HABRÍA QUE BORRARLO
// ESTE ARCHIVO HABRÍA QUE BORRARLO

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/password/reset/`, { email });
      setMessage('Password reset link has been sent to your email.');
    } catch (error) {
      setMessage('Error resetting password. Please try again.');
    }
  };

  return (
    <div className="password-reset-container">
      <h2>Reset Your Password</h2>
      <form onSubmit={handlePasswordReset}>
        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default PasswordReset;
