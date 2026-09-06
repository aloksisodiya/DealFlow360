/**
 * Formats a number or numeric string into Indian Rupee (INR) representation with ₹ symbol
 */
export function formatINR(amount, options = {}) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '₹0';
  const num = Number(amount);
  const minDigits = options.minimumFractionDigits !== undefined ? options.minimumFractionDigits : (num % 1 !== 0 ? 2 : 0);
  const maxDigits = options.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits })}`;
}

export function formatCurrency(amount, options = {}) {
  return formatINR(amount, options);
}

/**
 * Derives user display name and initials from an email address
 */
export function formatUserFromEmail(email) {
  if (!email) return { name: 'Alex Morgan', initials: 'AM' };
  
  const emailName = email.split('@')[0] || 'User';
  const name = emailName
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Alex Morgan';

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(p => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM';

  return { name, initials };
}

/**
 * Downloads a data array as a formatted CSV file in the browser
 */
export function downloadCSV(filename, headers, rows) {
  const csvContent = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
