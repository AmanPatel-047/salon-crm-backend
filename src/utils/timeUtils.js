/**
 * Convert "HH:mm" string to minutes since midnight for easy comparison.
 * @param {string} timeStr - Time in "HH:mm" format
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Add minutes to a time string and return new "HH:mm" string.
 * @param {string} timeStr - Start time in "HH:mm" format
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} End time in "HH:mm" format
 */
function addMinutesToTime(timeStr, durationMinutes) {
  const totalMinutes = timeToMinutes(timeStr) + durationMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Check if two time ranges overlap.
 * @param {string} start1 - Start of range 1 "HH:mm"
 * @param {string} end1 - End of range 1 "HH:mm"
 * @param {string} start2 - Start of range 2 "HH:mm"
 * @param {string} end2 - End of range 2 "HH:mm"
 * @returns {boolean} True if ranges overlap
 */
function timesOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

/**
 * Check if a time range falls within working hours.
 * @param {string} startTime - "HH:mm"
 * @param {string} endTime - "HH:mm"
 * @param {string} openingTime - "HH:mm"
 * @param {string} closingTime - "HH:mm"
 * @returns {boolean}
 */
function isWithinWorkingHours(startTime, endTime, openingTime, closingTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const open = timeToMinutes(openingTime);
  const close = timeToMinutes(closingTime);
  return start >= open && end <= close;
}

/**
 * Get today's date at midnight (UTC-normalized for query).
 */
function getTodayDateRange() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { startOfDay, endOfDay };
}

module.exports = {
  timeToMinutes,
  addMinutesToTime,
  timesOverlap,
  isWithinWorkingHours,
  getTodayDateRange,
};
