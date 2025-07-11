// STR Analysis Client - Integrates with Railway API
class STRAnalysisClient {
  constructor(apiConfig = API_CONFIG) {
    this.config = apiConfig;
    this.currentJobId = null;
    this.pollInterval = null;
  }

  /**
   * Start STR analysis for a property
   * @param {string} propertyId - Property ID
   * @param {Object} propertyData - Property details
   * @param {string} authToken - Firebase auth token
   * @returns {Promise<Object>} Job information
   */
  async startAnalysis(propertyId, propertyData, authToken) {
    try {
      const response = await fetch(this.config.getUrl('strAnalyze'), {
        method: 'POST',
        headers: this.config.authHeaders(authToken),
        body: JSON.stringify({
          propertyId,
          propertyData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start STR analysis');
      }

      const result = await response.json();
      this.currentJobId = result.jobId;

      // Start polling for results
      if (result.jobId) {
        this.startPolling(result.jobId, authToken);
      }

      return result;
    } catch (error) {
      console.error('STR analysis error:', error);
      throw error;
    }
  }

  /**
   * Get STR comparables for a location
   * @param {Object} searchParams - Search parameters
   * @param {string} authToken - Firebase auth token
   * @returns {Promise<Object>} Comparables data
   */
  async getComparables(searchParams, authToken) {
    try {
      const response = await fetch(this.config.getUrl('strComparables'), {
        method: 'POST',
        headers: this.config.authHeaders(authToken),
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch comparables');
      }

      return await response.json();
    } catch (error) {
      console.error('Comparables fetch error:', error);
      throw error;
    }
  }

  /**
   * Check STR regulations for a city
   * @param {string} city - City name
   * @param {string} province - Province name
   * @returns {Promise<Object>} Regulation data
   */
  async checkRegulations(city, province = 'Ontario') {
    try {
      const response = await fetch(this.config.getUrl('strRegulations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ city, province })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check regulations');
      }

      return await response.json();
    } catch (error) {
      console.error('Regulation check error:', error);
      throw error;
    }
  }

  /**
   * Start polling for job results
   * @param {string} jobId - Job ID to poll
   * @param {string} authToken - Firebase auth token
   */
  startPolling(jobId, authToken) {
    // Clear any existing polling
    this.stopPolling();

    let pollCount = 0;
    const maxPolls = 60; // 2 minutes max

    this.pollInterval = setInterval(async () => {
      pollCount++;

      try {
        const status = await this.getJobStatus(jobId, authToken);

        if (status.state === 'completed') {
          this.stopPolling();
          this.onAnalysisComplete(status.result);
        } else if (status.state === 'failed') {
          this.stopPolling();
          this.onAnalysisError(status.error || 'Analysis failed');
        } else if (pollCount >= maxPolls) {
          this.stopPolling();
          this.onAnalysisError('Analysis timeout - please try again');
        } else {
          // Update progress
          this.onAnalysisProgress(status.progress);
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (pollCount >= 3) {
          this.stopPolling();
          this.onAnalysisError('Failed to get analysis status');
        }
      }
    }, 2000); // Poll every 2 seconds
  }

  /**
   * Stop polling for results
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @param {string} authToken - Firebase auth token
   * @returns {Promise<Object>} Job status
   */
  async getJobStatus(jobId, authToken) {
    const response = await fetch(
      this.config.getUrl('jobStatus', { jobId }),
      {
        headers: this.config.authHeaders(authToken)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get job status');
    }

    return await response.json();
  }

  /**
   * Callback when analysis is complete
   * Override this in your implementation
   * @param {Object} result - Analysis results
   */
  onAnalysisComplete(result) {
    console.log('STR analysis complete:', result);
    // Override this method
  }

  /**
   * Callback for analysis progress updates
   * Override this in your implementation
   * @param {Object} progress - Progress information
   */
  onAnalysisProgress(progress) {
    console.log('STR analysis progress:', progress);
    // Override this method
  }

  /**
   * Callback when analysis fails
   * Override this in your implementation
   * @param {string} error - Error message
   */
  onAnalysisError(error) {
    console.error('STR analysis error:', error);
    // Override this method
  }
}

// Export for use
window.STRAnalysisClient = STRAnalysisClient;