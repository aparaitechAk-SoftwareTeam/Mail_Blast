export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatStatusBadge = (status) => {
  switch (status) {
    case 'Completed':
    case 'Sent':
      return 'bg-success text-white';
    case 'Sending':
    case 'Pending':
      return 'bg-warning text-dark';
    case 'Failed':
      return 'bg-danger text-white';
    case 'Scheduled':
      return 'bg-info text-dark';
    case 'Suppressed':
      return 'bg-secondary text-white';
    default:
      return 'bg-light text-dark border';
  }
};
