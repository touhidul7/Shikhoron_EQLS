import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // If already logged in as admin, redirect to dashboard
  React.useEffect(() => {
    api.get('/admin/session')
      .then(() => {
        navigate('/admin-dashboard', { replace: true });
      })
      .finally(() => setChecking(false));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/login', { email, password });
      navigate('/admin-dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  if (checking) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white shadow rounded p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Admin Login</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="border rounded px-3 py-2" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="border rounded px-3 py-2" />
          <button type="submit" className="bg-blue-700 text-white py-2 rounded hover:bg-blue-800">Login</button>
        </form>
        {error && <div className="text-red-600 mt-3 text-center">{error}</div>}
      </div>
    </div>
  );
}

export default AdminLogin;
