/**
 * Badge Component
 * Status indicators and labels with consistent styling
 */

export const Badge = ({ 
  children, 
  variant = 'default',
  size = 'default',
  className = '',
  animated = false 
}) => {
  const baseClasses = 'badge';
  const variantClasses = {
    default: '',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    'live-data': 'badge-live-data',
    airbnb: 'badge-airbnb',
    secondary: 'bg-gray-500 text-white'
  };
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: '',
    lg: 'text-sm px-4 py-2'
  };
  const animationClass = animated ? 'animate-pulse' : '';

  return `
    <span class="${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${animationClass} ${className}">
      ${children}
    </span>
  `;
};

export const StatusBadge = ({ status, confidence = null }) => {
  const statusConfig = {
    recommended: { variant: 'success', icon: '✓', text: 'RECOMMENDED' },
    caution: { variant: 'warning', icon: '⚠', text: 'CAUTION' },
    'not-recommended': { variant: 'danger', icon: '✗', text: 'NOT RECOMMENDED' },
    analyzing: { variant: 'info', icon: '⏳', text: 'ANALYZING' }
  };

  const config = statusConfig[status] || statusConfig.analyzing;
  
  return `
    <div class="flex items-center gap-sm">
      ${Badge({
        children: `${config.icon} ${config.text}`,
        variant: config.variant,
        size: 'lg'
      })}
      ${confidence ? Badge({
        children: `${confidence} Confidence`,
        variant: 'info',
        size: 'sm'
      }) : ''}
    </div>
  `;
};

export const LiveDataBadge = ({ lastUpdated = 'just now' } = {}) => {
  return Badge({
    children: `
      <span class="inline-flex items-center gap-2">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        LIVE DATA
      </span>
    `,
    variant: 'live-data',
    animated: true,
    className: 'font-bold'
  });
};

export const PerformanceBadge = ({ performance }) => {
  const performanceConfig = {
    top: { variant: 'success', text: 'TOP PERFORMER' },
    match: { variant: 'info', text: 'BEST MATCH' },
    value: { variant: 'warning', text: 'GOOD VALUE' },
    average: { variant: 'secondary', text: 'AVERAGE' }
  };

  const config = performanceConfig[performance] || performanceConfig.average;
  
  return Badge({
    children: config.text,
    variant: config.variant,
    size: 'sm'
  });
};

export const MetricBadge = ({ label, value, trend = null, variant = 'info' }) => {
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '';
  
  return `
    <div class="text-center">
      <div class="text-2xl font-bold text-gray-900 mb-xs">${value}${trendIcon}</div>
      <div class="text-xs text-gray-600">${label}</div>
    </div>
  `;
};