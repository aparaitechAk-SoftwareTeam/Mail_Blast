import React from 'react';

export const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  helpText = '',
  icon: Icon = null,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label small fw-semibold text-secondary d-flex align-items-center justify-content-between">
          <span>
            {label}
            {required && <span className="text-danger ms-1">*</span>}
          </span>
        </label>
      )}
      <div className="position-relative">
        {Icon && (
          <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: 'none' }}>
            <Icon size={16} />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`form-control form-control-custom ${Icon ? 'ps-5' : ''} ${error ? 'is-invalid' : ''}`}
          {...props}
        />
      </div>
      {error && <div className="invalid-feedback d-block mt-1 small fw-medium">{error}</div>}
      {!error && helpText && <div className="form-text small text-muted mt-1">{helpText}</div>}
    </div>
  );
};

export const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error = '',
  helpText = '',
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label small fw-semibold text-secondary">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`form-select form-select-custom ${error ? 'is-invalid' : ''}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error && <div className="invalid-feedback d-block mt-1 small fw-medium">{error}</div>}
      {!error && helpText && <div className="form-text small text-muted mt-1">{helpText}</div>}
    </div>
  );
};

export const Textarea = ({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  required = false,
  error = '',
  helpText = '',
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label small fw-semibold text-secondary">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`form-control form-control-custom ${error ? 'is-invalid' : ''}`}
        {...props}
      />
      {error && <div className="invalid-feedback d-block mt-1 small fw-medium">{error}</div>}
      {!error && helpText && <div className="form-text small text-muted mt-1">{helpText}</div>}
    </div>
  );
};
