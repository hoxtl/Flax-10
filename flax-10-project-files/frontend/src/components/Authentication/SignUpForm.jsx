import React from 'react';
import * as Components from '../Authentication/AuthComponents';

/**
 * Authentication component for user sign up
 */
export const SignUpForm = ({ signIn, formData, updateField, onSubmit, loading }) => {
  const fields = [
    { name: 'first_name', type: 'text', placeholder: 'First Name' },
    { name: 'last_name', type: 'text', placeholder: 'Last Name' },
    { name: 'username', type: 'text', placeholder: 'Username' },
    { name: 'email', type: 'email', placeholder: 'Email' },
    { name: 'password', type: 'password', placeholder: 'Password', minLength: 8 },
    { name: 'password2', type: 'password', placeholder: 'Confirm Password', minLength: 8 }
  ];

  return (
    <Components.SignUpContainer $signIn={signIn}>
      <Components.Form onSubmit={onSubmit}>
        <Components.Title>Create Account</Components.Title>

        {fields.map(field => (
          <Components.Input
            key={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.name]}
            onChange={updateField(field.name)}
            required
            minLength={field.minLength}
            disabled={loading}
          />
        ))}

        <Components.Button type="submit" disabled={loading}>
          {loading ? 'Registering Account...' : 'Sign Up'}
        </Components.Button>
      </Components.Form>
    </Components.SignUpContainer>
  );
};