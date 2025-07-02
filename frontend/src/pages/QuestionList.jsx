import React, { useEffect, useState } from 'react';
import ImageZoom from '../components/ImageZoom';
import { Link } from 'react-router-dom';
import api from '../api';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function QuestionList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null));
    api.get('/questions')
      .then(res => setQuestions(res.data.questions))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Questions</h2>
      {questions.length === 0 && <div className="text-gray-500">No questions found.</div>}
      <ul className="space-y-4">
        {questions.map(q => {
          const isMyQuestion = user && q.user && q.user._id === user._id;
          return (
            <li key={q._id} className="bg-white shadow rounded p-4">
              <Link to={`/questions/${q._id}`} className="text-lg font-bold text-blue-700 hover:underline">{q.title}</Link> <br />
              <span className="text-gray-600 text-sm">Class: {q.class}, Department: {q.department}, Subject: {q.subject?.join(', ')}</span>
              {q.files && q.files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {q.files.map((file, i) => file.match(/\.(jpg|jpeg|png|gif)$/i)
                    ? <ImageZoom key={i} src={file.startsWith('http') ? file : backendUrl + file} alt="attachment" className="w-16 h-16 object-cover rounded border" />
                    : <a key={i} href={file.startsWith('http') ? file : backendUrl + file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download File</a>
                  )}
                </div>
              )}
              {isMyQuestion && (
                <div className="flex gap-2 mt-2">
                  <button onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this question?')) {
                      await api.delete(`/questions/${q._id}`);
                      setQuestions(questions.filter(qq => qq._id !== q._id));
                    }
                  }} className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Delete</button>
                  {/* Edit button can be added here */}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default QuestionList;
