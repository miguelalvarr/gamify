import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabase/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUsername, setHasUsername] = useState(false); // Initialize as false by default
  const [userProfile, setUserProfile] = useState(null); // Add userProfile state

  // Session cache to prevent excessive refresh attempts
  const sessionCache = {
    lastRefreshTime: 0,
    refreshPromise: null,
    minRefreshInterval: 30000, // 30 seconds minimum between refresh attempts (reduced from 60s)
    isRefreshing: false
  };

  // Function to handle session refresh with exponential backoff and jitter
  const refreshSession = async (retryCount = 0, maxRetries = 5) => {
    // Check if we're already refreshing or if we've refreshed recently
    const now = Date.now();
    const timeSinceLastRefresh = now - sessionCache.lastRefreshTime;
    
    // If we're already refreshing, return the existing promise
    if (sessionCache.isRefreshing && sessionCache.refreshPromise) {
      console.log('Session refresh already in progress, reusing existing promise');
      return sessionCache.refreshPromise;
    }
    
    // If we've refreshed recently and not in a retry sequence, use cached result
    if (timeSinceLastRefresh < sessionCache.minRefreshInterval && retryCount === 0) {
      console.log('Using cached session, too soon to refresh again');
      // Return true if we have a user (indicating a valid session)
      return !!user;
    }
    
    // Set refreshing flag and create a new promise
    sessionCache.isRefreshing = true;
    sessionCache.refreshPromise = (async () => {
      try {
        // First check if we have an active session before attempting to refresh
        const { data: sessionData } = await supabase.auth.getSession();
        
        // If no active session exists, don't attempt to refresh
        if (!sessionData?.session) {
          console.log('No active session found, skipping refresh');
          sessionCache.isRefreshing = false;
          return false;
        }
        
        // Check if the session has a refresh token before attempting to refresh
        if (!sessionData.session.refresh_token) {
          console.log('No refresh token found in session, skipping refresh');
          sessionCache.isRefreshing = false;
          return false;
        }
        
        // Calculate exponential backoff with jitter
        // Base delay increases exponentially: 1s, 2s, 4s, 8s, 16s
        const baseDelay = retryCount > 0 ? Math.min(1000 * Math.pow(2, retryCount), 30000) : 0;
        // Add random jitter (±30%) to prevent synchronized retries
        const jitter = baseDelay * (0.7 + Math.random() * 0.6); // 70% to 130% of base delay
        const delay = Math.floor(jitter);
        
        // If we're retrying, wait for the calculated delay
        if (delay > 0) {
          console.log(`Waiting ${delay}ms before retry ${retryCount}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Session refresh error:', error);
          
          // Handle specific error types
          if ((error.message === 'Auth session missing!' || 
               error.message.includes('Invalid Refresh Token') || 
               error.message.includes('Refresh Token Not Found')) && 
              retryCount < maxRetries) {
            console.log(`Auth token issue, retrying (${retryCount + 1}/${maxRetries})...`);
            sessionCache.isRefreshing = false;
            return refreshSession(retryCount + 1, maxRetries);
          }
          
          // Handle rate limiting errors with longer backoff
          if (error.message === 'Request rate limit reached' && retryCount < maxRetries) {
            console.log(`Rate limited, retrying with longer delay (${retryCount + 1}/${maxRetries})...`);
            // Add extra delay for rate limiting (at least 5 seconds + jitter)
            const rateLimitDelay = 5000 + Math.floor(Math.random() * 5000);
            await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
            sessionCache.isRefreshing = false;
            return refreshSession(retryCount + 1, maxRetries);
          }
          
          // If max retries reached or other errors, don't sign out the user automatically
          // Just return false to indicate refresh failed
          sessionCache.isRefreshing = false;
          return false;
        }
        
        // Only update user state if the session actually changed
        if (data.session?.user?.id !== user?.id) {
          setUser(data.session?.user ?? null);
        }
        
        // Update cache timestamp on successful refresh
        sessionCache.lastRefreshTime = Date.now();
        sessionCache.isRefreshing = false;
        return true;
      } catch (err) {
        console.error('Session refresh error:', err);
        
        // Retry on unexpected errors
        if (retryCount < maxRetries) {
          console.log(`Retrying after error (${retryCount + 1}/${maxRetries})...`);
          sessionCache.isRefreshing = false;
          return refreshSession(retryCount + 1, maxRetries);
        }
        
        sessionCache.isRefreshing = false;
        return false;
      }
    })();
    
    return sessionCache.refreshPromise;
  };

  // Helper function to clear session data completely
  const clearSession = async () => {
    try {
      // First set local state to null to prevent UI flicker
      setUser(null);
      setUserProfile(null);
      setHasUsername(false);
      setError(null);
      
      // Reset session cache
      sessionCache.lastRefreshTime = 0;
      sessionCache.refreshPromise = null;
      sessionCache.isRefreshing = false;
      
      // Clear local storage to ensure no stale session data remains
      localStorage.removeItem('supabase.auth.token');
      
      // Then clear Supabase session - this ensures UI updates happen immediately
      // even if the API call takes time
      await supabase.auth.signOut({ scope: 'global' });
      
      console.log('Session cleared successfully');
      return true;
    } catch (err) {
      console.error('Error clearing session:', err);
      // Even if there's an error with the API, we still want to clear local state
      return false;
    }
  };

  // Function to fetch user profile
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      setUserProfile(data);
      // Set hasUsername based on whether username exists and is not null/empty
      setHasUsername(data?.username ? true : false);
      return data;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Validate the session has the necessary components
        if (session?.access_token && session?.refresh_token) {
          setUser(session?.user ?? null);
          
          // If user exists, fetch profile data
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          }
        } else if (session) {
          // Session exists but is missing tokens - clear it
          console.log('Session exists but is missing tokens, clearing session');
          await clearSession();
        } else {
          // No session found
          setUser(null);
          setError(null);
          setHasUsername(false);
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();

    // Set up a periodic session refresh to prevent token expiration
    // Reduced frequency to prevent excessive refreshes
    const refreshInterval = setInterval(() => {
      if (user) {
        console.log('Performing periodic session refresh');
        refreshSession().catch(err => {
          console.error('Periodic refresh error:', err);
          // Don't sign out on refresh errors, just log them
        });
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes to reduce frequency

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth state changed: ${event}`);
      try {
        // Handle different auth events
        if (event === 'SIGNED_IN') {
          // Validate the session has the necessary components
          if (session?.access_token && session?.refresh_token) {
            // Only update user if it's different from current user
            if (session?.user?.id !== user?.id) {
              setUser(session?.user ?? null);
              if (session?.user) {
                await fetchUserProfile(session.user.id);
              }
            }
          } else {
            console.warn('Signed in but missing tokens, session may be invalid');
          }
        } else if (event === 'SIGNED_OUT') {
          // Use the clearSession helper to ensure complete cleanup
          // But don't call supabase.auth.signOut again since that's what triggered this event
          setUser(null);
          setUserProfile(null);
          setHasUsername(false);
          setError(null);
          
          // Reset session cache on sign out
          sessionCache.lastRefreshTime = 0;
          sessionCache.refreshPromise = null;
          sessionCache.isRefreshing = false;
          
          // Clear any local storage items that might contain session data
          localStorage.removeItem('supabase.auth.token');
        } else if (event === 'TOKEN_REFRESHED') {
          // Validate the refreshed token
          if (session?.access_token && session?.refresh_token) {
            // Don't update user state unless necessary
            if (session?.user?.id !== user?.id) {
              setUser(session?.user ?? null);
            }
            // Update cache timestamp on token refresh
          sessionCache.lastRefreshTime = Date.now();
          }
        } else if (event === 'USER_UPDATED') {
          // Only update if there's an actual change
          if (session?.user?.id === user?.id) {
            setUser(session?.user ?? null);
            await fetchUserProfile(session.user.id);
          }
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email and password and username
  const signUp = async (email, password, username) => {
    try {
      setError(null);
      
      // First check if username is already taken
      const { data: existingUser, error: usernameError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
      
      if (existingUser) {
        throw new Error('Este nombre de usuario ya está en uso');
      }
      
      // Create the user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // If user was created successfully, update their profile with the username
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: username,
            updated_at: new Date()
          });
        
        if (profileError) throw profileError;
        setHasUsername(true);
      }
      
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      return await clearSession();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Reset password (sends reset password email)
  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };
  
  // Update or set username
  const updateUsername = async (username) => {
    try {
      setError(null);
      
      if (!user) throw new Error('No hay usuario autenticado');
      
      // Check if username is already taken by another user
      const { data: existingUser, error: usernameError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id) // Exclude current user
        .single();
      
      if (existingUser) {
        throw new Error('Este nombre de usuario ya está en uso');
      }
      
      // Update the profile with the new username
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username,
          updated_at: new Date()
        });
      
      if (error) throw error;
      
      setHasUsername(true);
      return true;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };
  
  // Get the current user's profile including username
  const getUserProfile = async () => {
    try {
      setError(null);
      
      if (!user) throw new Error('No hay usuario autenticado');
      
      // Try to refresh the session first if needed
      if (!await refreshSession()) {
        throw new Error('La sesión ha expirado. Por favor, inicie sesión de nuevo.');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };
  
  // Generate default avatar from username
  const getDefaultAvatar = (username) => {
    if (!username) return '';
    return username.charAt(0).toUpperCase();
  };

  // Upload profile picture
  const uploadProfilePicture = async (file) => {
    try {
      setError(null);
      
      if (!user) throw new Error('No hay usuario autenticado');
      
      // Try to refresh the session first if needed
      if (!await refreshSession()) {
        throw new Error('La sesión ha expirado. Por favor, inicie sesión de nuevo.');
      }
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date() })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Update the local userProfile state
      setUserProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      
      return publicUrl;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateUsername,
    getUserProfile,
    getDefaultAvatar,
    uploadProfilePicture,
    refreshSession,
    user,
    userProfile,
    loading,
    error,
    hasUsername
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}