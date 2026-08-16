import React from 'react';

export const StatusBadge = ({ status, type = 'campaign' }) => {
  if (!status) return null;

  let bg = 'bg-secondary-subtle text-secondary border-secondary-subtle';

  if (type === 'role') {
    if (status === 'Admin') bg = 'badge-admin';
    else if (status === 'Recruiter') bg = 'badge-recruiter';
    else if (status === 'Viewer') bg = 'badge-viewer';
  } else if (type === 'campaign') {
    if (status === 'Completed') bg = 'badge-completed';
    else if (status === 'Sending') bg = 'badge-sending';
    else if (status === 'Scheduled') bg = 'badge-scheduled';
    else if (status === 'Draft') bg = 'badge-draft';
    else if (status === 'Failed' || status === 'Cancelled') bg = 'badge-failed';
  } else if (type === 'emailLog') {
    if (status === 'Sent' || status === 'Accepted') bg = 'badge-completed';
    else if (status === 'Pending' || status === 'Sending') bg = 'badge-sending';
    else if (status === 'Failed') bg = 'badge-failed';
    else if (status === 'Suppressed') bg = 'badge-suppressed';
    else if (status === 'Retried') bg = 'badge-scheduled';
  } else if (type === 'placement') {
    if (status === 'Placed') bg = 'badge-completed';
    else if (status === 'Unplaced') bg = 'badge-unplaced';
    else if (status === 'Internship Only') bg = 'badge-scheduled';
    else if (status === 'Opted Out') bg = 'badge-suppressed';
  }

  return (
    <span className={`badge-custom ${bg}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
