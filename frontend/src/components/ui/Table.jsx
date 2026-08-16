import React from 'react';

const Table = ({ headers = [], children, className = '', loading = false, empty = false, emptyMessage = 'No data available' }) => {
  return (
    <div className={`table-responsive rounded-4 border bg-surface overflow-hidden shadow-sm ${className}`}>
      <table className="table custom-table align-middle m-0">
        <thead>
          <tr>
            {headers.map((h, idx) => (
              <th key={idx} scope="col" className={typeof h === 'object' ? h.className : ''}>
                {typeof h === 'object' ? h.label : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
