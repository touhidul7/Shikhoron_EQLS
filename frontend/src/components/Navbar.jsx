import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <nav className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-bold text-lg hover:text-blue-200">Home</Link>
        <Link to="/questions" className="hover:text-blue-200">Questions</Link>
        {user && <Link to="/ask" className="hover:text-blue-200">Ask</Link>}
        {user?.role === 'admin' && (
          <Link to="/admin-dashboard" className="hover:text-yellow-200 font-semibold">Admin Panel</Link>
        )}
        {user?.role === 'moderator' && (
          <Link to="/moderator-dashboard" className="hover:text-green-200 font-semibold">Moderator Panel</Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/profile" className="hover:text-blue-200">Profile</Link>
            <button onClick={onLogout} className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-blue-200">Login</Link>
            <Link to="/register" className="hover:text-blue-200">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
