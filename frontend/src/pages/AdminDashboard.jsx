import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [newModeratorEmail, setNewModeratorEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(null); // null=loading, false=not logged in, true=logged in
  const [newModeratorPassword, setNewModeratorPassword] = useState('');
  const navigate = useNavigate();
  const handlePromoteToModerator = async (userId) => {
    setPromoting(true);
    try {
      const user = users.find(u => u._id === userId);
      await api.post('/admin/add-moderator', { email: user.email });
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch {
      setError('Failed to promote user');
    }
    setPromoting(false);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  useEffect(() => {
    // Check admin session
    api.get('/admin/session')
      .then(() => {
        setAdminLoggedIn(true);
        // Fetch users if admin
        api.get('/admin/users')
          .then(res => setUsers(res.data.users))
          .catch(() => setError('Failed to fetch users'))
          .finally(() => setLoading(false));
      })
      .catch(() => {
        setAdminLoggedIn(false);
        setLoading(false);
      });
  }, []);

  const handleSuspendUser = async (userId, suspend) => {
    if (!window.confirm(suspend ? 'Suspend this user?' : 'Unsuspend this user?')) return;
    try {
      await api.post(`/admin/suspend-user/${userId}`, { suspend });
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch {
      setError('Failed to update user suspension');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/user/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
    } catch {
      setError('Failed to delete user');
    }
  };

  const handleAddModerator = async () => {
    if (!newModeratorEmail || !newModeratorPassword) return;
    setAdding(true);
    try {
      await api.post('/admin/add-moderator', { email: newModeratorEmail, password: newModeratorPassword });
      // Refresh user list
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
      setNewModeratorEmail('');
      setNewModeratorPassword('');
    } catch {
      setError('Failed to add moderator');
    }
    setAdding(false);
  };

  const handleRemoveModerator = async (userId) => {
    if (!window.confirm('Remove moderator privileges?')) return;
    try {
      await api.post('/admin/remove-moderator', { userId });
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch {
      setError('Failed to remove moderator');
    }
  };

  if (loading || adminLoggedIn === null) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;
  if (adminLoggedIn === false) {
    navigate('/admin-login', { replace: true });
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Admin Dashboard</h2>
      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
      {/* <div className="mb-6 flex flex-col md:flex-row items-center gap-4 justify-center">
        <input
          type="email"
          placeholder="Moderator Email"
          value={newModeratorEmail}
          onChange={e => setNewModeratorEmail(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Moderator Password"
          value={newModeratorPassword}
          onChange={e => setNewModeratorPassword(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={handleAddModerator}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
          disabled={adding || !newModeratorEmail || !newModeratorPassword}
        >{adding ? 'Adding...' : 'Add Moderator'}</button>
      </div> */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td className="px-4 py-2 border">{user.name}</td>
                <td className="px-4 py-2 border">{user.email}</td>
                <td className="px-4 py-2 border">{user.role}</td>
                <td className="px-4 py-2 border space-x-2">
                  <button
                    onClick={() => handleViewDetails(user)}
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >View Details</button>
                  {user.role === 'moderator' && (
                    <button
                      onClick={() => handleRemoveModerator(user._id)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    >Remove Moderator</button>
                  )}
                  {user.role === 'student' && (
                    <>
                      <button
                        onClick={() => handlePromoteToModerator(user._id)}
                        className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                        disabled={promoting}
                      >Promote to Moderator</button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >Delete</button>
                    </>
                  )}
                  <button
                    onClick={() => handleSuspendUser(user._id, !user.suspended)}
                    className={`px-2 py-1 rounded ${user.suspended ? 'bg-gray-500 hover:bg-gray-600' : 'bg-orange-500 hover:bg-orange-600'} text-white`}
                  >{user.suspended ? 'Unsuspend' : 'Suspend'}</button>
                </td>
      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >✕</button>
            <h3 className="text-xl font-bold mb-4 text-blue-700">User Details</h3>
            <div className="mb-2"><b>Name:</b> {selectedUser.name}</div>
            <div className="mb-2"><b>Email:</b> {selectedUser.email}</div>
            <div className="mb-2"><b>Role:</b> {selectedUser.role}</div>
            <div className="mb-2"><b>Class:</b> {selectedUser.className || selectedUser.class || '-'}</div>
            <div className="mb-2"><b>Section:</b> {selectedUser.section || selectedUser.group || '-'}</div>
            <div className="mb-2"><b>Joined:</b> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '-'}</div>
            {/* Add more fields as needed */}
          </div>
        </div>
      )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
