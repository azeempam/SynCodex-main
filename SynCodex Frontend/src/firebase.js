import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseAttributes } from "./firebaseAttributes";
import API from "./services/api";

const firebaseConfig = {
  apiKey: firebaseAttributes.apiKey,
  authDomain: firebaseAttributes.authDomain,
  projectId: firebaseAttributes.projectId,
  storageBucket: firebaseAttributes.storageBucket,
  messagingSenderId: firebaseAttributes.messagingSenderId,
  appId: firebaseAttributes.appId,
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ✅ Google Sign-Up/Login
const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    if (user) {
       // Verify token with backend server
      const res = await API.post('/api/auth/google', { 
        email: user.email,
        name: user.displayName,
        googleId: user.uid
       });
      const newToken = res.data.token;

      // Store new token in local storage
      localStorage.setItem("token", newToken); 
      localStorage.setItem("email", user.email);
      localStorage.setItem("name", user.displayName);
      return user;
    }
  } catch (error) {
    console.error("Google Login Error:", error);
  }
};

export { auth, loginWithGoogle }; 
