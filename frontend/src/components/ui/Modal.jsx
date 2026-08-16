import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md', // sm, md, lg, xl
  className = ''
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  let sizeWidth = '500px';
  if (size === 'sm') sizeWidth = '400px';
  if (size === 'lg') sizeWidth = '720px';
  if (size === 'xl') sizeWidth = '920px';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 backdrop-blur"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`card border-0 shadow-lg rounded-4 overflow-hidden position-relative w-100 ${className}`}
            style={{ maxWidth: sizeWidth, zIndex: 1051, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="card-header bg-white border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
              <div>
                <h5 className="modal-title fw-bold m-0 text-dark">{title}</h5>
                {subtitle && <p className="text-muted small m-0 mt-1">{subtitle}</p>}
              </div>
              <button
                type="button"
                className="btn btn-icon btn-ghost-custom rounded-circle p-1 text-muted"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="card-body p-4 overflow-y-auto" style={{ flex: 1 }}>
              {children}
            </div>

            {footer && (
              <div className="card-footer bg-light border-top px-4 py-3 d-flex align-items-center justify-content-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
