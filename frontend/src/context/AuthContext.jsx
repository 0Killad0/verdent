import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload?.user || null,
        tokens: action.payload?.tokens || null,
        rememberMe: action.payload?.rememberMe || false,
        isAuthenticated: !!action.payload?.tokens,
        error: null
      };
    case 'LOGIN_FAIL':
      return { ...state, loading: false, user: null, isAuthenticated: false, error: action.payload };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        tokens: null, 
        isAuthenticated: false, 
        rememberMe: false,
        error: null 
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_REMEMBER_ME':
      return { ...state, rememberMe: action.payload };
    case 'FORGOT_PASSWORD_START':
      return { ...state, loading: true, error: null };
    case 'FORGOT_PASSWORD_SUCCESS':
      return { ...state, loading: false, error: null };
    case 'FORGOT_PASSWORD_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'RESET_PASSWORD_START':
      return { ...state, loading: true, error: null };
    case 'RESET_PASSWORD_SUCCESS':
      return { ...state, loading: false, error: null };
    case 'RESET_PASSWORD_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  rememberMe: false,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false); 

  // === NEW REFERENCES FOR TOKEN REFRESH HANDLING ===
  const isRefreshing = React.useRef(false);
  const failedQueue = React.useRef([]); // Queue of requests waiting for new token

  const processQueue = (error, token = null) => {
    failedQueue.current.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueue.current = [];
  };
  // ===============================================

  // FIXED: Function to wait for authentication initialization
  const waitForAuthReady = () => {
    return new Promise(resolve => {
      if (isAuthInitialized) {
        resolve();
        return;
      }
      
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds total (50 * 100ms)
      
      const interval = setInterval(() => {
        attempts++;
        
        if (isAuthInitialized) {
          clearInterval(interval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.warn('Auth initialization timeout - proceeding anyway');
          resolve();
        }
      }, 100); 
    });
  };

  // Enhanced token storage with remember me
  const setAuthTokens = (accessToken, refreshToken, remember = false) => {
    const storage = remember ? localStorage : sessionStorage;
    const oppositeStorage = remember ? sessionStorage : localStorage;

    // Clear opposite storage first
    oppositeStorage.removeItem('marketsphereToken');
    oppositeStorage.removeItem('marketsphereRefreshToken');
    oppositeStorage.removeItem('marketsphereRememberMe');

    if (accessToken) {
      storage.setItem('marketsphereToken', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      localStorage.removeItem('marketsphereToken');
      sessionStorage.removeItem('marketsphereToken');
      delete axios.defaults.headers.common['Authorization'];
    }

    if (refreshToken) {
      storage.setItem('marketsphereRefreshToken', refreshToken);
    } else {
      localStorage.removeItem('marketsphereRefreshToken');
      sessionStorage.removeItem('marketsphereRefreshToken');
    }

    // Store remember me preference
    if (remember) {
      localStorage.setItem('marketsphereRememberMe', 'true');
    } else {
      localStorage.removeItem('marketsphereRememberMe');
    }
  };

  // Enhanced token retrieval
  const getStoredTokens = () => {
    const remember = localStorage.getItem('marketsphereRememberMe') === 'true';
    const storage = remember ? localStorage : sessionStorage;
    
    const accessToken = storage.getItem('marketsphereToken');
    const refreshToken = storage.getItem('marketsphereRefreshToken');
    
    return { accessToken, refreshToken, remember };
  };
  
  // Function to retrieve the current access token easily (Used in Payment.jsx)
  const getAccessToken = () => {
    return getStoredTokens().accessToken;
  };
  
  // FIX: Applies stored tokens and updates Axios headers (Fix for 401 on load)
  const applyStoredTokens = () => {
    const { accessToken, remember } = getStoredTokens();

    if (accessToken) {
      console.log('AuthContext: Found token, setting Authorization header.');
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      return accessToken;
    }
    console.log('AuthContext: No valid token found.');
    delete axios.defaults.headers.common['Authorization'];
    return null;
  };

  // Clear all tokens from all storage
  const clearAllTokens = () => {
    localStorage.removeItem('marketsphereToken');
    localStorage.removeItem('marketsphereRefreshToken');
    localStorage.removeItem('marketsphereRememberMe');
    sessionStorage.removeItem('marketsphereToken');
    sessionStorage.removeItem('marketsphereRefreshToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  /** ================================
   * ENHANCED LOGOUT FUNCTION
   * ================================ */
  const logout = async () => {
    const { accessToken, refreshToken } = getStoredTokens();
    const userId = state.user?._id;

    // 1. Call server to blacklist tokens
    try {
      await axios.post('/api/auth/logout', { 
        accessToken, 
        refreshToken, 
        userId
      });
    } catch (error) {
      console.error('Server logout failed:', error);
    }

    // 2. Clear client-side state and storage
    clearAllTokens();
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  // Enhanced refresh token logic
  const refreshAccessToken = async () => {
    // If refreshing, queue the request and wait
    if (isRefreshing.current) {
      return new Promise(function(resolve, reject) {
        failedQueue.current.push({ resolve, reject });
      });
    }

    isRefreshing.current = true;
    
    const { refreshToken, remember } = getStoredTokens();
    
    if (!refreshToken) {
      logout();
      isRefreshing.current = false;
      processQueue(new Error('No refresh token available.'));
      return null;
    }
    
    try {
      const { data } = await axios.post('/api/auth/refresh', { 
        refreshToken,
        remember 
      });
      
      if (data?.accessToken) {
        setAuthTokens(data.accessToken, data.refreshToken || refreshToken, remember);
        
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { 
            user: state.user, 
            tokens: { 
              accessToken: data.accessToken, 
              refreshToken: data.refreshToken || refreshToken 
            },
            rememberMe: remember
          } 
        });

        processQueue(null, data.accessToken);
        isRefreshing.current = false;
        return data.accessToken;
      }
      isRefreshing.current = false;
      processQueue(new Error('Refresh token was invalid.'));
      return null;
    } catch (err) {
      console.error('Token refresh failed (check server /api/auth/refresh):', err.response?.status, err.message);
      // Clear tokens if refresh completely fails
      clearAllTokens();
      dispatch({ type: 'LOGOUT' });

      processQueue(err);
      isRefreshing.current = false;
      return null;
    }
  };

  // Sync logout between tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'marketsphereToken' && (e.newValue === null || e.newValue === '')) {
        dispatch({ type: 'LOGOUT' });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // FIXED: Enhanced auto-logout interceptor with proper dependencies
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      resp => resp,
      async err => {
        if (err.response?.status === 401) {
          const originalRequest = err.config;
          
          // FIX: Exclude login/logout/refresh/payment endpoints from retrying
          const isExcludedPath = 
            originalRequest.url.includes('/logout') || 
            originalRequest.url.includes('/login') || 
            originalRequest.url.includes('/refresh') ||
            originalRequest.url.includes('/payment/intent'); 

          // Only attempt to retry if it hasn't been retried AND it's not a known auth/payment route
          if (!originalRequest._retry && !isExcludedPath) {
            originalRequest._retry = true;
            
            try {
              // Attempt refresh or wait in queue if another refresh is pending
              const newAccess = await refreshAccessToken(); 

              if (newAccess) {
                originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
                return axios(originalRequest);
              }
            } catch (refreshError) {
              console.log('Token refresh failed:', refreshError);
              // refreshAccessToken already logs out and clears tokens on failure
              toast.error('Session expired. Please log in again.');
              return Promise.reject(err); // Reject the original error
            }
          }
        }
        return Promise.reject(err);
      }
    );
    
    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshAccessToken, state.user, state.rememberMe]); // FIXED: Added refreshAccessToken dependency

  // Fix for 401 on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = applyStoredTokens(); // Use function to set header

      if (accessToken) {
        const { remember } = getStoredTokens();
        dispatch({ type: 'SET_REMEMBER_ME', payload: remember });
        await getUserProfile(); // Now correctly authenticated
      }
      // Set initialization state to true
      setIsAuthInitialized(true); 
    };

    initializeAuth();
  }, []);

  // User profile fetch
  const getUserProfile = async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      const { accessToken, refreshToken, remember } = getStoredTokens();
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: data, 
          tokens: { accessToken, refreshToken },
          rememberMe: remember 
        } 
      });
    } catch (err) {
      console.error('Initial profile fetch failed (401 expected if token invalid):', err.response?.status, err.message);
      // Clear tokens on failure
      clearAllTokens();
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Enhanced Login with Remember Me
  const login = async (email, password, remember = false) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data } = await axios.post('/api/auth/login', { email, password, remember });
      
      const accessToken = data.tokens?.accessToken || data.token;
      const refreshToken = data.tokens?.refreshToken || data.refreshToken;
      
      setAuthTokens(accessToken, refreshToken, remember);
      
      const user = data.user || { 
        _id: data._id, 
        name: data.name, 
        email: data.email, 
        role: data.role 
      };
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user, 
          tokens: { accessToken, refreshToken },
          rememberMe: remember 
        } 
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      return { success: false, message };
    }
  };

  // Register (OTP sending)
  const register = async (name, email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      toast.success(data.message || 'OTP sent');
      dispatch({ type: 'LOGIN_SUCCESS', payload: null });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      return { success: false, message };
    }
  };

  // Verify OTP
  const verifyOtp = async (email, otp, remember = false) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data } = await axios.post('/api/auth/verify-otp', { email, otp, remember });
      if (!data || !data.tokens) throw new Error(data?.error || 'Invalid response from server');
      
      setAuthTokens(data.tokens.accessToken, data.tokens.refreshToken, remember);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          ...data,
          rememberMe: remember
        } 
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'OTP verification failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      return { success: false, message };
    }
  };
  
  // Enhanced Google Login with Remember Me
  const loginWithGoogle = async (googleToken, remember = false) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const { data } = await axios.post('/api/auth/google', {
        credential: googleToken,
        remember
      });

      const accessToken = data.tokens.accessToken;
      const refreshToken = data.tokens.refreshToken;

      setAuthTokens(accessToken, refreshToken, remember);

      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          ...data,
          rememberMe: remember
        } 
      });
      return { success: true };

    } catch (error) {
      const message = error.response?.data?.error || 'Google login failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      return { success: false, message };
    }
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    dispatch({ type: 'FORGOT_PASSWORD_START' });
    try {
      const { data } = await axios.post('/api/auth/forgot-password', { email });
      dispatch({ type: 'FORGOT_PASSWORD_SUCCESS' });
      return { success: true, message: data.message };
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to send reset email';
      dispatch({ type: 'FORGOT_PASSWORD_FAIL', payload: message });
      return { success: false, message };
    }
  };

  // Reset Password
  const resetPassword = async (token, password) => {
    dispatch({ type: 'RESET_PASSWORD_START' });
    try {
      const { data } = await axios.post('/api/auth/reset-password', { token, password });
      dispatch({ type: 'RESET_PASSWORD_SUCCESS' });
      return { success: true, message: data.message };
    } catch (error) {
      const message = error.response?.data?.error || error.response?.data?.message || 'Password reset failed';
      dispatch({ type: 'RESET_PASSWORD_FAIL', payload: message });
      return { success: false, message };
    }
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });
  const updateUser = (userData) => dispatch({ type: 'UPDATE_USER', payload: userData });

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login: (email, password) => login(email, password, false),
        loginWithRemember: (email, password) => login(email, password, true),
        loginWithGoogle: (token) => loginWithGoogle(token, false),
        loginWithGoogleRemember: (token) => loginWithGoogle(token, true),
        verifyOtp: (email, otp) => verifyOtp(email, otp, false),
        verifyOtpWithRemember: (email, otp) => verifyOtp(email, otp, true),
        register,
        logout,
        clearError,
        updateUser,
        forgotPassword,
        resetPassword,
        refreshAccessToken,
        waitForAuthReady, // FIXED: Removed conditional logic
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};