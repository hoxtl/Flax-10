import React from 'react';
import * as Components from '../Authentication/AuthComponents';

/**
 * Overlay panels for switching between sign in and sign up
 */
export const AuthOverlay = ({ signIn, onToggle }) => {
  return (
    <Components.OverlayContainer signinIn={signIn}>
      <Components.Overlay signinIn={signIn}>
        
        <Components.LeftOverlayPanel signinIn={signIn}>
          <Components.Title>Log In</Components.Title>
          <Components.Paragraph>
            Log back in to use StudyFlax!
          </Components.Paragraph>
          <Components.GhostButton onClick={() => onToggle(true)}>
            Sign In
          </Components.GhostButton>
        </Components.LeftOverlayPanel>

        <Components.RightOverlayPanel signinIn={signIn}>
          <Components.Title>Welcome to StudyFlax!</Components.Title>
          <Components.Paragraph>
            Sign up to use StudyFlax!
          </Components.Paragraph>
          <Components.GhostButton onClick={() => onToggle(false)}>
            Sign Up
          </Components.GhostButton>
        </Components.RightOverlayPanel>

      </Components.Overlay>
    </Components.OverlayContainer>
  );
};