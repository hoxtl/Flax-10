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
  fontSize: 13,
  letterSpacing: "0.24em",
  fontWeight: 800,
  fontFamily: `'Playfair Display', 'Georgia', serif`,
  color: "rgba(40, 27, 14, 0.82)",
  marginBottom: 4,
};

const brandOrbitalStyle = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const brandDotStyle = {
  width: 9,
  height: 9,
  borderRadius: "999px",
  background: "linear-gradient(135deg, #9e7e5d, #5f3f26)",
  boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.75)",
};

const brandTagStyle = {
  marginTop: 3,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
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
      <div style={brandOrbitalStyle}>
        <span style={brandDotStyle} />
        <span style={brandNameStyle}>STUDYFLAX</span>
      </div>
      <div style={brandTagStyle}>Built for calm study.</div>
    </div>);}

export function AuthFooter({ absolute = false }) {
  const style = absolute
    ? { ...absoluteFooterStyle, ...baseFooterStyle }
    : baseFooterStyle;
  return <div style={style}>Always secure · No ads · Free forever</div>;
}
