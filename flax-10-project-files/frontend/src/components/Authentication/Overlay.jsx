import * as Components from '../Authentication/AuthComponents';

function LeftPanel({ signIn, onToggle }) {
  return (
    <Components.LeftOverlayPanel $signIn={signIn}>
      <Components.Title>Log In</Components.Title>
      <Components.Paragraph>Log back in to use StudyFlax!</Components.Paragraph>
      <Components.GhostButton onClick={() => onToggle(true)}>Sign In</Components.GhostButton>
    </Components.LeftOverlayPanel>
  );
}

function RightPanel({ signIn, onToggle }) {
  return (
    <Components.RightOverlayPanel $signIn={signIn}>
      <Components.Title>Welcome to StudyFlax!</Components.Title>
      <Components.Paragraph>Sign up to use StudyFlax!</Components.Paragraph>
      <Components.GhostButton onClick={() => onToggle(false)}>Sign Up</Components.GhostButton>
    </Components.RightOverlayPanel>
  );
}

export const AuthOverlay = ({ signIn, onToggle }) => {
  return (
    <Components.OverlayContainer $signIn={signIn}>
      <Components.Overlay $signIn={signIn}>
        <LeftPanel signIn={signIn} onToggle={onToggle} />
        <RightPanel signIn={signIn} onToggle={onToggle} />
      </Components.Overlay>
    </Components.OverlayContainer>
  );
};