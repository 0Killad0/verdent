import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-50 px-4">
      <div className="text-center">
        <div className="text-9xl font-bold text-forest-500 mb-4">404</div>
        <h1 className="text-4xl font-bold text-forest-800 mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-x-4">
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
          <Link to="/products" className="btn-outline">
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;