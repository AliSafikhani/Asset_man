import React from 'react';

const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, icon = null, type = 'button' }) => {
  const variants = {
    primary: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', hoverBackground: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)', color: 'white' },
    secondary: { background: '#6b7280', hoverBackground: '#4b5563', color: 'white' },
    danger: { background: '#ef4444', hoverBackground: '#dc2626', color: 'white' },
    warning: { background: '#f59e0b', hoverBackground: '#d97706', color: 'white' },
    outline: { background: 'transparent', hoverBackground: '#f3f4f6', color: '#4f46e5', border: '1px solid #4f46e5' }
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '10px 20px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' }
  };

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.md;

  const buttonStyle = {
    padding: sizeStyle.padding,
    fontSize: sizeStyle.fontSize,
    fontWeight: '500',
    borderRadius: '8px',
    border: variantStyle.border || 'none',
    background: variantStyle.background,
    color: variantStyle.color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'inherit'
  };

  const handleMouseEnter = (e) => {
    if (!disabled) {
      e.currentTarget.style.background = variantStyle.hoverBackground;
      if (variantStyle.border) e.currentTarget.style.background = variantStyle.hoverBackground;
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled) {
      e.currentTarget.style.background = variantStyle.background;
      if (variantStyle.border) e.currentTarget.style.background = 'transparent';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
