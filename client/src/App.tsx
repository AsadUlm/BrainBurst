import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TestList from './pages/TestList';
import Login from './pages/Login';
import TestHomePage from './pages/TestHomePage';
// import TestRunner from './pages/TestRunner';
import TestRunner from './pages/TestRunner/TestRunner';
import PracticeRunner from './pages/TestRunner/PracticeRunner';
import GameMode from './pages/GameMode';
import MemoryMatchGame from './pages/GameMode/MemoryMatchGame';
import AdminCreateTest from './pages/AdminCreateTest';
import AdminEditTest from './pages/AdminEditTest';
import AdminTestList from './pages/AdminTestList';
import AdminCategories from './pages/AdminCategories';
import RequireAdmin from './components/RequireAdmin';
import RequireAuth from './components/RequireAuth';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminResults from './pages/AdminResults';
import AdminGameResults from './pages/AdminGameResults';
import MyHistory from './pages/MyHistory';
import UserAnalytics from './pages/UserAnalytics';
import Dashboard from './pages/Dashboard';
import { SettingsProvider } from './contexts/SettingsContext';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import OfflineResultsSync from './components/OfflineResultsSync';
import RequireTeacher from './components/RequireTeacher';
import TeacherClasses from './pages/TeacherClasses';
import StudentClasses from './pages/StudentClasses';
import ClassHomePage from './pages/ClassHomePage';
import AssignmentResults from './pages/ClassHomePage/AssignmentResults';
import MyProfile from './pages/MyProfile';

export default function App() {
  return (
    <SettingsProvider>
      <UserProvider>
        <NotificationProvider>
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
                      <Dashboard />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/tests"
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
                      <TestRunner mode="standard" />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/test/:id/exam"
                  element={
                    <RequireAuth>
                      <TestRunner mode="exam" />
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
                  path="/test/:id/game"
                  element={
                    <RequireAuth>
                      <GameMode />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/test/:id/game/play"
                  element={
                    <RequireAuth>
                      <MemoryMatchGame />
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
                  path="/analytics"
                  element={
                    <RequireAuth>
                      <UserAnalytics />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/admin/create"
                  element={
                    <RequireAuth>
                      <RequireTeacher>
                        <AdminCreateTest />
                      </RequireTeacher>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <MyProfile />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/teacher/classes"
                  element={
                    <RequireAuth>
                      <RequireTeacher>
                        <TeacherClasses />
                      </RequireTeacher>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/student/classes"
                  element={
                    <RequireAuth>
                      <StudentClasses />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/class/:id"
                  element={
                    <RequireAuth>
                      <ClassHomePage />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/class/:classId/assignment/:assignmentId"
                  element={
                    <RequireAuth>
                      <RequireTeacher>
                        <AssignmentResults />
                      </RequireTeacher>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <RequireAuth>
                      <RequireTeacher>
                        <AdminDashboard />
                      </RequireTeacher>
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
                  path="/admin/game-results"
                  element={
                    <RequireAuth>
                      <RequireAdmin>
                        <AdminGameResults />
                      </RequireAdmin>
                    </RequireAuth>
                  }
                />

                <Route
                  path="/admin/edit/:id"
                  element={
                    <RequireTeacher>
                      <AdminEditTest />
                    </RequireTeacher>
                  }
                />

                <Route
                  path="/admin/tests"
                  element={
                    <RequireTeacher>
                      <AdminTestList />
                    </RequireTeacher>
                  }
                />

                <Route
                  path="/admin/categories"
                  element={
                    <RequireAuth>
                      <RequireTeacher>
                        <AdminCategories />
                      </RequireTeacher>
                    </RequireAuth>
                  }
                />


              </Routes>
            </main>

            {/* Автоматическая синхронизация офлайн-результатов */}
            <OfflineResultsSync />
          </BrowserRouter>
        </NotificationProvider>
      </UserProvider>
    </SettingsProvider>
  );
}
