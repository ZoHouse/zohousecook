export const humanizeValue = (value: string) => {
  const etherValue = parseFloat(value) / Math.pow(10, 18);
  return etherValue.toFixed(2);
};
