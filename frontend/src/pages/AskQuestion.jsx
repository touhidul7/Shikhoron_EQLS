import React, { useState, useEffect } from 'react';
import api from '../api';

function AskQuestion() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    class: '',
    group: '',
    subject: '',
    files: []
  });
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data.user)).catch(() => setUser(null));
    api.get('/classes').then(res => setClasses(res.data.classes));
  }, []);

  useEffect(() => {
    if (form.class) {
      const selectedClass = classes.find(c => c.name === form.class);
      if (selectedClass && selectedClass.sections && selectedClass.sections.length > 0) {
        setAvailableGroups(selectedClass.sections);
      } else {
        setAvailableGroups([]);
        setForm(f => ({ ...f, group: '' }));
      }
    } else {
      setAvailableGroups([]);
      setForm(f => ({ ...f, group: '' }));
    }
  }, [form.class, classes]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    setForm({ ...form, files: Array.from(e.target.files) });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      // For students, use their class/group; for others, use selected
      if (user && user.role === 'student') {
        formData.append('class', user.class);
        if (user.section) formData.append('group', user.section);
      } else {
        formData.append('class', form.class);
        if (availableGroups.length > 0 && form.group) formData.append('group', form.group);
      }
      formData.append('subject', JSON.stringify(form.subject.split(',').map(s => s.trim())));
      for (let file of form.files) {
        formData.append('files', file);
      }
      await api.post('/questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Question posted!');
      setForm({ title: '', description: '', class: '', group: '', subject: '', files: [] });
    } catch (err) {
      setMessage('Failed to post question');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white shadow rounded p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Ask a Question</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required className="border rounded px-3 py-2" />
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required className="border rounded px-3 py-2" />
          {/* Only show class/group for admin/moderator */}
          {user && user.role !== 'student' && (
            <>
              <select name="class" value={form.class} onChange={handleChange} required className="border rounded px-3 py-2">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
              {availableGroups.length > 0 && (
                <select name="group" value={form.group} onChange={handleChange} className="border rounded px-3 py-2">
                  <option value="">Select Group/Section (optional)</option>
                  {availableGroups.map((g, idx) => (
                    <option key={idx} value={g}>{g}</option>
                  ))}
                </select>
              )}
            </>
          )}
          <input name="subject" placeholder="Subject(s), comma separated" value={form.subject} onChange={handleChange} required className="border rounded px-3 py-2" />
          <input type="file" multiple onChange={handleFileChange} className="border rounded px-3 py-2" />
          <button type="submit" className="bg-blue-700 text-white py-2 rounded hover:bg-blue-800">Post</button>
        </form>
        {message && <div className="mt-3 text-center text-green-600">{message}</div>}
      </div>
    </div>
  );
}

export default AskQuestion;
