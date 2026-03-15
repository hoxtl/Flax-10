import { useState, useEffect } from "react";

const brandWrapStyle = {
  position: "absolute",
  top: 18,
  left: 20,
  zIndex: 3,
  userSelect: "none",
  pointerEvents: "none",
};

const brandNameStyle = {
  fontSize: 12,
  letterSpacing: "0.34em",
  fontWeight: 800,
  color: "rgba(43,30,20,0.62)",
};

const brandTagStyle = {
  marginTop: 3,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.02em",
  color: "rgba(43,30,20,0.38)",
};

const absoluteFooterStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 3,
};

const baseFooterStyle = {
  width: "100%",
  textAlign: "center",
  padding: "4px 0 8px",
  fontSize: 11,
  color: "rgba(0,0,0,0.35)",
  userSelect: "none",
  letterSpacing: "0.02em",
};

export function AuthBrand() {
  const [isTallEnough, setIsTallEnough] = useState(window.innerHeight >= 860);
  useEffect(() => {
    const handleResize = () => {
      setIsTallEnough(window.innerHeight >= 860);};
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);}, []);
  if (!isTallEnough) return null;
  return (
    <div style={brandWrapStyle}>
      <div style={brandNameStyle}>STUDYFLAX</div>
      <div style={brandTagStyle}>Built for calm study.</div>
    </div>);}

export function AuthFooter({ absolute = false }) {
  const style = absolute
    ? { ...absoluteFooterStyle, ...baseFooterStyle }
    : baseFooterStyle;
  return <div style={style}>Always secure · No ads · Free forever</div>;
}
