/**
 * Utility functions for timezone and calendar-day calculations in Asia/Kolkata (IST).
 */

// Returns YYYY-MM-DD string in Asia/Kolkata timezone
const getTodayISTDateString = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`;
};

// Returns Date instance corresponding to 00:00:00.000 IST on the calendar day of the given date
const getStartOfTodayIST = (date = new Date()) => {
  const istDateStr = getTodayISTDateString(date);
  return new Date(`${istDateStr}T00:00:00.000+05:30`);
};

module.exports = {
  getTodayISTDateString,
  getStartOfTodayIST
};
