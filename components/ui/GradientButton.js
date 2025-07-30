/**
 * Gradient Button Component
 * Modern gradient buttons with smooth animations
 */

export const GradientButton = ({ 
  text, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  icon = null,
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button'
}) => {
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3',
    large: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'btn-gradient gradient-primary',
    success: 'btn-gradient gradient-success',
    warning: 'btn-gradient gradient-warning'
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const loadingClass = loading ? 'opacity-75' : '';

  return `
    <button 
      type="${type}"
      class="${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${loadingClass} group relative overflow-hidden"
      onclick="${onClick}"
      ${disabled ? 'disabled' : ''}>
      ${loading ? `
        <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
      ` : ''}
      ${icon ? `<i class="${icon} mr-2 group-hover:scale-110 transition-transform"></i>` : ''}
      ${text}
    </button>
  `;
};

export const IconGradientButton = ({ 
  icon, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  title = '' 
}) => {
  const sizeClasses = {
    small: 'w-10 h-10 text-sm',
    medium: 'w-12 h-12',
    large: 'w-14 h-14 text-lg'
  };

  const variantClasses = {
    primary: 'gradient-primary',
    success: 'gradient-success',
    warning: 'gradient-warning'
  };

  return `
    <button 
      class="${variantClasses[variant]} ${sizeClasses[size]} rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
      onclick="${onClick}"
      ${title ? `title="${title}"` : ''}>
      <i class="${icon}"></i>
    </button>
  `;
};

export const OutlineGradientButton = ({ 
  text, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  icon = null 
}) => {
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3',
    large: 'px-8 py-4 text-lg'
  };

  const variantColors = {
    primary: 'border-purple-600 text-purple-600 hover:bg-purple-600',
    success: 'border-blue-600 text-blue-600 hover:bg-blue-600',
    warning: 'border-pink-600 text-pink-600 hover:bg-pink-600'
  };

  return `
    <button 
      class="border-2 ${variantColors[variant]} hover:text-white ${sizeClasses[size]} rounded-lg font-semibold transition-all duration-300 group"
      onclick="${onClick}">
      ${icon ? `<i class="${icon} mr-2 group-hover:scale-110 transition-transform"></i>` : ''}
      ${text}
    </button>
  `;
};

export const FloatingGradientButton = ({ 
  icon, 
  onClick, 
  position = 'bottom-right',
  variant = 'primary',
  title = '' 
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return `
    <div class="fixed ${positionClasses[position]} z-50">
      ${IconGradientButton({
        icon,
        onClick,
        variant,
        size: 'large',
        title
      })}
    </div>
  `;
};

export const ButtonGroup = ({ buttons, className = '' }) => {
  return `
    <div class="flex gap-3 flex-wrap ${className}">
      ${buttons.map(button => GradientButton(button)).join('')}
    </div>
  `;
};