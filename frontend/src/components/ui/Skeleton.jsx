import React from 'react';

export const Skeleton = ({ height = '20px', width = '100%', borderRadius = '6px', className = '' }) => {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        height,
        width,
        borderRadius,
        backgroundColor: 'var(--border-color)',
        opacity: 0.6
      }}
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx}>
              <Skeleton height="18px" width={cIdx === 0 ? '60%' : '85%'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="row g-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="col-12 col-md-4">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-surface">
            <Skeleton height="16px" width="40%" className="mb-3" />
            <Skeleton height="32px" width="70%" className="mb-2" />
            <Skeleton height="14px" width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
};
