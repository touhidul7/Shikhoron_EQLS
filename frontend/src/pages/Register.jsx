import React, { useState } from 'react';
import ClassSectionDropdown from '../components/ClassSectionDropdown';
import { useNavigate } from 'react-router-dom';
import api from '../api';


function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    institutionName: '',
    class: '',
    section: '',
    role: 'student',
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = e => {
    setAvatar(e.target.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    // Check all fields (except avatar) are filled
    const requiredFields = ['name', 'email', 'password', 'institutionName', 'class'];
    for (let field of requiredFields) {
      if (!form[field] || form[field].trim() === '') {
        setError('All fields are required.');
        return;
      }
    }
    // Only require section if the selected class has sections
    // We'll check this by querying the class list
    // (Assume ClassSectionDropdown always loads classes)
    // If section is shown but not selected, show error
    const classObj = (window.classSectionDropdownClasses || []).find(c => c.name === form.class);
    if (classObj && classObj.sections && classObj.sections.length > 0 && !form.section) {
      setError('Please select a group/section.');
      return;
    }
    if (!avatar) {
      setError('All fields are required.');
      return;
    }
    try {
      const formData = new FormData();
      // Always send role as 'student' regardless of form state
      Object.entries({ ...form, role: 'student' }).forEach(([key, value]) => formData.append(key, value));
      if (avatar) formData.append('avatar', avatar);
      await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white shadow rounded p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Register</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" encType="multipart/form-data">
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="border rounded px-3 py-2" />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className="border rounded px-3 py-2" />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className="border rounded px-3 py-2" />
          <input name="institutionName" placeholder="Institution Name" value={form.institutionName} onChange={handleChange} required className="border rounded px-3 py-2" />
          <ClassSectionDropdown
            value={form.class}
            onChange={e => setForm(f => ({ ...f, class: e.target.value, section: '' }))}
            sectionValue={form.section}
            onSectionChange={e => setForm(f => ({ ...f, section: e.target.value }))}
          />
          {/* Role selection removed; role will default to student */}
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="border rounded px-3 py-2" />
          <button type="submit" className="bg-blue-700 text-white py-2 rounded hover:bg-blue-800">Register</button>
        </form>
        {error && <div className="text-red-600 mt-3 text-center">{error}</div>}
      </div>
    </div>
  );
}

export default Register;
