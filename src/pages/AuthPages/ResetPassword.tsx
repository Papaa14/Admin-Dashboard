import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

// Import your pre-configured Axios instance and toast functions
import api from '../../Api/api';
import { showSuccessToast, showErrorToast } from '../../components/ui/alert/ToastMessages';

// --- Axios Error Handling ---
interface ApiErrorResponse {
  message: string;
}

const isAxiosError = (error: unknown): error is AxiosError<ApiErrorResponse> => {
  return typeof error === 'object' && error !== null && (error as AxiosError).isAxiosError;
};
// ---

const ResetPassword: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showVisibility, setShowVisibility] = useState({
    password: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get the reset token from the URL query parameter (e.g., /reset-password?token=xyz)
  const token = new URLSearchParams(window.location.search).get('token');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { email, password, confirmPassword } = formData;

    // --- Validation ---
    if (!email || !password || !confirmPassword) {
      showErrorToast('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      showErrorToast('Passwords do not match.');
      return;
    }
    if (!token) {
      showErrorToast('Invalid or missing reset token. Please request a new link.');
      return;
    }

    setLoading(true);
    try {
      // Use your api instance to make the request
      await api.post('/admin/reset-password', {
        email,
        token,
        password,
      });

      showSuccessToast('Password has been reset successfully! Redirecting to login...');
      
      // Redirect to the login page after a delay
      setTimeout(() => {
        navigate('/admin-portal'); // Adjust this route if your login page is different
      }, 2000);

    } catch (err: unknown) {
      if (isAxiosError(err)) {
        showErrorToast(err.response?.data?.message || 'Failed to reset password.');
      } else {
        showErrorToast('An unexpected error occurred. Please try again.');
        console.error("Non-API Error:", err);
      }
      setLoading(false); // Only set loading to false on error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Reset Your Password</h2>
          <p className="text-gray-600 mt-2">Enter your email and a new password below.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showVisibility.password ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowVisibility(v => ({...v, password: !v.password}))}
                tabIndex={-1}
              >
                {showVisibility.password ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showVisibility.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowVisibility(v => ({...v, confirm: !v.confirm}))}
                tabIndex={-1}
              >
                {showVisibility.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : <>Reset Password <ArrowRight className="ml-2 w-5 h-5" /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;