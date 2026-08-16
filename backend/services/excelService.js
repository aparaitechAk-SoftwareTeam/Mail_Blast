const xlsx = require('xlsx');

const parseAndValidateFile = (buffer, mimetype, existingEmails = []) => {
  let rows = [];

  try {
    if (mimetype.includes('csv') || mimetype.includes('text')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    } else {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    }
  } catch (err) {
    throw new Error('Failed to parse file structure: ' + err.message);
  }

  const validRows = [];
  const invalidRows = [];
  const duplicateRows = [];
  const seenInFileEmails = new Set();
  const existingSet = new Set(existingEmails.map(e => e.toLowerCase().trim()));

  rows.forEach((row, index) => {
    const rowNum = index + 2; // header is line 1
    
    // Normalize header keys dynamically (case-insensitive & whitespace trimmed)
    const normalized = {};
    Object.keys(row).forEach(key => {
      const k = key.trim().toLowerCase();
      if (k.includes('name')) normalized.name = String(row[key]).trim();
      else if (k.includes('email')) normalized.email = String(row[key]).trim().toLowerCase();
      else if (k.includes('phone') || k.includes('mobile')) normalized.phone = String(row[key]).trim();
      else if (k.includes('college') || k.includes('university') || k.includes('inst')) normalized.college = String(row[key]).trim();
      else if (k.includes('branch') || k.includes('dept') || k.includes('course') || k.includes('stream')) normalized.branch = String(row[key]).trim();
      else if (k.includes('year') || k.includes('grad')) normalized.graduationYear = parseInt(row[key]) || null;
      else if (k.includes('cgpa') || k.includes('marks') || k.includes('gpa')) normalized.cgpa = parseFloat(row[key]) || 0;
      else if (k.includes('status') || k.includes('placement')) normalized.placementStatus = String(row[key]).trim();
    });

    // Default fallback values
    normalized.college = normalized.college || 'Unspecified Institution';
    normalized.branch = normalized.branch || 'Computer Science';
    normalized.graduationYear = normalized.graduationYear || new Date().getFullYear();
    normalized.cgpa = normalized.cgpa || 7.0;
    normalized.placementStatus = normalized.placementStatus || 'Unplaced';

    const errors = [];

    if (!normalized.name) errors.push('Student Name is required');
    if (!normalized.email) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalized.email)) {
        errors.push('Invalid email format');
      }
    }

    if (normalized.cgpa < 0 || normalized.cgpa > 10) {
      errors.push('CGPA must be between 0 and 10');
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNum, data: normalized, errors });
    } else if (seenInFileEmails.has(normalized.email) || existingSet.has(normalized.email)) {
      duplicateRows.push({ 
        rowNum, 
        data: normalized, 
        reason: seenInFileEmails.has(normalized.email) ? 'Duplicate in uploaded file' : 'Already exists in database' 
      });
    } else {
      seenInFileEmails.add(normalized.email);
      validRows.push(normalized);
    }
  });

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    duplicateRows,
    summary: {
      total: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      duplicateCount: duplicateRows.length
    }
  };
};

module.exports = { parseAndValidateFile };
