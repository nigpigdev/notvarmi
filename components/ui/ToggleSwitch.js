// Toggle Switch Component
function ToggleSwitch({ checked, onChange, disabled }) {
    return (
        <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '50px',
            height: '28px',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer'
        }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => !disabled && onChange(e.target.checked)}
                disabled={disabled}
                style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
                position: 'absolute',
                cursor: disabled ? 'not-allowed' : 'pointer',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: checked ? '#f97316' : '#ccc',
                borderRadius: '28px',
                transition: '0.4s'
            }}>
                <span style={{
                    position: 'absolute',
                    content: '',
                    height: '20px',
                    width: '20px',
                    left: checked ? '26px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.4s'
                }}></span>
            </span>
        </label>
    );
}

export default ToggleSwitch;
