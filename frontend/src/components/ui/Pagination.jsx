import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="d-flex align-items-center justify-content-between pt-3 pb-1 px-1 border-top mt-3">
      <div className="text-muted small">
        Showing <span className="fw-semibold text-dark">{startItem}</span> to <span className="fw-semibold text-dark">{endItem}</span> of <span className="fw-semibold text-dark">{totalItems}</span> entries
      </div>

      <div className="d-flex align-items-center gap-1">
        <button
          className="btn btn-sm btn-outline-custom p-1 px-2"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>

        <span className="small text-muted px-2 fw-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          className="btn btn-sm btn-outline-custom p-1 px-2"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
