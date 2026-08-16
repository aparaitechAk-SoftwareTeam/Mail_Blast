const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePhone = (phone) => {
  if (!phone) return true;
  const re = /^[+\d\s\-()]{7,15}$/;
  return re.test(String(phone));
};

module.exports = { validateEmail, validatePhone };
