import React, { createContext, useState, useContext, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 9999, pointerEvents: 'none' }}>
        <AnimatePresence>
          {toasts.map((t) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';
            
            let bgClass = 'bg-white border-start border-4';
            let borderColor = '#10B981';
            let Icon = CheckCircle2;
            let iconColor = 'text-success';

            if (isError) {
              borderColor = '#EF4444';
              Icon = AlertCircle;
              iconColor = 'text-danger';
            } else if (isWarning) {
              borderColor = '#F59E0B';
              Icon = AlertTriangle;
              iconColor = 'text-warning';
            } else if (t.type === 'info') {
              borderColor = '#3B82F6';
              Icon = Info;
              iconColor = 'text-info';
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`shadow-lg rounded-3 p-3 mb-2 d-flex align-items-center justify-content-between gap-3 ${bgClass}`}
                style={{
                  pointerEvents: 'auto',
                  borderLeftColor: borderColor,
                  minWidth: '320px',
                  maxWidth: '450px'
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Icon className={iconColor} size={20} />
                  <span className="fw-medium text-dark small">{t.message}</span>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="btn btn-link text-muted p-0 ms-2"
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
