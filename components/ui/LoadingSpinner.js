/**
 * Loading Spinner Component
 * Various loading states and animations
 */

export const LoadingSpinner = ({ 
  size = 'default',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  const variantClasses = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-300 border-t-transparent'
  };

  return `
    <div class="animate-spin ${sizeClasses[size]} border-2 ${variantClasses[variant]} rounded-full ${className}"></div>
  `;
};

export const LoadingState = ({ message = 'Loading...', description = null }) => {
  return `
    <div class="flex flex-col items-center justify-center p-2xl text-center">
      ${LoadingSpinner({ size: 'lg', variant: 'primary' })}
      <div class="mt-lg">
        <div class="text-lg font-semibold text-gray-900 mb-sm">${message}</div>
        ${description ? `<div class="text-sm text-gray-600">${description}</div>` : ''}
      </div>
    </div>
  `;
};

export const AnalysisLoadingState = () => {
  return `
    <div class="card text-center p-2xl">
      <div class="mb-xl">
        ${LoadingSpinner({ size: 'xl', variant: 'primary' })}
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-md">Analyzing Property</h3>
      <p class="text-gray-600 mb-lg">We're gathering market data and running financial calculations...</p>
      
      <div class="space-y-sm text-left max-w-md mx-auto">
        <div class="flex items-center gap-md text-sm">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-gray-700">Fetching comparable properties</span>
        </div>
        <div class="flex items-center gap-md text-sm">
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span class="text-gray-700">Calculating revenue projections</span>
        </div>
        <div class="flex items-center gap-md text-sm">
          <div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span class="text-gray-700">Analyzing market trends</span>
        </div>
      </div>
    </div>
  `;
};

export const DataLoadingState = ({ dataType = 'data' }) => {
  return `
    <div class="flex items-center justify-center gap-md p-lg">
      ${LoadingSpinner({ size: 'sm', variant: 'gray' })}
      <span class="text-sm text-gray-600">Loading ${dataType}...</span>
    </div>
  `;
};

export const InlineLoader = ({ text = 'Loading' }) => {
  return `
    <span class="inline-flex items-center gap-sm text-sm text-gray-600">
      ${LoadingSpinner({ size: 'sm', variant: 'gray' })}
      ${text}
    </span>
  `;
};

export const SkeletonCard = () => {
  return `
    <div class="card animate-pulse">
      <div class="flex items-start justify-between mb-lg">
        <div class="space-y-sm flex-1">
          <div class="h-6 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div class="w-16 h-16 bg-gray-200 rounded-lg"></div>
      </div>
      <div class="space-y-md">
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  `;
};

export const ComparablesSkeleton = () => {
  return `
    <div class="grid grid-responsive gap-lg">
      ${Array(3).fill(0).map(() => `
        <div class="card animate-pulse">
          <div class="h-32 bg-gray-200 rounded-lg mb-md"></div>
          <div class="space-y-sm">
            <div class="flex justify-between">
              <div class="h-5 bg-gray-200 rounded w-20"></div>
              <div class="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
};