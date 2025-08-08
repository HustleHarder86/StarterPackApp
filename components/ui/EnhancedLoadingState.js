/**
 * Enhanced Loading State Component
 * Shows a more engaging loading experience during property analysis
 */

export const EnhancedLoadingState = ({ message = 'Analyzing property...' }) => {
  const loadingSteps = [
    { icon: '🏠', text: 'Fetching property details', delay: 0 },
    { icon: '📊', text: 'Analyzing market data', delay: 2000 },
    { icon: '🏨', text: 'Finding Airbnb comparables', delay: 4000 },
    { icon: '💰', text: 'Calculating financial projections', delay: 6000 },
    { icon: '📈', text: 'Generating investment insights', delay: 8000 }
  ];

  return `
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-3" style="height: calc(100vh - 40px); max-height: 860px;">
      <div class="max-w-xl w-full">
        <!-- Main Loading Card -->
        <div class="bg-white rounded-xl shadow-2xl p-6">
          <!-- Header - Compact -->
          <div class="text-center mb-4">
            <div class="relative inline-block mb-3">
              <!-- Animated rings -->
              <div class="absolute inset-0 rounded-full border-3 border-purple-200 animate-ping"></div>
              <div class="absolute inset-0 rounded-full border-3 border-purple-300 animate-ping" style="animation-delay: 0.5s"></div>
              
              <!-- Central icon -->
              <div class="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>
            
            <h1 class="text-xl font-bold text-gray-900 mb-1">${message}</h1>
            <p class="text-sm text-gray-600">This usually takes 15-30 seconds</p>
          </div>
          
          <!-- Progress Steps - Compact -->
          <div class="space-y-2 mb-4">
            ${loadingSteps.map((step, index) => `
              <div class="loading-step opacity-0" style="animation: fadeInSlide 0.5s ease-out ${step.delay}ms forwards">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-sm loading-step-icon">
                    ${step.icon}
                  </div>
                  <div class="flex-1">
                    <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-purple-500 to-blue-600 rounded-full loading-progress" 
                           style="animation: progressBar 2s ease-out ${step.delay}ms forwards"></div>
                    </div>
                  </div>
                  <span class="text-xs text-gray-600 loading-step-text">${step.text}</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Fun Facts - Compact -->
          <div class="bg-purple-50 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <div class="flex-shrink-0">
                <svg class="w-4 h-4 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-purple-900 text-sm mb-0.5">Did you know?</h3>
                <p class="text-xs text-purple-700 loading-fact">
                  We analyze over 50 data points including local rental rates, seasonal trends, and regulatory requirements to give you the most accurate investment insights.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Cancel Button - Compact -->
        <div class="text-center mt-3">
          <button onclick="cancelAnalysis()" class="text-gray-500 hover:text-gray-700 text-xs font-medium">
            Cancel Analysis
          </button>
        </div>
      </div>
    </div>
    
    <style>
      @keyframes fadeInSlide {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes progressBar {
        from {
          width: 0%;
        }
        to {
          width: 100%;
        }
      }
      
      .loading-step-icon {
        animation: bounce 1s ease-in-out infinite;
      }
      
      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-5px);
        }
      }
      
      /* Rotate through fun facts */
      .loading-fact {
        animation: cycleFacts 10s ease-in-out infinite;
      }
    </style>
  `;
};