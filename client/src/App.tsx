import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TestList from './pages/TestList';
import Login from './pages/Login';
import TestHomePage from './pages/TestHomePage';
// import TestRunner from './pages/TestRunner';
import TestRunner from './pages/TestRunner/TestRunner';
import PracticeRunner from './pages/TestRunner/PracticeRunner';
import AdminCreateTest from './pages/AdminCreateTest';
import AdminEditTest from './pages/AdminEditTest';
import AdminTestList from './pages/AdminTestList';
import RequireAdmin from './components/RequireAdmin';
import RequireAuth from './components/RequireAuth';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminResults from './pages/AdminResults';
import MyHistory from './pages/MyHistory';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main style={{ width: '100%', flex: 1, padding: '32px' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <TestList />
              </RequireAuth>
            }
          />

          <Route
            path="/test/:id"
            element={
              <RequireAuth>
                <TestHomePage />
              </RequireAuth>
            }
          />

          <Route
            path="/test/:id/run"
            element={
              <RequireAuth>
                <TestRunner />
              </RequireAuth>
            }
          />

          <Route
            path="/test/:id/practice"
            element={
              <RequireAuth>
                <PracticeRunner />
              </RequireAuth>
            }
          />

          <Route
            path="/myresults"
            element={
              <RequireAuth>
                <MyHistory />
              </RequireAuth>
            }
          />

          <Route
            path="/admin/create"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminCreateTest />
                </RequireAdmin>
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              </RequireAuth>
            }
          />

          <Route
            path="/admin/results"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminResults />
                </RequireAdmin>
              </RequireAuth>
            }
          />

          <Route
            path="/admin/edit/:id"
            element={
              <RequireAdmin>
                <AdminEditTest />
              </RequireAdmin>
            }
          />

          <Route
            path="/admin/tests"
            element={
              <RequireAdmin>
                <AdminTestList />
              </RequireAdmin>
            }
          />


        </Routes>
      </main>
    </BrowserRouter>
  );
}
