import { useState } from 'react';
import { Mail, Lock, AlertCircle, Brain, User } from 'lucide-react';
import type { UserRole } from '../../lib/types';

interface SignupProps {
  onSignup: (payload: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  onSwitchToLogin: () => void;
}

export function Signup({ onSignup, onSwitchToLogin }: SignupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; submit?: string }>({});

  const validateForm = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Name is required';
    if (!email) nextErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Please enter a valid email address';
    if (!password) nextErrors.password = 'Password is required';
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      await onSignup({ name, email, password, role });
    } catch (error: any) {
      setErrors({ submit: error?.response?.data?.message || 'Signup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-secondary flex items-center justify-center p-4" aria-label="Signup page">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-6"><div className="bg-primary rounded-lg p-3"><Brain className="w-8 h-8 text-white" /></div></div>
          <h1 className="text-2xl text-center mb-2 text-gray-900">Create Account</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">This form now hits /auth/register</p>
          <form onSubmit={handleSubmit} noValidate aria-describedby={errors.submit ? 'signup-submit-error' : undefined}>
            <div className="mb-6">
              <span id="role-label" className="block text-sm mb-2 text-gray-700">Register As</span>
              <div className="flex gap-2" role="radiogroup" aria-labelledby="role-label">{(['Employee', 'Manager', 'HR'] as UserRole[]).map((r) => <button key={r} type="button" onClick={() => setRole(r)} className={`flex-1 py-2 px-4 rounded-lg border transition-all ${role === r ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-input hover:border-primary'}`} role="radio" aria-checked={role === r}>{r}</button>)}</div>
            </div>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm mb-2 text-gray-700">Full Name</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.name ? 'border-destructive' : 'border-input'}`} placeholder="John Doe" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} /></div>
              {errors.name && <div id="name-error" role="alert" className="flex items-center gap-1 mt-1 text-destructive text-sm"><AlertCircle className="w-4 h-4" /><span>{errors.name}</span></div>}
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm mb-2 text-gray-700">Email Address</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.email ? 'border-destructive' : 'border-input'}`} placeholder="your.email@company.com" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'signup-email-error' : undefined} /></div>
              {errors.email && <div id="signup-email-error" role="alert" className="flex items-center gap-1 mt-1 text-destructive text-sm"><AlertCircle className="w-4 h-4" /><span>{errors.email}</span></div>}
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm mb-2 text-gray-700">Password</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.password ? 'border-destructive' : 'border-input'}`} placeholder="••••••••" autoComplete="new-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'signup-password-error' : undefined} /></div>
              {errors.password && <div id="signup-password-error" role="alert" className="flex items-center gap-1 mt-1 text-destructive text-sm"><AlertCircle className="w-4 h-4" /><span>{errors.password}</span></div>}
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm mb-2 text-gray-700">Confirm Password</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.confirmPassword ? 'border-destructive' : 'border-input'}`} placeholder="••••••••" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined} /></div>
              {errors.confirmPassword && <div id="confirm-password-error" role="alert" className="flex items-center gap-1 mt-1 text-destructive text-sm"><AlertCircle className="w-4 h-4" /><span>{errors.confirmPassword}</span></div>}
            </div>
            {errors.submit && <div id="signup-submit-error" role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.submit}</div>}
            <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition-colors mb-4 disabled:opacity-60">{loading ? 'Creating...' : 'Sign Up'}</button>
            <div className="text-center text-sm text-muted-foreground">Already have an account? <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline">Sign in</button></div>
          </form>
        </div>
      </div>
    </main>
  );
}
