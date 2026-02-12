import React from 'react';
import * as Components from '../Authentication/AuthComponents';

/**
 * Sign In form component
 */
export const SignInForm = ({ signIn, formData, updateField, onSubmit, loading }) => {
  return (
    <Components.SignInContainer signinIn={signIn}>
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
        
        <Components.Anchor href='#'>Forgot your password?</Components.Anchor>
        
        <Components.Button type="submit" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Components.Button>
      </Components.Form>
    </Components.SignInContainer>
  );
};