 import styled from 'styled-components';

 
export const Container = styled.div`
 background-color: #ffffff;
 border-radius: 10px;
 box-shadow: 0 14px 28px rgba(74, 52, 33, 0.18), 0 10px 10px rgba(74, 52, 33, 0.12);
 position: relative;
 overflow: hidden;
 width: 850px;
 max-width: 100%;
 min-height: 650px;
 `;

 export const SignUpContainer = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
  left: 0;
  width: 50%;
  opacity: 0;
  z-index: 1;
  ${props => props.signIn !== true ? `
    transform: translateX(100%);
    opacity: 1;
    z-index: 5;
  ` 
  : null}
 `;
 

 export const SignInContainer = styled.div`
 position: absolute;
 top: 0;
 height: 100%;
 transition: all 0.6s ease-in-out;
 left: 0;
 width: 50%;
 z-index: 2;
 ${props => (props.signIn !== true ? `transform: translateX(100%);` : null)}
 `;
 
 export const Form = styled.form`
 background-color: #ffffff;
 display: flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 padding: 0 50px;
 height: 100%;
 text-align: center;
 `;
 
 export const Title = styled.h1`
 font-weight: bold;
 margin: 0;
 font-size: 45px;
 text-align: center;
 padding-left: 20px;
 `;
 
export const Input = styled.input`
 background-color: #f0ede8;
 border: 1px solid rgba(74, 52, 33, 0.18);
 padding: 12px 15px;
 margin: 8px 0;
 width: 100%;
 border-radius: 4px;
 color: #2B1E14;
 
 &:focus {
   outline: none;
   border-color: #9E7E5D;
   background-color: #ffffff;
 }
 
 &::placeholder {
   color: rgba(43, 30, 20, 0.55);
 }
 `;
 

export const Button = styled.button`
    border-radius: 20px;
    border: 1px solid #9E7E5D;
    background-color: #9E7E5D;
    color: #ffffff;
    font-size: 12px;
    font-weight: bold;
    padding: 12px 45px;
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: all 200ms ease-in;
    cursor: pointer;
    
    &:hover:not(:disabled) {
        background-color: transparent;
        border-color: #9E7E5D;
        color: #9E7E5D;
    }
    
    &:active{
        transform: scale(0.95);
    }
    &:focus {
        outline: none;
    }
    
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
 `;


export const GhostButton = styled(Button)`
 background-color: transparent;
 border-color: #ffffff;
 color: #ffffff;
 
 &:hover:not(:disabled) {
   background-color: rgba(255, 255, 255, 0.1);
   border-color: #ffffff;
 }
 `;
 
export const Anchor = styled.a`
 color: #9E7E5D;
 font-size: 14px;
 text-decoration: none;
 margin: 15px 0;
 
 &:hover {
   color: #4A3421;
   text-decoration: underline;
 }
 `;


 export const OverlayContainer = styled.div`
position: absolute;
top: 0;
left: 50%;
width: 50%;
height: 100%;
overflow: hidden;
transition: transform 0.6s ease-in-out;
z-index: 100;
${props =>
  props.signIn !== true ? `transform: translateX(-100%);` : null}
`;

export const Overlay = styled.div`
background: linear-gradient(135deg, #9E7E5D 0%, #81725B 50%, #4A3421 100%);
background-repeat: no-repeat;
background-size: cover;
background-position: 0 0;
color: #ffffff;
position: relative;
left: -100%;
height: 100%;
width: 200%;
transform: translateX(0);
transition: transform 0.6s ease-in-out;
${props => (props.signIn !== true ? `transform: translateX(50%);` : null)}
`;
 
 export const OverlayPanel = styled.div`
     position: absolute;
     display: flex;
     align-items: center;
     justify-content: center;
     flex-direction: column;
     padding: 0 40px;
     text-align: center;
     top: 0;
     height: 100%;
     width: 50%;
     transform: translateX(0);
     transition: transform 0.6s ease-in-out;
 `;

 export const LeftOverlayPanel = styled(OverlayPanel)`
   transform: translateX(-20%);
   ${props => props.signIn !== true ? `transform: translateX(0);` : null}
 `;

 export const RightOverlayPanel = styled(OverlayPanel)`
     right: 0;
     transform: translateX(0);
     ${props => props.signIn !== true ? `transform: translateX(20%);` : null}
 `;

export const Paragraph = styled.p`
 font-size: 14px;
 font-weight: 100;
 line-height: 20px;
 letter-spacing: 0.5px;
 margin: 20px 0 30px;
 color: #ffffff;
 max-width: 280px;
 `;