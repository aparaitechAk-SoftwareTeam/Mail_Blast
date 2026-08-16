import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  type = 'button',
  className = '',
  onClick,
  ...props
}) => {
  let variantClass = 'btn-primary-custom';
  if (variant === 'secondary') variantClass = 'btn-secondary-custom';
  else if (variant === 'danger') variantClass = 'btn-danger-custom';
  else if (variant === 'outline') variantClass = 'btn-outline-custom';
  else if (variant === 'hero-secondary') variantClass = 'btn-hero-secondary';
  else if (variant === 'ghost') variantClass = 'btn-ghost-custom';

  let sizeClass = 'btn-md-custom';
  if (size === 'sm') sizeClass = 'btn-sm-custom';
  else if (size === 'lg') sizeClass = 'btn-lg-custom';

  return (
    <button
      type={type}
      className={`btn d-inline-flex align-items-center justify-content-center gap-2 fw-semibold ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span>{typeof loading === 'string' ? loading : 'Processing...'}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 18} />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 18} />}
        </>
      )}
    </button>
  );
};

export default Button;
