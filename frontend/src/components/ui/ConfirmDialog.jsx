import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="d-flex align-items-center gap-2">
          {variant === 'danger' ? (
            <div className="p-2 rounded-circle bg-danger-subtle text-danger">
              <AlertTriangle size={20} />
            </div>
          ) : (
            <div className="p-2 rounded-circle bg-primary-subtle text-primary">
              <Info size={20} />
            </div>
          )}
          <span>{title}</span>
        </div>
      }
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-muted m-0">{description}</p>
    </Modal>
  );
};

export default ConfirmDialog;
