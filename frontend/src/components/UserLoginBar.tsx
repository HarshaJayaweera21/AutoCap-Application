import { useState } from 'react';
import { useUser } from '../context/UserContext';
import './UserLoginBar.css';

export default function UserLoginBar() {
  const { userId, login, logout } = useUser();
  const [input, setInput] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(input, 10);
    if (!isNaN(n) && n > 0) {
      login(n);
      setInput('');
    }
  }

  return (
    <div className="user-login-bar">
      {userId != null ? (
        <div className="user-logged-in">
          <span className="user-badge">User ID: {userId}</span>
          <button type="button" className="btn-logout" onClick={logout}>
            Log out
          </button>
        </div>
      ) : (
        <form className="user-login-form" onSubmit={handleLogin}>
          <input
            type="number"
            placeholder="Enter User ID"
            min={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="user-id-input"
          />
          <button type="submit" className="btn-login">
            Log in
          </button>
        </form>
      )}
    </div>
  );
}
