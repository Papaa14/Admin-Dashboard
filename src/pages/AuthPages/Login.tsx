import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Mail, ArrowRight } from 'lucide-react';
import { AxiosError } from 'axios';
// Import 'Link' for declarative navigation
import { useNavigate, Link } from 'react-router-dom';

// Import your custom toast functions
import { showSuccessToast, showErrorToast } from '../../components/ui/alert/ToastMessages';

// Import your pre-configured Axios instance
import api from "../../Api/api";

// --- START: Axios Error Handling ---
interface ApiErrorResponse {
  message: string;
}

const isAxiosError = (error: unknown): error is AxiosError<ApiErrorResponse> => {
  return typeof error === 'object' && error !== null && (error as AxiosError).isAxiosError;
};
// --- END: Axios Error Handling ---


const AdminPortal: React.FC = () => {
  const [showPassword, setShowPassword] = useState({ login: false });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  
  // All 'forgot password' related state and handlers have been removed.
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => ({
      ...prev,
      login: !prev.login,
    }));
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      showErrorToast('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/admin/verify', loginData);
      const { data } = response;

      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      showSuccessToast('Login successful! Redirecting...');
      
      setTimeout(() => {
        navigate('/home'); // Or '/dashboard'
      }, 1500);

    } catch (err: unknown) {
      if (isAxiosError(err)) {
        showErrorToast(err.response?.data?.message || 'Invalid credentials or server error.');
      } else {
        showErrorToast('An unexpected error occurred. Please try again later.');
        console.error("Non-API Error:", err);
      }
      setLoading(false); // Only set loading to false on error
    }
  };

  // The handleForgotSubmit function has been removed from this component.

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          {/* Title is no longer conditional */}
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Please sign in to your account</p>
        </div>
        
        {/* The conditional rendering for the form has been removed */}
        <form className="space-y-6" onSubmit={handleLoginSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword.login ? 'text' : 'password'}
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={togglePasswordVisibility}
              >
                {showPassword.login ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-end">
            {/* Replaced the button with a Link for proper navigation */}
            <Link
              to="/reset"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Forgot Password?
            </Link>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : <>Sign In <ArrowRight className="ml-2 w-5 h-5" /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPortal;