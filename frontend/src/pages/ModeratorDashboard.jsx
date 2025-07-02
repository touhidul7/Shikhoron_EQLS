
import React, { useEffect, useState } from 'react';
import api from '../api';

const TABS = ['Resources', 'Books', 'Classes'];

function ModeratorDashboard() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const [tab, setTab] = useState('Resources');
  // Resource state
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ title: '', description: '', class: '', group: '', link: '' });
  const [resourceFile, setResourceFile] = useState(null);
  // Book state
  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState({ title: '', description: '', price: '', link: '' });
  const [bookImage, setBookImage] = useState(null);
  // Class state
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState({ name: '', sections: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // For dynamic group selection
  const [availableGroups, setAvailableGroups] = useState([]);
  const [groupDisabled, setGroupDisabled] = useState(true);

  // Fetch all data
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  // When class changes, update available groups and enable group select
  useEffect(() => {
    if (newResource.class) {
      const selectedClass = classes.find(c => c.name === newResource.class);
      if (selectedClass && selectedClass.sections && selectedClass.sections.length > 0) {
        setAvailableGroups(selectedClass.sections);
        setGroupDisabled(false);
        setNewResource(prev => ({ ...prev, group: '' }));
      } else {
        setAvailableGroups([]);
        setGroupDisabled(true);
        setNewResource(prev => ({ ...prev, group: '' }));
      }
    } else {
      setAvailableGroups([]);
      setGroupDisabled(true);
      setNewResource(prev => ({ ...prev, group: '' }));
    }
  }, [newResource.class, classes]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resRes, resBooks, resClasses] = await Promise.all([
        api.get('/moderator/resources'),
        api.get('/moderator/books'),
        api.get('/moderator/classes'),
      ]);
      setResources(resRes.data.resources);
      setBooks(resBooks.data.books);
      setClasses(resClasses.data.classes);
    } catch {
      setError('Failed to fetch data');
    }
    setLoading(false);
  };

  // Resource CRUD
  const handleAddResource = async () => {
    if (!newResource.title || !newResource.class) return;
    // Only require group if the selected class has groups
    const classObj = classes.find(c => c.name === newResource.class);
    if (classObj && classObj.sections && classObj.sections.length > 0 && !newResource.group) {
      setError('Please select a group/section.');
      return;
    }
    try {
      const formData = new FormData();
      Object.entries(newResource).forEach(([key, value]) => formData.append(key, value));
      if (resourceFile) formData.append('file', resourceFile);
      await api.post('/moderator/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewResource({ title: '', description: '', class: '', group: '', link: '' });
      setResourceFile(null);
      fetchAll();
    } catch {
      setError('Failed to add resource');
    }
  };
  const handleDeleteResource = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/moderator/resources/${id}`);
      fetchAll();
    } catch {
      setError('Failed to delete resource');
    }
  };

  // Book CRUD
  const handleAddBook = async () => {
    if (!newBook.title) return;
    try {
      const formData = new FormData();
      Object.entries(newBook).forEach(([key, value]) => formData.append(key, value));
      if (bookImage) formData.append('image', bookImage);
      await api.post('/moderator/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewBook({ title: '', description: '', price: '', link: '' });
      setBookImage(null);
      fetchAll();
    } catch {
      setError('Failed to add book');
    }
  };
  const handleDeleteBook = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await api.delete(`/moderator/books/${id}`);
      fetchAll();
    } catch {
      setError('Failed to delete book');
    }
  };

  // Class CRUD
  const handleAddClass = async () => {
    if (!newClass.name) return;
    try {
      await api.post('/moderator/classes', { name: newClass.name, sections: newClass.sections.split(',').map(s => s.trim()) });
      setNewClass({ name: '', sections: '' });
      fetchAll();
    } catch {
      setError('Failed to add class');
    }
  };
  const handleDeleteClass = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      await api.delete(`/moderator/classes/${id}`);
      fetchAll();
    } catch {
      setError('Failed to delete class');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">Moderator Dashboard</h2>
      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
      <div className="flex justify-center mb-6 gap-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded ${tab === t ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'}`}>{t}</button>
        ))}
      </div>
      {loading ? <div className="text-center">Loading...</div> : null}
      {tab === 'Resources' && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Add Resource</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            <input type="text" placeholder="Title" value={newResource.title} onChange={e => setNewResource({ ...newResource, title: e.target.value })} className="border rounded px-2 py-1" />
            <input type="text" placeholder="Description" value={newResource.description} onChange={e => setNewResource({ ...newResource, description: e.target.value })} className="border rounded px-2 py-1" />
            <select value={newResource.class} onChange={e => setNewResource({ ...newResource, class: e.target.value })} className="border rounded px-2 py-1">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
            <select value={newResource.group} onChange={e => setNewResource({ ...newResource, group: e.target.value })} className="border rounded px-2 py-1" disabled={groupDisabled}>
              <option value="">{groupDisabled ? 'Select Class First' : 'Select Group'}</option>
              {availableGroups.map((g, idx) => (
                <option key={idx} value={g}>{g}</option>
              ))}
            </select>
            <input type="text" placeholder="Link" value={newResource.link} onChange={e => setNewResource({ ...newResource, link: e.target.value })} className="border rounded px-2 py-1" />
            <input type="file" onChange={e => setResourceFile(e.target.files[0])} className="border rounded px-2 py-1" />
            <button onClick={handleAddResource} className="bg-green-700 text-white px-3 py-1 rounded">Add</button>
          </div>
          <table className="min-w-full bg-white border rounded">
            <thead>
              <tr>
                <th className="px-4 py-2 border">File</th>
                <th className="px-4 py-2 border">Title</th>
                <th className="px-4 py-2 border">Description</th>
                <th className="px-4 py-2 border">Link</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(r => {
                // Determine file type for preview
                let fileCell = null;
                if (r.file) {
                  const fileUrl = `${backendUrl}${r.file}`;
                  const ext = r.file.split('.').pop().toLowerCase();
                  if (["jpg","jpeg","png","gif","bmp","webp"].includes(ext)) {
                    fileCell = <img src={fileUrl} alt="resource" className="w-16 h-16 object-cover rounded" />;
                  } else if (["pdf","doc","docx","ppt","pptx","xls","xlsx","txt"].includes(ext)) {
                    fileCell = (
                      <div className="flex flex-col items-center gap-1">
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                          <button className="bg-blue-600 text-white px-2 py-1 rounded">View</button>
                        </a>
                        <a href={fileUrl} download className="text-blue-600 underline text-xs">Download</a>
                      </div>
                    );
                  } else {
                    fileCell = (
                      <a href={fileUrl} download className="text-blue-600 underline text-xs">Download</a>
                    );
                  }
                }
                return (
                  <tr key={r._id}>
                    <td className="px-4 py-2 border">{fileCell}</td>
                    <td className="px-4 py-2 border">{r.title}</td>
                    <td className="px-4 py-2 border">{r.description}</td>
                    <td className="px-4 py-2 border">
                      {r.link && (
                        <a href={r.link} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{r.link}</a>
                      )}
                    </td>
                    <td className="px-4 py-2 border">
                      <button onClick={() => handleDeleteResource(r._id)} className="bg-red-600 text-white px-2 py-1 rounded">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'Books' && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Add Book</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            <input type="text" placeholder="Title" value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} className="border rounded px-2 py-1" />
            <input type="text" placeholder="Description" value={newBook.description} onChange={e => setNewBook({ ...newBook, description: e.target.value })} className="border rounded px-2 py-1" />
            <input type="number" placeholder="Price" value={newBook.price} onChange={e => setNewBook({ ...newBook, price: e.target.value })} className="border rounded px-2 py-1" />
            <input type="text" placeholder="Link" value={newBook.link} onChange={e => setNewBook({ ...newBook, link: e.target.value })} className="border rounded px-2 py-1" />
            <input type="file" accept="image/*" onChange={e => setBookImage(e.target.files[0])} className="border rounded px-2 py-1" />
            <button onClick={handleAddBook} className="bg-green-700 text-white px-3 py-1 rounded">Add</button>
          </div>
          <table className="min-w-full bg-white border rounded">
            <thead><tr><th className="px-4 py-2 border">Image</th><th className="px-4 py-2 border">Title</th><th className="px-4 py-2 border">Description</th><th className="px-4 py-2 border">Price</th><th className="px-4 py-2 border">Link</th><th className="px-4 py-2 border">Actions</th></tr></thead>
            <tbody>
              {books.map(b => (
                <tr key={b._id}>
                  <td className="px-4 py-2 border">
                    {b.image && <img src={`${backendUrl}${b.image}`} alt="book" className="w-16 h-16 object-cover rounded" />}
                    </td>
                  <td className="px-4 py-2 border">{b.title}</td>
                  <td className="px-4 py-2 border">{b.description}</td>
                  <td className="px-4 py-2 border">{b.price}</td>
                  <td className="px-4 py-2 border"><a href={b.link} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{b.link}</a></td>
                  <td className="px-4 py-2 border"><button onClick={() => handleDeleteBook(b._id)} className="bg-red-600 text-white px-2 py-1 rounded">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'Classes' && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Add Class</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            <input type="text" placeholder="Class Name" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} className="border rounded px-2 py-1" />
            <input type="text" placeholder="Sections (comma separated)" value={newClass.sections} onChange={e => setNewClass({ ...newClass, sections: e.target.value })} className="border rounded px-2 py-1" />
            <button onClick={handleAddClass} className="bg-green-700 text-white px-3 py-1 rounded">Add</button>
          </div>
          <table className="min-w-full bg-white border rounded">
            <thead><tr><th className="px-4 py-2 border">Class Name</th><th className="px-4 py-2 border">Sections</th><th className="px-4 py-2 border">Actions</th></tr></thead>
            <tbody>
              {classes.map(c => (
                <tr key={c._id}>
                  <td className="px-4 py-2 border">{c.name}</td>
                  <td className="px-4 py-2 border">{c.sections?.join(', ')}</td>
                  <td className="px-4 py-2 border"><button onClick={() => handleDeleteClass(c._id)} className="bg-red-600 text-white px-2 py-1 rounded">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ModeratorDashboard;
