import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no items to display right now.',
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`text-center py-5 px-3 rounded-4 bg-surface border border-dashed ${className}`}>
      <div className="p-3 bg-light rounded-circle d-inline-flex align-items-center justify-content-center text-muted mb-3">
        <Icon size={32} />
      </div>
      <h6 className="fw-bold text-dark m-0">{title}</h6>
      <p className="text-muted small max-w-md mx-auto mt-1 mb-4" style={{ maxWidth: '400px' }}>
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
