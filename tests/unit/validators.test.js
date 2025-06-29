// Unit tests for validators
const { 
  validateAddress, 
  validatePropertyData, 
  validateFinancialData,
  sanitizeInput 
} = require('../../utils/validators.js');

describe('validators', () => {
  describe('validateAddress', () => {
    test('validates correct address format', () => {
      const validAddresses = [
        '123 Main St, Toronto, ON, Canada',
        '456 Queen Street West, Vancouver, BC, Canada',
        '789 King Ave, Montreal, QC, Canada'
      ];
      
      validAddresses.forEach(address => {
        expect(() => validateAddress(address)).not.toThrow();
      });
    });

    test('rejects invalid addresses', () => {
      const invalidAddresses = [
        '',
        '123',
        'Just a street name',
        null,
        undefined,
        123
      ];
      
      invalidAddresses.forEach(address => {
        expect(() => validateAddress(address)).toThrow();
      });
    });
  });

  describe('validatePropertyData', () => {
    test('validates complete property data', () => {
      const validData = {
        price: 500000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800,
        propertyType: 'House'
      };
      
      expect(() => validatePropertyData(validData)).not.toThrow();
    });

    test('rejects negative values', () => {
      const invalidData = {
        price: -100000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800
      };
      
      expect(() => validatePropertyData(invalidData)).toThrow(/price.*positive/i);
    });

    test('rejects unrealistic values', () => {
      const invalidData = {
        price: 500000,
        bedrooms: 100,
        bathrooms: 2,
        sqft: 1800
      };
      
      expect(() => validatePropertyData(invalidData)).toThrow(/bedrooms.*unrealistic/i);
    });
  });

  describe('validateFinancialData', () => {
    test('validates reasonable financial inputs', () => {
      const validData = {
        downPayment: 20,
        interestRate: 5.5,
        loanTerm: 25,
        monthlyRent: 3000
      };
      
      expect(() => validateFinancialData(validData)).not.toThrow();
    });

    test('rejects invalid percentages', () => {
      const invalidData = {
        downPayment: 150,
        interestRate: 5.5,
        loanTerm: 25
      };
      
      expect(() => validateFinancialData(invalidData)).toThrow(/down payment.*0.*100/i);
    });

    test('rejects negative interest rates', () => {
      const invalidData = {
        downPayment: 20,
        interestRate: -2,
        loanTerm: 25
      };
      
      expect(() => validateFinancialData(invalidData)).toThrow(/interest rate.*positive/i);
    });
  });

  describe('sanitizeInput', () => {
    test('removes script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized).toBe('Hello');
      expect(sanitized).not.toContain('<script>');
    });

    test('escapes HTML entities', () => {
      const html = '<div>Test & "quotes"</div>';
      const sanitized = sanitizeInput(html);
      expect(sanitized).not.toContain('<div>');
      expect(sanitized).toContain('&amp;');
      expect(sanitized).toContain('&quot;');
    });

    test('preserves normal text', () => {
      const normal = 'This is a normal address: 123 Main St';
      const sanitized = sanitizeInput(normal);
      expect(sanitized).toBe(normal);
    });

    test('handles null and undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });
});