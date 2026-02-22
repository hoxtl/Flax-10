const boxStyle = {
  marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: '8px',
  background: 'var(--warning-bg, #fff8e6)',
  border: '1px solid var(--warning-border, #f0c040)',
  fontSize: '0.85rem', color: 'var(--warning-text, #7a5c00)',
};

function WarningText({ major }) {
  return (
    <>
      <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>⚠️ Are you sure you want to select <em>{major}</em>?</p>
      <p style={{ margin: '0 0 0.75rem', lineHeight: 1.5 }}>This cannot be changed after setup. Modules will be automatically assigned.</p>
    </>
  );
}

function ConfirmCheckbox({ confirmed, onConfirm }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
      <input type="checkbox" checked={confirmed} onChange={e => onConfirm(e.target.checked)} />
      I understand this cannot be changed later
    </label>
  );
}

export default function WarningBox({ major, confirmed, onConfirm }) {
  return (
    <div style={boxStyle}>
      <WarningText major={major} />
      <ConfirmCheckbox confirmed={confirmed} onConfirm={onConfirm} />
    </div>
  );
}