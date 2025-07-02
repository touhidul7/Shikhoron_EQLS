import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', institutionName: '', class: '', group: '', bio: '' });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        setUser(res.data.user);
        setEditForm({
          name: res.data.user.name || '',
          institutionName: res.data.user.institutionName || '',
          class: res.data.user.class || '',
          group: res.data.user.group || '',
          bio: res.data.user.profile?.bio || ''
        });
      })
      .catch(() => navigate('/login'));
  }, [navigate]);
  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    setSaving(true);
    setError('');
    // Validation: Institution Name and Name always required, Class required unless admin
    if (!editForm.name.trim() || !editForm.institutionName.trim()) {
      setError('Name and Institution Name are required.');
      setSaving(false);
      return;
    }
    if (user && user.role !== 'admin' && !editForm.class.trim()) {
      setError('Class is required.');
      setSaving(false);
      return;
    }
    try {
      await api.put('/auth/profile', {
        name: editForm.name,
        institutionName: editForm.institutionName,
        class: editForm.class,
        group: editForm.group,
        bio: editForm.bio
      });
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setEdit(false);
    } catch (err) {
      setError('Failed to update profile');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await api.post('/auth/logout');
    navigate('/login');
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    setAvatar(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAvatarSave = async () => {
    if (!avatar) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatar);
      await api.post('/auth/update-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh user info
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setAvatar(null);
      setAvatarPreview(null);
    } catch (err) {
      setError('Failed to update avatar');
    }
    setSaving(false);
  };

  if (!user) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white shadow rounded p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Profile</h2>
        <div className="flex flex-col items-center mb-4">
          <img
            src={avatarPreview || (user.profile?.avatar ? (user.profile.avatar.startsWith('http') ? user.profile.avatar : backendUrl + user.profile.avatar) : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name))}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border mb-2"
          />
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="mb-2" />
          <button
            onClick={handleAvatarSave}
            className="bg-blue-700 text-white py-1 px-4 rounded hover:bg-blue-800"
            disabled={saving || !avatar}
          >{saving ? 'Saving...' : 'Change Avatar'}</button>
        </div>
        {edit ? (
          <>
            <div className="mb-2"><b>Name:</b> <input name="name" value={editForm.name} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></div>
            <div className="mb-2"><b>Institution Name:</b> <input name="institutionName" value={editForm.institutionName} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></div>
            <div className="mb-2"><b>Class:</b> <input name="class" value={editForm.class} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></div>
            <div className="mb-2"><b>Group:</b> <input name="group" value={editForm.group} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></div>
            <div className="mb-2"><b>Bio:</b> <textarea name="bio" value={editForm.bio} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></div>
            <button onClick={handleEditSave} className="bg-green-700 text-white py-2 px-4 rounded hover:bg-green-800 w-full mb-2" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={() => setEdit(false)} className="bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500 w-full">Cancel</button>
          </>
        ) : (
          <>
            <div className="mb-2"><b>Name:</b> {user.name}</div>
            <div className="mb-2"><b>Email:</b> {user.email}</div>
            <div className="mb-2"><b>Role:</b> {user.role}</div>
            <div className="mb-2"><b>Institution Name:</b> {user.institutionName}</div>
            <div className="mb-2"><b>Class:</b> {user.class}</div>
            <div className="mb-2"><b>Group:</b> {user.group || '-'}</div>
            <div className="mb-2"><b>Bio:</b> {user.profile?.bio || '-'}</div>
            <button onClick={() => setEdit(true)} className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 w-full mb-2">Edit Profile</button>
          </>
        )}
        <button onClick={handleLogout} className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800 w-full">Logout</button>
        {error && <div className="text-red-600 mt-3 text-center">{error}</div>}
      </div>
    </div>
  );
}

export default Profile;
