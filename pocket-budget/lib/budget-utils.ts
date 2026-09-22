export function getBudgetPercentage(spent: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.round((spent / limit) * 100);
}

export function getBudgetStatus(spent: number, limit: number) {
  const percentage = getBudgetPercentage(spent, limit);
  return percentage >= 100 ? "over" : percentage >= 80 ? "warning" : "healthy";
}

export function isInCurrentMonth(date: string, reference = new Date()) {
  const value = new Date(date);
  return value.getFullYear() === reference.getFullYear() && value.getMonth() === reference.getMonth();
}
