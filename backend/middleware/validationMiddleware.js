const { validateEmail, validatePhone } = require('../utils/validator');
const { sendError } = require('../utils/responseHelper');

const validateStudentPayload = (req, res, next) => {
  const { name, email, phone, college, branch, graduationYear, cgpa } = req.body;
  const errors = [];

  if (!name || String(name).trim().length < 2) {
    errors.push({ field: 'name', message: 'Full name is required and must be at least 2 characters' });
  }

  if (!email || !validateEmail(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (phone && !validatePhone(phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format (must be 10-digit or valid international format)' });
  }

  if (!college || String(college).trim().length < 2) {
    errors.push({ field: 'college', message: 'College name is required' });
  }

  if (graduationYear !== undefined && graduationYear !== null && graduationYear !== '') {
    const year = Number(graduationYear);
    if (isNaN(year) || year < 2000 || year > 2035) {
      errors.push({ field: 'graduationYear', message: 'Graduation year must be between 2000 and 2035' });
    }
  }

  if (cgpa !== undefined && cgpa !== null && cgpa !== '') {
    const score = Number(cgpa);
    if (isNaN(score) || score < 0 || score > 10) {
      errors.push({ field: 'cgpa', message: 'CGPA must be a number between 0 and 10' });
    }
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed', errors, 400);
  }

  next();
};

const validateCampaignPayload = (req, res, next) => {
  const { title, subject, bodyHtml } = req.body;
  const errors = [];

  if (!title || String(title).trim().length < 2) {
    errors.push({ field: 'title', message: 'Campaign title is required' });
  }

  if (!subject || String(subject).trim().length < 2) {
    errors.push({ field: 'subject', message: 'Email subject is required' });
  }

  if (!bodyHtml || String(bodyHtml).trim().length < 5) {
    errors.push({ field: 'bodyHtml', message: 'Email body content is required' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed', errors, 400);
  }

  next();
};

const validateTemplatePayload = (req, res, next) => {
  const { name, subject, bodyHtml } = req.body;
  const errors = [];

  if (!name || String(name).trim().length < 2) {
    errors.push({ field: 'name', message: 'Template name is required' });
  }

  if (!subject || String(subject).trim().length < 2) {
    errors.push({ field: 'subject', message: 'Default subject line is required' });
  }

  if (!bodyHtml || String(bodyHtml).trim().length < 5) {
    errors.push({ field: 'bodyHtml', message: 'Template body HTML content is required' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed', errors, 400);
  }

  next();
};

const validateUserPayload = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];
  const isUpdate = req.method === 'PUT';

  if (!name || String(name).trim().length < 2) {
    errors.push({ field: 'name', message: 'Full name is required' });
  }

  if (!email || !validateEmail(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!isUpdate || (password && String(password).length > 0)) {
    if (!password || String(password).length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
    }
  }

  if (role && !['Admin', 'Recruiter', 'Viewer'].includes(role)) {
    errors.push({ field: 'role', message: 'Role must be Admin, Recruiter, or Viewer' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed', errors, 400);
  }

  next();
};

const validateSuppressionPayload = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email || !validateEmail(email)) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed', errors, 400);
  }

  next();
};

module.exports = {
  validateStudentPayload,
  validateCampaignPayload,
  validateTemplatePayload,
  validateUserPayload,
  validateSuppressionPayload
};
