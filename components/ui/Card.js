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
  
  // Handle both snake_case and camelCase field names
  const nightlyRate = comparable.nightly_rate || comparable.nightlyRate || comparable.price || 0;
  const monthlyRevenue = comparable.monthly_revenue || comparable.monthlyRevenue || 0;
  const occupancyRate = comparable.occupancy_rate || comparable.occupancyRate || 70;
  const imageUrl = comparable.image || comparable.imageUrl || comparable.image_url || comparable.thumbnail;
  const propertyType = comparable.propertyType || comparable.property_type || 'Property';
  
  return `
    <div class="card card-interactive border border-gray-200 overflow-hidden">
      ${imageUrl ? `<img src="${imageUrl}" alt="Comparable Property" class="w-full h-32 object-cover">` : ''}
      <div class="p-lg">
        <div class="flex items-start justify-between mb-md">
          <div>
            <div class="text-lg font-bold text-gray-900">$${nightlyRate}/night</div>
            <div class="text-sm text-gray-600">${comparable.bedrooms || 0}BR • ${comparable.area || propertyType} • ${comparable.rating || 0}★</div>
          </div>
          ${comparable.performance ? `<span class="badge badge-${badgeVariant}">${comparable.performance.toUpperCase()}</span>` : ''}
        </div>
        <div class="space-y-xs">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Monthly Revenue:</span>
            <span class="font-bold text-revenue">$${monthlyRevenue.toLocaleString()}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Occupancy:</span>
            <span class="font-medium text-gray-900">${Math.round(occupancyRate * (occupancyRate > 1 ? 1 : 100))}%</span>
          </div>
        </div>
      </div>
    </div>
  `;
};