import React from 'react';
import * as Components from '../Authentication/AuthComponents';
import { Link } from 'react-router-dom';

/**
 * Authentication component for user sign in
 */
export const SignInForm = ({ signIn, formData, updateField, onSubmit, loading }) => {
  return (
    <Components.SignInContainer $signIn={signIn}>
      <Components.Form onSubmit={onSubmit}>
        <Components.Title>Sign in</Components.Title>
        
        <Components.Input 
          type='text' 
          placeholder='Username'
          value={formData.username}
          onChange={updateField('username')}
          required
          disabled={loading}
        />
        
        <Components.Input 
          type='password' 
          placeholder='Password'
          value={formData.password}
          onChange={updateField('password')}
          required
          disabled={loading}
        />
        
        <Components.PasswordResetLink to='/reset-password'>
          Reset your password here
        </Components.PasswordResetLink>
        
        <Components.Button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Sign In'}
        </Components.Button>
      </Components.Form>
    </Components.SignInContainer>
  );
};