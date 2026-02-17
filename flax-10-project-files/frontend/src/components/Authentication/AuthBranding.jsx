export function AuthBrand() {
  return (
    <div style={{
      position: "absolute",
      top: 18,
      left: 20,
      zIndex: 3,
      userSelect: "none",
      pointerEvents: "none",
    }}>
      <div style={{
        fontSize: 12,
        letterSpacing: "0.34em",
        fontWeight: 800,
        color: "rgba(43,30,20,0.62)",
      }}>
        STUDYFLAX
      </div>
      <div style={{
        marginTop: 3,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.02em",
        color: "rgba(43,30,20,0.38)",
      }}>
        Built for calm study.
      </div>
    </div>
  );
}

export function AuthFooter({ absolute = false }) {
  return (
    <div style={{
      ...(absolute ? { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3 } : {}),
      width: "100%",
      textAlign: "center",
      padding: "4px 0 8px",
      fontSize: 11,
      color: "rgba(10,7,5,0.35)",
      userSelect: "none",
      letterSpacing: "0.02em",
    }}>
      Always secure · No ads · Free forever
    </div>
  );
}