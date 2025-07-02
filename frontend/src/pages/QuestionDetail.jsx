import React, { useEffect, useState } from 'react';
import ImageZoom from '../components/ImageZoom';
import { useParams } from 'react-router-dom';
import api from '../api';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';


function QuestionDetail() {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));
    api.get(`/questions?`)
      .then(res => {
        const q = res.data.questions.find(q => q._id === id);
        setQuestion(q);
      });
    api.get(`/questions/${id}/answers`).then(res => setAnswers(res.data.answers));
  }, [id]);

  const handleFileChange = e => setFiles(Array.from(e.target.files));

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('content', content);
      for (let file of files) formData.append('files', file);
      await api.post(`/questions/${id}/answer`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setContent('');
      setFiles([]);
      setMessage('Answer posted!');
      // Refresh answers
      api.get(`/questions/${id}/answers`).then(res => setAnswers(res.data.answers));
    } catch {
      setMessage('Failed to post answer');
    }
  };

  if (!question) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white shadow rounded p-6 mb-6">
        <h2 className="text-xl font-bold mb-2 text-blue-700">{question.title}</h2>
        <div className="mb-2 text-gray-700">{question.description}</div>
        <div className="mb-2 text-sm text-gray-500">Class: {question.class}{question.group ? `, Group: ${question.group}` : ''}, Subject: {question.subject?.join(', ')}</div>
        {question.files && question.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {question.files.map((file, i) => file.match(/\.(jpg|jpeg|png|gif)$/i)
              ? <ImageZoom key={i} src={file.startsWith('http') ? file : backendUrl + file} alt="attachment" className="w-24 h-24 object-cover rounded border" />
              : <a key={i} href={file.startsWith('http') ? file : backendUrl + file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download File</a>
            )}
          </div>
        )}
      </div>
      <div className="mb-8">
        <h3 className="font-bold mb-2">Answers</h3>
        {answers.length === 0 && <div className="text-gray-500">No answers yet.</div>}
        <ul className="space-y-4">
          {answers.map(a => {
            const upvotes = a.votes ? a.votes.filter(v => v.value === 1).length : 0;
            const downvotes = a.votes ? a.votes.filter(v => v.value === -1).length : 0;
            const isMyAnswer = user && a.user && a.user._id === user._id;
            return (
              <li key={a._id} className="bg-gray-50 rounded p-4">
                <div className="mb-1 text-gray-800">{a.content}</div>
                <div className="mb-1 text-xs text-gray-500">By: {a.user?.name || 'User'} ({a.user?.role})</div>
                {a.files && a.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {a.files.map((file, i) => file.match(/\.(jpg|jpeg|png|gif)$/i)
                      ? <ImageZoom key={i} src={file.startsWith('http') ? file : backendUrl + file} alt="attachment" className="w-16 h-16 object-cover rounded border" />
                      : <a key={i} href={file.startsWith('http') ? file : backendUrl + file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download File</a>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={async () => {
                    await api.post(`/questions/${id}/answers/${a._id}/vote`, { value: 1 });
                    api.get(`/questions/${id}/answers`).then(res => setAnswers(res.data.answers));
                  }} className="px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">👍 {upvotes}</button>
                  <button onClick={async () => {
                    await api.post(`/questions/${id}/answers/${a._id}/vote`, { value: -1 });
                    api.get(`/questions/${id}/answers`).then(res => setAnswers(res.data.answers));
                  }} className="px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">👎 {downvotes}</button>
                  {isMyAnswer && (
                    <>
                      <button onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this answer?')) {
                          await api.delete(`/questions/${id}/answers/${a._id}`);
                          api.get(`/questions/${id}/answers`).then(res => setAnswers(res.data.answers));
                        }
                      }} className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Delete</button>
                      {/* Edit button can be added here */}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Answer form logic: allow admin/moderator to answer any class, students only their own class */}
      {user ? (
        (user.role === 'admin' || user.role === 'moderator' || user.class === question.class) ? (
          <div className="bg-white shadow rounded p-6">
            <h3 className="font-bold mb-2">Your Answer</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your answer..." required className="border rounded px-3 py-2" />
              <input type="file" multiple onChange={handleFileChange} className="border rounded px-3 py-2" />
              <button type="submit" className="bg-blue-700 text-white py-2 rounded hover:bg-blue-800">Post Answer</button>
            </form>
            {message && <div className="mt-3 text-center text-green-600">{message}</div>}
          </div>
        ) : (
          <div className="bg-white shadow rounded p-6 text-center text-red-600 font-semibold">Only students of class {question.class} can answer this question.</div>
        )
      ) : (
        <div className="bg-white shadow rounded p-6 text-center text-gray-500">Please login to answer this question.</div>
      )}
    </div>
  );
}

export default QuestionDetail;
