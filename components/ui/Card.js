/**
 * Card Component
 * Reusable card component with consistent styling and variants
 */

export const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  elevated = false,
  interactive = false 
}) => {
  const baseClasses = 'card';
  const variantClasses = {
    default: '',
    sm: 'card-sm',
    lg: 'card-lg'
  };
  const modifierClasses = [
    elevated && 'card-elevated',
    interactive && 'card-interactive',
    variantClasses[variant]
  ].filter(Boolean).join(' ');

  return `
    <div class="${baseClasses} ${modifierClasses} ${className}">
      ${children}
    </div>
  `;
};

export const PropertyCard = ({ property, children, className = '' }) => {
  return Card({
    children: `
      <div class="flex items-start justify-between mb-xl">
        <div>
          <h3 class="text-xl font-bold text-gray-900 mb-sm">${property.address}</h3>
          <p class="text-gray-600">${property.city}, ${property.province} • ${property.price ? `$${property.price.toLocaleString()}` : 'Price TBD'}</p>
        </div>
        ${property.image ? `<img src="${property.image}" alt="Property" class="w-16 h-16 rounded-lg object-cover ml-lg">` : ''}
      </div>
      ${children}
    `,
    className: `border-l-4 border-primary ${className}`,
    elevated: true
  });
};

export const ComparableCard = ({ comparable, variant = 'default' }) => {
  const badgeVariant = comparable.performance === 'top' ? 'success' : 
                      comparable.performance === 'match' ? 'info' : 
                      comparable.performance === 'value' ? 'warning' : 'secondary';
  
  return `
    <div class="card card-interactive border border-gray-200 overflow-hidden">
      ${comparable.image ? `<img src="${comparable.image}" alt="Comparable Property" class="w-full h-32 object-cover">` : ''}
      <div class="p-lg">
        <div class="flex items-start justify-between mb-md">
          <div>
            <div class="text-lg font-bold text-gray-900">$${comparable.nightly_rate}/night</div>
            <div class="text-sm text-gray-600">${comparable.bedrooms}BR • ${comparable.area} • ${comparable.rating}★</div>
          </div>
          ${comparable.performance ? `<span class="badge badge-${badgeVariant}">${comparable.performance.toUpperCase()}</span>` : ''}
        </div>
        <div class="space-y-xs">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Monthly Revenue:</span>
            <span class="font-bold text-revenue">$${comparable.monthly_revenue?.toLocaleString()}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Occupancy:</span>
            <span class="font-medium text-gray-900">${comparable.occupancy_rate}%</span>
          </div>
        </div>
      </div>
    </div>
  `;
};