import { useState } from 'react';
import { Mail, Lock, AlertCircle, Brain } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToSignup: () => void;
}

export function Login({ onLogin, onSwitchToSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      await onLogin(email, password);
    } catch (error: any) {
      setErrors({ submit: error?.response?.data?.message || 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <main id="main-content" className="min-h-screen bg-secondary flex items-center justify-center p-4" aria-label="Reset password page">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-6"><div className="bg-primary rounded-lg p-3"><Brain className="w-8 h-8 text-white" /></div></div>
            <h1 className="text-2xl text-center mb-2 text-gray-900">Reset Password</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Password reset endpoint is not built yet. Return to login and use an existing account.</p>
            <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-primary hover:underline">Back to Login</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-secondary flex items-center justify-center p-4" aria-label="Login page">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-6"><div className="bg-primary rounded-lg p-3"><Brain className="w-8 h-8 text-white" /></div></div>
          <h1 className="text-2xl text-center mb-2 text-gray-900">Welcome to HRBrain</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Sign in with a real backend request</p>
          <form onSubmit={handleSubmit} noValidate aria-describedby={errors.submit ? 'login-submit-error' : undefined}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm mb-2 text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.email ? 'border-destructive' : 'border-input'}`} placeholder="your.email@company.com" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
              </div>
              {errors.email && <div id="email-error" role="alert" className="flex items-center gap-1 mt-1 text-destructive text-sm"><AlertCircle className="w-4 h-4" /><span>{errors.email}</span></div>}
            </div>
            <div className="mb-2">
              <label htmlFor="password" className="block text-sm mb-2 text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.password ? 'border-destructive' : 'border-input'}`} placeholder="••••••••" autoComplete="current-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
              </div>
              {errors.password && <div id="password-error" role="alert" className="flex items-center gap-1 mt-1 text-destructive text-sm"><AlertCircle className="w-4 h-4" /><span>{errors.password}</span></div>}
            </div>
            <div className="mb-6 text-right"><button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-primary hover:underline">Forgot password?</button></div>
            {errors.submit && <div id="login-submit-error" role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.submit}</div>}
            <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition-colors mb-4 disabled:opacity-60">{loading ? 'Signing In...' : 'Sign In'}</button>
            <div className="text-center text-sm text-muted-foreground">Don't have an account? <button type="button" onClick={onSwitchToSignup} className="text-primary hover:underline">Sign up</button></div>
          </form>
        </div>
      </div>
    </main>
  );
}
