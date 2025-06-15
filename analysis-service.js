// analysis-service.js
// Property analysis service with Firestore integration

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
    this.makeWebhookUrl = import.meta.env.VITE_MAKE_ANALYSIS_WEBHOOK || process.env.VITE_MAKE_ANALYSIS_WEBHOOK;
  }

  // Perform property analysis
  async performAnalysis(data) {
    try {
      const { userId, propertyAddress, userEmail, userName } = data;

      // Call Make.com webhook for analysis
      const response = await fetch(this.makeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze_property',
          userId,
          propertyAddress,
          userEmail,
          userName,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const analysisResult = await response.json();

      // Save analysis to Firestore
      const analysisId = `analysis_${userId}_${Date.now()}`;
      const analysisData = {
        ...analysisResult,
        userId,
        propertyAddress,
        createdAt: serverTimestamp(),
        status: 'completed'
      };

      await setDoc(doc(db, 'analyses', analysisId), analysisData);

      // Return the analysis data with ID
      return {
        id: analysisId,
        ...analysisData,
        createdAt: new Date() // For immediate display
      };
    } catch (error) {
      console.error('Analysis error:', error);
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

  // Generate PDF report (via Make.com)
  async generateReport(analysisId) {
    try {
      const analysis = await this.getAnalysis(analysisId);

      const response = await fetch(this.makeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_report',
          analysisId,
          analysisData: analysis
        })
      });

      if (!response.ok) {
        throw new Error('Report generation failed');
      }

      const result = await response.json();
      
      // Update analysis with report URL
      await setDoc(doc(db, 'analyses', analysisId), {
        reportUrl: result.reportUrl,
        reportGeneratedAt: serverTimestamp()
      }, { merge: true });

      return result.reportUrl;
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
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
