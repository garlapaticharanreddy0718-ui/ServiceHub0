/**
 * Format a Date instance as a local calendar YYYY-MM-DD string (without UTC day-shift).
 */
export const formatLocalDateISO = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a local YYYY-MM-DD date and HH:MM time as an ISO-8601 timestamp with local UTC offset.
 */
export const toLocalISOStringWithOffset = (dateStr, timeHHMM) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeHHMM.split(':').map(Number);
  const localDate = new Date(y, m - 1, d, hh, mm, 0, 0);
  const offsetMin = -localDate.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMin);
  const offH = String(Math.floor(absMin / 60)).padStart(2, '0');
  const offM = String(absMin % 60).padStart(2, '0');
  return `${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00${sign}${offH}:${offM}`;
};

