import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
// Note: Google Sign-In requires custom dev client in Expo
// For now, we'll disable it to avoid errors
// import { GoogleSignin } from '@react-native-google-signin/google-signin';

class AuthService {
  constructor() {
    this.auth = auth;
    this.currentUser = null;
    this.recaptchaVerifier = null;
  }

  // Monitor auth state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(this.auth, callback);
  }

  // Email/Password Registration
  async registerWithEmail(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Email/Password Login
  async loginWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Phone Number Authentication
  async sendPhoneVerification(phoneNumber) {
    try {
      // For React Native, we need to use a different approach for phone auth
      // This is a simplified version - in production you'll need proper reCAPTCHA setup
      console.log('Attempting to send verification to:', phoneNumber);
      
      // Temporarily return a mock confirmation for development
      const mockConfirmation = {
        confirm: async (code) => {
          // For testing: accept test numbers with specific codes
          console.log('Verifying phone:', phoneNumber, 'with code:', code);
          
          if ((phoneNumber === '+1 8579957792' || phoneNumber === '+86 8579957792' || phoneNumber.includes('8579957792')) && code === '123456') {
            return { 
              user: { 
                uid: 'test-user-' + Date.now(),
                phoneNumber: phoneNumber,
                isAnonymous: false
              }
            };
          }
          if (phoneNumber.startsWith('+86') && code === '123456') {
            return { 
              user: { 
                uid: 'test-user-' + Date.now(),
                phoneNumber: phoneNumber,
                isAnonymous: false
              }
            };
          }
          // Accept any test code for development
          if (code === '123456') {
            return { 
              user: { 
                uid: 'test-user-' + Date.now(),
                phoneNumber: phoneNumber,
                isAnonymous: false
              }
            };
          }
          throw new Error('Invalid verification code. Please use 123456 for testing.');
        }
      };
      
      return { success: true, confirmationResult: mockConfirmation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async verifyPhoneCode(confirmationResult, code) {
    try {
      const userCredential = await confirmationResult.confirm(code);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Google Sign-In (disabled for Expo Go compatibility)
  async signInWithGoogle() {
    try {
      // For Expo Go, Google Sign-In requires custom dev client
      // This is a placeholder implementation
      throw new Error('Google Sign-In requires Expo custom dev client. Please use phone or password login.');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Apple Sign-In
  async signInWithApple() {
    try {
      // Apple sign-in provider
      const provider = new OAuthProvider('apple.com');
      const userCredential = await signInWithCredential(this.auth, provider);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // WeChat Sign-In (requires additional setup)
  async signInWithWeChat() {
    try {
      // WeChat integration would require WeChat SDK
      // This is a placeholder for future implementation
      throw new Error('WeChat login not yet implemented');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign Out
  async signOut() {
    try {
      await signOut(this.auth);
      // Note: Google Sign-In disabled for Expo Go
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get Current User
  getCurrentUser() {
    return this.auth.currentUser;
  }
}

export default new AuthService();