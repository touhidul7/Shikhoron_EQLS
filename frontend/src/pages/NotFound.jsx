import React from 'react';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white shadow rounded p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-700">404 - Page Not Found</h2>
        <p className="text-gray-600">Sorry, the page you are looking for does not exist.</p>
      </div>
    </div>
  );
}

export default NotFound;
