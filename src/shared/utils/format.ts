export const formatCurrency = (value: number): string => {
  return `INR ${value.toFixed(2)}`;
};

export const toPascalCase = (value: string): string => {
  return value
    .trim()
    .split(/[_\s.-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

// Frappe datetimes come back as "YYYY-MM-DD HH:MM:SS.ffffff" (space, not
// "T") -- swap it in so `Date` parses it correctly across platforms.
export const formatTimeAgo = (value: string): string => {
  const parsed = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return value;

  const diffMs = Date.now() - parsed.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
};
