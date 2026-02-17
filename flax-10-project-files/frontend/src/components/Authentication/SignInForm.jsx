import React from 'react';
import * as Components from '../Authentication/AuthComponents';

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

        <div style={{ height: "12px" }} />

        <Components.PasswordResetLink to='/reset-password'>
          Forgot password?
        </Components.PasswordResetLink>

        <div style={{ height: "8px" }} />

        <Components.Button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Components.Button>
      </Components.Form>
    </Components.SignInContainer>
  );
};