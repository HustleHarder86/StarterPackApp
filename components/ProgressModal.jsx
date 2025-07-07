// Progress Modal Component for long-running operations

const ProgressModal = ({ isOpen, progress = 0, message = 'Processing...', onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Analyzing Property
        </h3>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-blue-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Animated stripe pattern */}
              <div className="h-full bg-stripes animate-move-stripes opacity-20"></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{progress}%</span>
            <span>Complete</span>
          </div>
        </div>
        
        {/* Status Message */}
        <p className="text-gray-700 text-center mb-4">
          {message}
        </p>
        
        {/* Additional Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 text-center">
            <span className="inline-block animate-pulse">⏱️</span> This may take 30-60 seconds
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            We're analyzing market data and calculating your investment metrics
          </p>
        </div>
        
        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Cancel Analysis
          </button>
        )}
      </div>
    </div>
  );
};

// Add required CSS for striped animation
const progressModalStyles = `
  @keyframes move-stripes {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 40px 0;
    }
  }
  
  .bg-stripes {
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 255, 255, 0.5) 10px,
      rgba(255, 255, 255, 0.5) 20px
    );
    background-size: 40px 40px;
  }
  
  .animate-move-stripes {
    animation: move-stripes 1s linear infinite;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('progress-modal-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'progress-modal-styles';
  styleElement.textContent = progressModalStyles;
  document.head.appendChild(styleElement);
}