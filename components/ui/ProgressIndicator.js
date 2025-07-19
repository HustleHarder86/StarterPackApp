/**
 * Progress Indicator Component
 * Progress bars and step indicators
 */

export const ProgressBar = ({ 
  progress = 0, 
  variant = 'primary',
  size = 'default',
  showPercentage = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-2',
    default: 'h-3',
    lg: 'h-4'
  };
  
  const variantClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger'
  };

  const percentage = Math.min(100, Math.max(0, progress));

  return `
    <div class="progress-container ${className}">
      <div class="w-full bg-gray-200 rounded-full ${sizeClasses[size]}">
        <div 
          class="${variantClasses[variant]} ${sizeClasses[size]} rounded-full transition-all duration-300"
          style="width: ${percentage}%"
        ></div>
      </div>
      ${showPercentage ? `<span class="text-sm text-gray-600 mt-xs">${Math.round(percentage)}%</span>` : ''}
    </div>
  `;
};

export const StepIndicator = ({ steps, currentStep = 0, className = '' }) => {
  return `
    <div class="step-indicator flex items-center justify-between ${className}">
      ${steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isUpcoming = index > currentStep;
        
        const stepClasses = [
          'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
          isActive && 'border-primary bg-primary text-white',
          isCompleted && 'border-success bg-success text-white',
          isUpcoming && 'border-gray-300 text-gray-400'
        ].filter(Boolean).join(' ');

        const connectorClasses = [
          'flex-1 h-0.5 mx-2',
          isCompleted && 'bg-success',
          !isCompleted && 'bg-gray-300'
        ].filter(Boolean).join(' ');

        return `
          <div class="flex items-center ${index === steps.length - 1 ? '' : 'flex-1'}">
            <div class="flex flex-col items-center">
              <div class="${stepClasses}">
                ${isCompleted ? '✓' : index + 1}
              </div>
              <span class="text-xs text-gray-600 mt-xs text-center">${step}</span>
            </div>
            ${index < steps.length - 1 ? `<div class="${connectorClasses}"></div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
};

export const AnalysisProgress = ({ currentStep = 0 }) => {
  const steps = [
    'Property Data',
    'Market Research', 
    'Financial Calc',
    'Generate Report'
  ];

  return `
    <div class="card p-lg">
      <h4 class="font-semibold text-gray-900 mb-lg">Analysis Progress</h4>
      ${StepIndicator({ steps, currentStep })}
      ${ProgressBar({ 
        progress: ((currentStep + 1) / steps.length) * 100,
        variant: 'primary',
        showPercentage: true,
        className: 'mt-lg'
      })}
    </div>
  `;
};

export const LoadingProgress = ({ 
  steps = [],
  currentStep = 0,
  message = 'Processing...'
}) => {
  return `
    <div class="text-center p-2xl">
      <div class="mb-xl">
        ${LoadingSpinner({ size: 'lg', variant: 'primary' })}
      </div>
      
      <h3 class="text-lg font-semibold text-gray-900 mb-md">${message}</h3>
      
      ${steps.length > 0 ? `
        <div class="max-w-md mx-auto mb-lg">
          ${StepIndicator({ steps, currentStep })}
        </div>
        
        ${ProgressBar({ 
          progress: ((currentStep + 1) / steps.length) * 100,
          variant: 'primary',
          showPercentage: true
        })}
      ` : ''}
      
      <p class="text-sm text-gray-600 mt-lg">
        ${steps[currentStep] || 'Please wait while we process your request...'}
      </p>
    </div>
  `;
};

export const CircularProgress = ({ 
  progress = 0,
  size = 60,
  strokeWidth = 4,
  variant = 'primary'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  const variantColors = {
    primary: '#667eea',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  return `
    <div class="relative inline-flex items-center justify-center">
      <svg width="${size}" height="${size}" class="transform -rotate-90">
        <circle
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          stroke="#e5e7eb"
          stroke-width="${strokeWidth}"
          fill="transparent"
        />
        <circle
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          stroke="${variantColors[variant]}"
          stroke-width="${strokeWidth}"
          fill="transparent"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
          stroke-linecap="round"
          class="transition-all duration-300"
        />
      </svg>
      <span class="absolute text-sm font-semibold text-gray-900">
        ${Math.round(progress)}%
      </span>
    </div>
  `;
};