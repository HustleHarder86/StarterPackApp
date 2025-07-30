/**
 * Glass Card Component
 * Modern glass morphism card with gradient hover effects
 */

export const GlassCard = ({ 
  children, 
  className = '', 
  elevated = false,
  onClick = null,
  padding = 'xl',
  animated = false
}) => {
  const paddingClasses = {
    sm: 'p-lg',
    md: 'p-xl',
    lg: 'p-2xl',
    xl: 'p-6'
  };

  const animationClass = animated ? 'animate-fade-in' : '';
  const elevatedClass = elevated ? 'hover-float glow-on-hover' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  return `
    <div class="
      glass-card 
      ${paddingClasses[padding]}
      ${elevatedClass} 
      ${clickableClass}
      ${animationClass}
      ${className}
    " 
    ${onClick ? `onclick="${onClick}"` : ''}>
      ${children}
    </div>
  `;
};

export const MetricGlassCard = ({ 
  icon, 
  value, 
  label, 
  trend = null,
  trendValue = null,
  gradientType = 'primary' 
}) => {
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '';
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : '';

  return GlassCard({
    children: `
      <div class="gradient-${gradientType} w-12 h-12 rounded-xl flex items-center justify-center mb-4">
        <i class="${icon} text-white text-xl"></i>
      </div>
      <p class="text-3xl font-bold mb-1 text-gradient">${value}</p>
      <p class="text-gray-600 text-sm">${label}</p>
      ${trendValue ? `
        <div class="mt-3 text-xs ${trendColor} font-medium">
          <span class="mr-1">${trendIcon}</span>${trendValue}
        </div>
      ` : ''}
    `,
    elevated: true,
    padding: 'md'
  });
};

export const FeatureGlassCard = ({ 
  title, 
  description, 
  icon,
  action = null,
  actionLabel = 'Learn More' 
}) => {
  return GlassCard({
    children: `
      <div class="flex items-start gap-4">
        <div class="gradient-primary w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
          <i class="${icon} text-white text-2xl"></i>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold mb-2 text-gray-900">${title}</h3>
          <p class="text-gray-600 mb-4">${description}</p>
          ${action ? `
            <button 
              onclick="${action}" 
              class="text-purple-600 font-medium hover:text-purple-700 transition-colors"
            >
              ${actionLabel} →
            </button>
          ` : ''}
        </div>
      </div>
    `,
    elevated: true
  });
};

export const PropertyGlassCard = ({ 
  imageUrl, 
  price, 
  address, 
  beds, 
  baths, 
  sqft,
  onClick 
}) => {
  return GlassCard({
    children: `
      <div class="relative overflow-hidden rounded-lg mb-4">
        <img src="${imageUrl}" alt="${address}" class="w-full h-48 object-cover">
        <div class="absolute top-3 right-3">
          <span class="glass-dark text-white px-3 py-1 rounded-full text-sm font-semibold">
            ${price}
          </span>
        </div>
      </div>
      <h3 class="text-lg font-semibold mb-2 text-gray-900">${address}</h3>
      <div class="flex justify-between text-sm text-gray-600">
        <span><i class="fas fa-bed mr-1"></i>${beds} beds</span>
        <span><i class="fas fa-bath mr-1"></i>${baths} baths</span>
        <span><i class="fas fa-ruler-combined mr-1"></i>${sqft} sqft</span>
      </div>
    `,
    onClick,
    elevated: true,
    padding: 'sm'
  });
};