import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtext }) => {
  return (
    <div className="stat-card">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span className="text-muted fw-medium" style={{ fontSize: '0.875rem' }}>{title}</span>
        <div className={`icon-wrapper bg-${color} bg-opacity-10 text-${color}`}>
          <Icon size={22} />
        </div>
      </div>
      <h2 className="fw-bold mb-1">{value}</h2>
      {subtext && <div className="small text-muted" style={{ fontSize: '0.8rem' }}>{subtext}</div>}
    </div>
  );
};

export default StatCard;
