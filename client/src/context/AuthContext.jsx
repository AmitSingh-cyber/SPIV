import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('echo_token') || null);
  const [loading, setLoading] = useState(true);
  const [isVaultLocked, setIsVaultLocked] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (error) {
          console.error('Auth verification error:', error);
          // Don't log out on network failure, just hold state
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Non-JSON login response:', text);
        toast.error('Server returned invalid response. Check server status.');
        return false;
      }

      if (res.ok && data.success) {
        localStorage.setItem('echo_token', data.token);
        setToken(data.token);
        setUser(data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        return true;
      } else {
        toast.error(data.message || 'Login failed.');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Unable to reach backend server. If hosted on Render free tier, it may take 30s to wake up.');
      return false;
    }
  };

  const register = async (name, email, password, rollNumber, branch, semester) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          roll_number: rollNumber,
          branch,
          semester: parseInt(semester) || 5
        })
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Non-JSON registration response:', text);
        toast.error('Server returned invalid response. Check server status.');
        return false;
      }

      if (res.ok && data.success) {
        localStorage.setItem('echo_token', data.token);
        setToken(data.token);
        setUser(data.user);
        toast.success(`Account created! Welcome, ${name}.`);
        return true;
      } else {
        toast.error(data.message || 'Registration failed.');
        return false;
      }
    } catch (error) {
      console.error('Registration fetch error:', error);
      toast.error('Network error. Unable to reach backend server. If hosted on Render free tier, it may take 30s to wake up.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('echo_token');
    setToken(null);
    setUser(null);
    setIsVaultLocked(true);
    toast.success('Logged out successfully.');
  };

  // Helper fetch function that automatically appends Auth header
  const request = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    // If options.body is an object (not FormData), JSON stringify it
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers, body });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
        }
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (error) {
      console.error(`Request to ${url} failed:`, error.message);
      throw error;
    }
  };

  const unlockVault = (pin) => {
    // Quick local vault pin checker (default PIN is '7777')
    if (pin === '7777') {
      setIsVaultLocked(false);
      toast.success('Credentials Vault Decrypted.');
      return true;
    } else {
      toast.error('Access Denied. Incorrect Master PIN.');
      return false;
    }
  };

  const lockVault = () => {
    setIsVaultLocked(true);
    toast.success('Credentials Vault Locked.');
  };

  const updateProfileState = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      request,
      isVaultLocked,
      unlockVault,
      lockVault,
      updateProfileState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
