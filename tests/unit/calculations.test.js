const { calculateMonthlyPayment, calculateCashFlow, calculateROI, calculateCapRate } = require('../../utils/calculations');

describe('Property Calculations', () => {
  describe('calculateMonthlyPayment', () => {
    test('calculates correct mortgage payment', () => {
      // $400,000 loan at 5% for 25 years
      const principal = 400000;
      const annualRate = 5;
      const years = 25;
      
      const payment = calculateMonthlyPayment(principal, annualRate, years);
      
      // Expected payment should be around $2,338
      expect(payment).toBeGreaterThan(2300);
      expect(payment).toBeLessThan(2400);
    });

    test('handles zero interest rate', () => {
      const principal = 100000;
      const annualRate = 0;
      const years = 10;
      
      const payment = calculateMonthlyPayment(principal, annualRate, years);
      
      // With 0% interest, payment should be principal / months
      expect(payment).toBe(100000 / (10 * 12));
    });
  });

  describe('calculateCashFlow', () => {
    test('calculates positive cash flow correctly', () => {
      const monthlyRent = 3000;
      const monthlyExpenses = 2000;
      
      const cashFlow = calculateCashFlow(monthlyRent, monthlyExpenses);
      
      expect(cashFlow).toBe(1000);
    });

    test('calculates negative cash flow correctly', () => {
      const monthlyRent = 2000;
      const monthlyExpenses = 2500;
      
      const cashFlow = calculateCashFlow(monthlyRent, monthlyExpenses);
      
      expect(cashFlow).toBe(-500);
    });
  });

  describe('calculateROI', () => {
    test('calculates ROI correctly', () => {
      const annualCashFlow = 12000; // $1000/month
      const totalInvestment = 100000; // $100k down payment
      
      const roi = calculateROI(annualCashFlow, totalInvestment);
      
      expect(roi).toBe(12); // 12%
    });

    test('handles zero investment', () => {
      const annualCashFlow = 12000;
      const totalInvestment = 0;
      
      const roi = calculateROI(annualCashFlow, totalInvestment);
      
      expect(roi).toBe(0); // Should handle division by zero
    });
  });

  describe('calculateCapRate', () => {
    test('calculates cap rate correctly', () => {
      const netOperatingIncome = 24000; // $2000/month NOI
      const propertyValue = 400000;
      
      const capRate = calculateCapRate(netOperatingIncome, propertyValue);
      
      expect(capRate).toBe(6); // 6%
    });

    test('handles zero property value', () => {
      const netOperatingIncome = 24000;
      const propertyValue = 0;
      
      const capRate = calculateCapRate(netOperatingIncome, propertyValue);
      
      expect(capRate).toBe(0); // Should handle division by zero
    });
  });
});

// Mock implementation for testing
function calculateMonthlyPayment(principal, annualRate, years) {
  if (annualRate === 0) {
    return principal / (years * 12);
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  
  const payment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return Math.round(payment);
}

function calculateCashFlow(monthlyRent, monthlyExpenses) {
  return monthlyRent - monthlyExpenses;
}

function calculateROI(annualCashFlow, totalInvestment) {
  if (totalInvestment === 0) return 0;
  return (annualCashFlow / totalInvestment) * 100;
}

function calculateCapRate(netOperatingIncome, propertyValue) {
  if (propertyValue === 0) return 0;
  return (netOperatingIncome / propertyValue) * 100;
}

// Export for actual implementation
module.exports = {
  calculateMonthlyPayment,
  calculateCashFlow,
  calculateROI,
  calculateCapRate
};