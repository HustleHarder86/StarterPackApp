// analysis-service.js
// Property analysis service with direct API calls (no Make.com)

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase-config';

class AnalysisService {
  constructor() {
    // API endpoint for analysis (adjust based on your deployment)
    this.apiEndpoint = import.meta.env.VITE_API_URL || '/api';
  }

  // Perform property analysis
  async performAnalysis(data) {
    try {
      const { userId, propertyAddress, userEmail, userName, requestType = 'demo' } = data;

      // Call our API endpoint for analysis
      const response = await fetch(`${this.apiEndpoint}/analyze-property`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          propertyAddress,
          propertyData: { address: propertyAddress },  // Add minimal propertyData for consistency
          userEmail,
          userName,
          requestType,
          analysisType: 'both',  // Default to both analyses
          includeStrAnalysis: true  // Include STR by default
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Analysis request failed');
      }

      const result = await response.json();

      // Return the analysis data
      return {
        id: result.analysisId,
        ...result.data,
        createdAt: new Date() // For immediate display
      };
    } catch (error) {
      console.error('Analysis error:', error);
      
      // If API fails, return demo data for better UX
      if (error.message.includes('API')) {
        console.log('API unavailable, returning demo data');
        return this.getDemoAnalysis(data.propertyAddress, data.userName, data.userEmail);
      }
      
      throw error;
    }
  }

  // Get user's analysis history
  async getUserAnalyses(userId, limitCount = 10) {
    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const analyses = [];

      querySnapshot.forEach((doc) => {
        analyses.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return analyses;
    } catch (error) {
      console.error('Get analyses error:', error);
      throw error;
    }
  }

  // Get single analysis
  async getAnalysis(analysisId) {
    try {
      const docRef = doc(db, 'analyses', analysisId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Analysis not found');
      }
    } catch (error) {
      console.error('Get analysis error:', error);
      throw error;
    }
  }

  // Generate PDF report (simplified for now - can be expanded later)
  async generateReport(analysisId) {
    try {
      const analysis = await this.getAnalysis(analysisId);
      
      // For now, just return a data URL or implement client-side PDF generation
      // You can integrate with a PDF service later
      const reportUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(analysis, null, 2))}`;
      
      // Update analysis with report URL
      await setDoc(doc(db, 'analyses', analysisId), {
        reportUrl: reportUrl,
        reportGeneratedAt: serverTimestamp()
      }, { merge: true });

      return reportUrl;
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  }

  // Get demo analysis data (fallback when API is unavailable)
  getDemoAnalysis(propertyAddress, userName, userEmail) {
    const demoData = {
      lead_id: `demo_${Date.now()}`,
      lead_name: userName || "Demo User",
      lead_email: userEmail || "demo@example.com",
      property_address: propertyAddress,
      analysis_timestamp: new Date().toISOString(),
      property_details: {
        address: propertyAddress,
        estimated_value: 650000,
        property_type: "Single Family"
      },
      costs: {
        property_tax_annual: 8125,
        hoa_monthly: 150,
        utilities_monthly: 200,
        insurance_annual: 1800,
        maintenance_annual: 6500
      },
      short_term_rental: {
        daily_rate: 250,
        occupancy_rate: 0.75,
        annual_revenue: 68438,
        annual_profit: 42313
      },
      long_term_rental: {
        monthly_rent: 3200,
        annual_revenue: 38400,
        annual_profit: 12275
      },
      recommendation: "Short-term rental recommended. The property shows strong potential for Airbnb with 75% occupancy rate and significantly higher profit margins compared to long-term rental.",
      roi_percentage: 6.51
    };

    return {
      id: demoData.lead_id,
      ...demoData,
      createdAt: new Date()
    };
  }

  // Calculate property metrics (can be done locally for immediate feedback)
  calculateMetrics(propertyData) {
    const {
      propertyValue,
      monthlyRent,
      propertyTax,
      insurance,
      hoaFees,
      maintenance,
      utilities
    } = propertyData;

    // Annual costs
    const annualPropertyTax = propertyTax || (propertyValue * 0.0125); // 1.25% default
    const annualInsurance = insurance || (propertyValue * 0.0035); // 0.35% default
    const annualHOA = (hoaFees || 0) * 12;
    const annualMaintenance = maintenance || (propertyValue * 0.01); // 1% default
    const annualUtilities = (utilities || 0) * 12;

    const totalAnnualCosts = 
      annualPropertyTax + 
      annualInsurance + 
      annualHOA + 
      annualMaintenance + 
      annualUtilities;

    // Long-term rental calculations
    const monthlyRentEstimate = monthlyRent || (propertyValue * 0.005); // 0.5% default
    const annualRentalIncome = monthlyRentEstimate * 12;
    const ltProfit = annualRentalIncome - totalAnnualCosts;
    const ltROI = (ltProfit / propertyValue) * 100;

    // Short-term rental calculations (Airbnb)
    const dailyRate = monthlyRentEstimate / 10; // Rough estimate
    const occupancyRate = 0.75; // 75% occupancy
    const annualSTRIncome = dailyRate * 365 * occupancyRate;
    const stProfit = annualSTRIncome - totalAnnualCosts - (annualSTRIncome * 0.15); // 15% management
    const stROI = (stProfit / propertyValue) * 100;

    return {
      costs: {
        property_tax_annual: annualPropertyTax,
        insurance_annual: annualInsurance,
        hoa_monthly: hoaFees || 0,
        utilities_monthly: utilities || 0,
        maintenance_annual: annualMaintenance
      },
      long_term_rental: {
        monthly_rent: monthlyRentEstimate,
        annual_revenue: annualRentalIncome,
        annual_profit: ltProfit,
        roi_percentage: ltROI.toFixed(2)
      },
      short_term_rental: {
        daily_rate: dailyRate,
        occupancy_rate: occupancyRate * 100,
        annual_revenue: annualSTRIncome,
        annual_profit: stProfit,
        roi_percentage: stROI.toFixed(2)
      },
      recommendation: stROI > ltROI 
        ? `Short-term rental recommended. The property shows strong potential for Airbnb with ${(occupancyRate * 100).toFixed(0)}% occupancy rate and significantly higher profit margins compared to long-term rental.`
        : `Long-term rental recommended. The property shows better stability and returns with traditional rental approach.`
    };
  }
}

export default new AnalysisService();
