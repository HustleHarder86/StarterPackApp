// Analysis service for property analysis
// Browser-compatible version

class AnalysisService {
  constructor() {
    this.apiEndpoint = window.getAPIBaseUrl ? window.getAPIBaseUrl() : '/api';
  }

  async analyzeProperty(propertyData, analysisType = 'both') {
    try {
      // Get auth token if available
      let headers = {
        'Content-Type': 'application/json'
      };
      
      if (window.firebaseWrapper && window.firebaseWrapper.auth?.currentUser) {
        const token = await window.firebaseWrapper.auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiEndpoint}/analyze-property`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          property: propertyData,
          analysisType: analysisType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analysis service error:', error);
      throw error;
    }
  }

  async checkJobStatus(jobId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/jobs/${jobId}/status`);
      
      if (!response.ok) {
        throw new Error(`Failed to check job status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Job status check error:', error);
      throw error;
    }
  }

  async generateReport(analysisId) {
    try {
      let headers = {
        'Content-Type': 'application/json'
      };
      
      if (window.firebaseWrapper && window.firebaseWrapper.auth?.currentUser) {
        const token = await window.firebaseWrapper.auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiEndpoint}/reports/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ analysisId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Report generation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  }

  async downloadReport(reportId) {
    try {
      let headers = {};
      
      if (window.firebaseWrapper && window.firebaseWrapper.auth?.currentUser) {
        const token = await window.firebaseWrapper.auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiEndpoint}/reports/download/${reportId}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.status}`);
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property-analysis-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Report download error:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
window.analysisService = new AnalysisService();