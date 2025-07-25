/**
 * Button Component
 * Consistent button styling with variants and states
 */

export const Button = ({ 
  children, 
  variant = 'primary',
  size = 'default',
  className = '',
  disabled = false,
  loading = false,
  icon = null,
  onclick = '',
  type = 'button'
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'bg-danger text-white hover:bg-danger-dark',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };
  const sizeClasses = {
    sm: 'btn-sm',
    default: '',
    lg: 'btn-lg'
  };
  const stateClasses = [
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'opacity-75'
  ].filter(Boolean).join(' ');

  const iconElement = icon ? `<span class="w-5 h-5">${icon}</span>` : '';
  const loadingSpinner = loading ? `<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>` : '';

  return `
    <button 
      type="${type}"
      class="${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${stateClasses} ${className}"
      ${disabled ? 'disabled' : ''}
      ${onclick ? `onclick="${onclick}"` : ''}
    >
      ${loadingSpinner}
      ${iconElement}
      <span>${children}</span>
    </button>
  `;
};

export const ActionButton = ({ action, icon, label, description, variant = 'primary' }) => {
  return `
    <div class="card card-interactive p-lg text-left hover:scale-105 transition-all duration-200 cursor-pointer group" 
         onclick="${action}"
         role="button"
         tabindex="0"
         onkeypress="if(event.key === 'Enter' || event.key === ' ') ${action}">
      <div class="flex items-start gap-md">
        <span class="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">${icon}</span>
        <div class="flex-1">
          <div class="text-lg font-bold text-gray-900 mb-xs group-hover:text-blue-600 transition-colors">${label}</div>
          <div class="text-sm text-gray-600 leading-relaxed">${description}</div>
        </div>
      </div>
      <div class="mt-md flex items-center text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Click to proceed</span>
        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </div>
    </div>
  `;
};

export const FloatingActionButton = ({ action, icon, label }) => {
  return `
    <div class="fixed bottom-6 right-6 z-50">
      <button 
        onclick="${action}"
        class="btn btn-primary btn-lg rounded-full shadow-2xl hover:scale-110 transition-transform"
        title="${label}"
      >
        <span class="w-6 h-6">${icon}</span>
      </button>
    </div>
  `;
};

export const ButtonGroup = ({ buttons, className = '' }) => {
  return `
    <div class="flex gap-md ${className}">
      ${buttons.map(button => Button(button)).join('')}
    </div>
  `;
};

// Common button configurations
export const SaveButton = (onclick = '') => Button({
  children: 'Save to Portfolio',
  icon: '💾',
  onclick: onclick || 'saveAnalysis()',
  variant: 'primary'
});

export const ReportButton = (onclick = '') => Button({
  children: 'Generate Report',
  icon: '📊',
  onclick: onclick || 'generateReport()',
  variant: 'secondary'
});

export const AnalyzeButton = (onclick = '') => Button({
  children: 'Analyze Another',
  icon: '🔍',
  onclick: onclick || 'analyzeAnother()',
  variant: 'outline'
});

export const MobileActionButtons = () => {
  return `
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-lg z-40">
      <div class="grid grid-cols-2 gap-md mb-sm">
        ${Button({
          children: '💾 Save',
          variant: 'primary',
          onclick: 'saveAnalysis()',
          className: 'w-full',
          title: 'Save to Portfolio'
        })}
        ${Button({
          children: '📊 PDF Report',
          variant: 'secondary',
          onclick: 'generateReport()',
          className: 'w-full',
          title: 'Generate PDF Report'
        })}
      </div>
      <div class="text-xs text-center text-gray-500">
        Tap to save analysis or download professional PDF report
      </div>
    </div>
  `;
};