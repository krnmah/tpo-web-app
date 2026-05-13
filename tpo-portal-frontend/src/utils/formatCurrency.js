/**
 * Format salary amount in Indian currency format (Lakhs/Crores)
 * @param {number} amount - Salary amount
 * @param {string} type - Type of salary: 'stipend' | 'ppo' | 'ctc'
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, type = 'stipend') {
  if (!amount || amount === 0) return 'N/A';

  // Indian number formatting with lakhs and crores
  const formats = {
    stipend: (amount) => {
      // For stipend: show as monthly amount, use commas for thousands
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount) + '/month';
    },
    ppo: (amount) => {
      // For PPO: show as annual amount in LPA
      const lpa = amount / 100000;
      return `₹${lpa.toFixed(2)} LPA`;
    },
    ctc: (amount) => {
      // For CTC: show as annual amount in LPA
      const lpa = amount / 100000;
      return `₹${lpa.toFixed(2)} LPA CTC`;
    }
  };

  return formats[type]?.(amount) || formats.stipend(amount);
}

/**
 * Get salary display text based on job type
 * @param {Object} job - Job object with jobType and salary fields
 * @returns {string} Formatted salary display
 */
export function getSalaryDisplay(job) {
  if (!job) return 'N/A';

  const { jobType, stipendAmount, ppoAmount, ctcAmount } = job;

  switch (jobType) {
    case 'INTERN_ONLY':
      return stipendAmount ? formatCurrency(stipendAmount, 'stipend') : 'N/A';

    case 'INTERN_PPO':
      const parts = [];
      if (stipendAmount) parts.push(formatCurrency(stipendAmount, 'stipend'));
      if (ppoAmount) parts.push(formatCurrency(ppoAmount, 'ppo'));
      return parts.length > 0 ? parts.join(' + ') : 'N/A';

    case 'INTERN_FTE':
      const fteParts = [];
      if (stipendAmount) fteParts.push(formatCurrency(stipendAmount, 'stipend'));
      if (ctcAmount) fteParts.push(formatCurrency(ctcAmount, 'ctc'));
      return fteParts.length > 0 ? fteParts.join(' + ') : 'N/A';

    case 'FTE_ONLY':
      return ctcAmount ? formatCurrency(ctcAmount, 'ctc') : 'N/A';

    default:
      return 'N/A';
  }
}

/**
 * Get required salary fields based on job type
 * @param {string} jobType - Job type enum value
 * @returns {Object} Object with boolean flags for each field
 */
export function getRequiredFields(jobType) {
  const requirements = {
    INTERN_ONLY: { stipend: true, ppo: false, ctc: false },
    INTERN_PPO: { stipend: true, ppo: true, ctc: false },
    INTERN_FTE: { stipend: true, ppo: false, ctc: true },
    FTE_ONLY: { stipend: false, ppo: false, ctc: true }
  };

  return requirements[jobType] || requirements.INTERN_ONLY;
}

/**
 * Validate salary fields based on job type
 * @param {Object} data - Data with jobType and salary fields
 * @returns {Object} { valid: boolean, error: string | null }
 */
export function validateSalaryFields(data) {
  const { jobType, stipendAmount, ppoAmount, ctcAmount } = data;
  const required = getRequiredFields(jobType);

  if (required.stipend && (!stipendAmount || stipendAmount <= 0)) {
    return { valid: false, error: 'Stipend amount is required' };
  }

  if (required.ppo && (!ppoAmount || ppoAmount <= 0)) {
    return { valid: false, error: 'PPO amount is required' };
  }

  if (required.ctc && (!ctcAmount || ctcAmount <= 0)) {
    return { valid: false, error: 'CTC amount is required' };
  }

  return { valid: true, error: null };
}
