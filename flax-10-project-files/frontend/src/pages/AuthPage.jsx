import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Components from '../components/Authentication/AuthComponents';
import { SignUpForm } from '../components/Authentication/SignUpForm';
import { SignInForm } from '../components/Authentication/SignInForm';
import { AuthOverlay } from '../components/Authentication/Overlay';
import { ErrorMessage } from '../components/Authentication/ErrorMessage';
import { useAuthForm } from '../hooks/useAuthForm';
import { authService } from '../api/authService';
import { validatePasswords, getErrorMessage, saveUserData } from '../utils/authHelpers';

/**
 * Main page for user authentication
 * Responsible for both sign up and log in user functionality
 */

export default function AuthPage() {
  const [signIn, toggle] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { formData: signUpData, updateField: updateSignUpField } = useAuthForm({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  
  const { formData: signInData, updateField: updateSignInField } = useAuthForm({
    username: '',
    password: ''
  });

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    const passwordError = validatePasswords(signUpData.password, signUpData.password2);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const { response, data } = await authService.register(signUpData);

      if (response.ok) {
        saveUserData(data.token, data.user);
      } else {
        setError(getErrorMessage(data));
      }
    } catch (err) {
      setError('There has been an error, please try again...');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { response, data } = await authService.login(signInData);

      if (response.ok) {
        saveUserData(data.token, data.user);
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('There has been an error, please try again...');
    } finally {
      setLoading(false);
    }
  };

  const handlePanelToggle = (isSignIn) => {
    toggle(isSignIn);
    setError('');
  };

  return (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0ede8 0%, #eadfd2 100%)'
  }}>
    <Components.Container>
      <ErrorMessage error={error} />
      
      <SignUpForm 
        signIn={signIn}
        formData={signUpData}
        updateField={updateSignUpField}
        onSubmit={handleSignUp}
        loading={loading}
      />

      <SignInForm 
        signIn={signIn}
        formData={signInData}
        updateField={updateSignInField}
        onSubmit={handleSignIn}
        loading={loading}
      />

      <AuthOverlay 
        signIn={signIn}
        onToggle={handlePanelToggle}
      />
    </Components.Container>
  </div>
);
}
