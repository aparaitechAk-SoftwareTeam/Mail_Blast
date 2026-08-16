import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, change, trend = 'up', color = 'primary', description }) => {
  let colorBg = 'bg-primary-subtle text-primary';
  if (color === 'success') colorBg = 'bg-success-subtle text-success';
  if (color === 'warning') colorBg = 'bg-warning-subtle text-warning';
  if (color === 'danger') colorBg = 'bg-danger-subtle text-danger';
  if (color === 'info') colorBg = 'bg-info-subtle text-info';

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="card border-0 shadow-sm rounded-4 h-100 p-4 bg-surface"
    >
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span className="text-muted small fw-semibold uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-3 d-flex align-items-center justify-content-center ${colorBg}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="d-flex align-items-baseline justify-content-between">
        <h3 className="fw-bold m-0 text-dark tracking-tight">{value}</h3>
        {change !== undefined && change !== null && (
          <div className={`d-flex align-items-center gap-1 small fw-semibold ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{change}</span>
          </div>
        )}
      </div>

      {description && <p className="text-muted small m-0 mt-2">{description}</p>}
    </motion.div>
  );
};

export default StatCard;
