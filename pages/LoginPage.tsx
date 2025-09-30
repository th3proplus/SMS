import React, { useState } from 'react';
import { login } from '../services/authService';
import { navigate } from '../services/navigationService';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                navigate('/admin');
            } else {
                setError('Invalid username or password.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-2xl shadow-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-teal-400">Admin Login</h1>
                    <p className="mt-2 text-slate-400">Access the control panel.</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="username"
                            className="text-sm font-medium text-slate-300 block mb-2"
                        >
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            placeholder="admin"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-slate-300 block mb-2"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            placeholder="password"
                        />
                    </div>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </div>
                </form>
                <p className="text-center text-xs text-slate-500">
                    <a
                        href="/"
                        className="bg-transparent border-none p-0 text-current hover:underline cursor-pointer"
                    >
                        &larr; Back to Public Site
                    </a>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;