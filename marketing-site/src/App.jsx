import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import Home from './Component/Home';
import About from './Component/About';
import Course from './Component/Course';
import Contact from './Component/Contact';
import PrivacyPolicy from './Policies/PrivacyPolicy';
import Cookies from './Policies/Cookies';
import Terms from './Policies/Terms';

function App() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [modalTitle, setModalTitle] = useState('Log In');

  const openLogin = () => {
    setModalOpen(true);
    setIsLogin(true);
    setModalTitle('Log In');
  };

  const openSignup = () => {
    setModalOpen(true);
    setIsLogin(false);
    setModalTitle('Sign Up');
  };

  const closeModal = () => setModalOpen(false);

  const switchToSignup = () => {
    setIsLogin(false);
    setModalTitle('Sign Up');
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setModalTitle('Log In');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const displayName = userCredential.user.displayName ||
        userCredential.user.email.split('@')[0];
      alert(`Login successful!\nWelcome to the investing league Mr/Ms. "${displayName}"`);
      closeModal();
    } catch (error) {
      alert(error.message);
    }
  };
  const handleSignup = async (e) => {
    e.preventDefault();
    const email = e.target['signup-email'].value;
    const password = e.target['signup-password'].value;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const displayName = userCredential.user.displayName ||
        userCredential.user.email.split('@')[0];
      alert(`Signup successful!\nWelcome to the investing league Mr/Ms. "${displayName}"`);
    } catch (error) {
      alert(error.message);
    }
  };
  // const handleGoogleSignIn = async () => {
  //   const provider = new GoogleAuthProvider();
  //   try {
  //     await signInWithPopup(auth, provider);
  //     alert("Google sign-in successful!");
  //     closeModal();
  //   } catch (error) {
  //     alert(error.message);
  //   }
  // };

  return (
    <Router>
      {/* Login/Signup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 modal-content">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{modalTitle}</h3>
                <button className="text-gray-400 hover:text-gray-500" onClick={closeModal}>
                  <span className="w-6 h-6 flex items-center justify-center">&times;</span>
                </button>
              </div>
              {isLogin ? (
                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      placeholder="Enter your email" />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" id="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      placeholder="Enter your password" />
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 transition-all"></div>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-3"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900">Remember Me</span>
                    </label>
                    <a href="#" className="text-sm text-primary">Forgot password?</a>
                  </div>
                  <button
                    className="w-full bg-primary text-white py-2 !rounded-button whitespace-nowrap hover:bg-primary/90 mb-4"
                    type="submit"
                  >
                    Log In
                  </button>
                  {/* <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 py-2 rounded mb-4 hover:bg-gray-50"
                  >
                    <img src="./googleicon.png" alt="Google" className="w-5 h-5 mr-2" />
                    Sign in with Google
                  </button> */}
                  <p className="text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button type="button" className="text-primary hover:underline" onClick={switchToSignup}>
                      Sign up
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignup}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" id="name" required
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      placeholder="Enter your full name" />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="signup-email" required
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      placeholder="Enter your email" />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" requiredid="signup-password"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      placeholder="Create a password" />
                  </div>
                  <div className="mb-6">
                    <label htmlFor="confirm-password" required className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input type="password" id="confirm-password"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                      placeholder="Confirm your password" />
                  </div>
                  <button
                    className="w-full bg-primary text-white py-2 !rounded-button whitespace-nowrap hover:bg-primary/90 mb-4"
                    type="submit"
                  >
                    Sign Up
                  </button>
                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <button type="button" className="text-primary hover:underline" onClick={switchToLogin}>
                      Log in
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home openLogin={openLogin} openSignup={openSignup} />} />
        <Route path="/home" element={<Home openLogin={openLogin} openSignup={openSignup} />} />
        <Route path="/about" element={<About openLogin={openLogin} openSignup={openSignup} />} />
        <Route path="/course" element={<Course openLogin={openLogin} openSignup={openSignup} />} />
        <Route path="/contact" element={<Contact openLogin={openLogin} openSignup={openSignup} />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />


      </Routes>
    </Router>
  );
}

export default App;