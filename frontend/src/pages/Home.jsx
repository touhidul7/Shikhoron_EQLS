import React from 'react';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white shadow rounded p-8 w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold mb-4 text-blue-700">Welcome to QNA_Education</h1>
        <p className="text-gray-700 mb-2">A platform for Bangladeshi students to ask, answer, and share educational resources by class, department, and subject.</p>
        <p className="text-gray-500">Register or login to get started!</p>
      </div>
    </div>
  );
}

export default Home;
