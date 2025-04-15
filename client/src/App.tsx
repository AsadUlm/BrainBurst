import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation  } from 'react-router-dom';
import AdminCreateTest from './pages/AdminCreateTest';
import TestRunner from './pages/TestRunner';
import TestList from './pages/TestList';
import Login from './pages/Login';
import Header from './components/Header';

export default function App() {
  const isAdmin =
    localStorage.getItem('token') && localStorage.getItem('role') === 'admin';

    const RequireAdmin = ({ children }: { children: JSX.Element }) => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const location = useLocation();
    
      if (!token || role !== 'admin') {
        return <Navigate to="/login" state={{ from: location }} replace />;
      }
    
      return children;
    };

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<TestList />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin/create"
          element={
            <RequireAdmin>
              <AdminCreateTest />
            </RequireAdmin>
          }
        />
        <Route path="/test/:id" element={<TestRunner />} />
      </Routes>
    </BrowserRouter>
  );
}
