import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Nav from './components/Nav';
import ProtectedRoute from './components/ProtectedRoute';
import CaptureForm from './pages/CaptureForm';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadDetail from './pages/LeadDetail';
import AdminUsers from './pages/AdminUsers';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<CaptureForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          </Routes>
        </main>
        <footer className="footer">
          Built for Digital Heroes Training Task — <a href="https://digitalheroesco.com" target="_blank" rel="noreferrer">digitalheroesco.com</a>
        </footer>
      </BrowserRouter>
    </AuthProvider>
  );
}
