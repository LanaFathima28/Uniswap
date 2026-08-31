import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onIdTokenChanged 
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { registerUser, syncLogin, getCurrentUserProfile } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // MongoDB User Profile
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase Auth User
  const [token, setToken] = useState(localStorage.getItem('campusconnect_token') || null);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase Auth status & ID Token auto-refresh changes
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('campusconnect_token', idToken);

          // Fetch MongoDB User profile using GET /api/auth/me
          const meRes = await getCurrentUserProfile(idToken);
          if (meRes.success && meRes.data) {
            setCurrentUser(meRes.data);
          } else {
            // Fallback sync if /me failed or pending backend setup
            const syncRes = await syncLogin(fbUser.uid);
            if (syncRes.success && syncRes.data) {
              setCurrentUser(syncRes.data);
            }
          }
        } catch (error) {
          console.error("Error refreshing user token/profile:", error);
        }
      } else {
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('campusconnect_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Signup action
   */
  const signup = async ({ name, email, password, role, branch, year, company, designation }) => {
    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();

      // 2. Build MongoDB User Document payload
      const payload = {
        firebaseUID: fbUser.uid,
        name,
        email,
        role,
        ...(role === 'Student' ? { branch, year } : { company, designation })
      };

      // 3. Save User document in MongoDB via Backend API
      const dbRes = await registerUser(payload);

      if (!dbRes.success) {
        // Cleanup Firebase user if MongoDB registration fails
        await fbUser.delete().catch(() => {});
        throw new Error(dbRes.message || 'Failed to create MongoDB user profile');
      }

      setToken(idToken);
      localStorage.setItem('campusconnect_token', idToken);
      setCurrentUser(dbRes.data);

      return { success: true, user: dbRes.data, token: idToken };
    } catch (error) {
      throw error;
    }
  };

  /**
   * Login action
   */
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();

      // Fetch MongoDB User document by firebaseUID
      const syncRes = await syncLogin(fbUser.uid);
      
      if (!syncRes.success) {
        throw new Error(syncRes.message || 'User profile not found in database');
      }

      setToken(idToken);
      localStorage.setItem('campusconnect_token', idToken);
      setCurrentUser(syncRes.data);

      return { success: true, user: syncRes.data, token: idToken };
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout action
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out from Firebase:", error);
    } finally {
      setFirebaseUser(null);
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem('campusconnect_token');
      sessionStorage.clear();
    }
  };

  /**
   * Update currentUser profile in context state
   */
  const updateCurrentUser = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const value = {
    currentUser,
    firebaseUser,
    token,
    loading,
    signup,
    login,
    logout,
    updateCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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

export default AuthContext;
