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
