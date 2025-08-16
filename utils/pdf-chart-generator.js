/**
 * PDF Chart Generator
 * Generates charts for PDF reports using Chart.js
 */

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

class PDFChartGenerator {
  constructor() {
    // Initialize chart renderer with high DPI for sharp PDFs
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({ 
      width: 800, 
      height: 400,
      backgroundColour: 'white',
      chartCallback: (ChartJS) => {
        // Register any plugins or defaults here
        ChartJS.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ChartJS.defaults.font.size = 14;
      }
    });
    
    // Professional color palette
    this.colors = {
      primary: 'rgba(41, 128, 185, 1)',
      secondary: 'rgba(52, 73, 94, 1)',
      accent: 'rgba(26, 188, 156, 1)',
      success: 'rgba(46, 204, 113, 1)',
      warning: 'rgba(241, 196, 15, 1)',
      danger: 'rgba(231, 76, 60, 1)',
      light: 'rgba(236, 240, 241, 1)',
      dark: 'rgba(44, 62, 80, 1)',
      
      // With transparency
      primaryAlpha: 'rgba(41, 128, 185, 0.2)',
      secondaryAlpha: 'rgba(52, 73, 94, 0.2)',
      accentAlpha: 'rgba(26, 188, 156, 0.2)',
      successAlpha: 'rgba(46, 204, 113, 0.2)',
      warningAlpha: 'rgba(241, 196, 15, 0.2)',
      dangerAlpha: 'rgba(231, 76, 60, 0.2)'
    };
  }

  /**
   * Generate cash flow projection line chart
   */
  async generateCashFlowChart(data, width = 800, height = 400) {
    const years = [];
    const cashFlowData = [];
    const cumulativeData = [];
    
    // Generate 5-year projection
    const monthlyIncome = data.longTermRental?.effectiveIncome || 0;
    const monthlyExpenses = data.longTermRental?.totalExpenses || 0;
    const monthlyCashFlow = monthlyIncome - monthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    
    let cumulative = 0;
    for (let i = 1; i <= 5; i++) {
      years.push(`Year ${i}`);
      // Add 3% annual appreciation
      const appreciatedCashFlow = annualCashFlow * Math.pow(1.03, i - 1);
      cashFlowData.push(Math.round(appreciatedCashFlow));
      cumulative += appreciatedCashFlow;
      cumulativeData.push(Math.round(cumulative));
    }
    
    const configuration = {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Annual Cash Flow',
            data: cashFlowData,
            borderColor: this.colors.primary,
            backgroundColor: this.colors.primaryAlpha,
            borderWidth: 3,
            fill: false,
            tension: 0.1
          },
          {
            label: 'Cumulative Cash Flow',
            data: cumulativeData,
            borderColor: this.colors.success,
            backgroundColor: this.colors.successAlpha,
            borderWidth: 3,
            fill: false,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '5-Year Cash Flow Projection',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(context.parsed.y);
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(value);
              }
            },
            grid: {
              borderDash: [2, 2]
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    };
    
    // Set custom dimensions
    const customCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
    return await customCanvas.renderToBuffer(configuration);
  }

  /**
   * Generate ROI comparison bar chart (LTR vs STR)
   */
  async generateROIComparisonChart(data, width = 800, height = 400) {
    const ltrROI = data.longTermRental?.annualROI || 0;
    const strROI = data.strAnalysis?.annualROI || 0;
    const ltrCashFlow = (data.longTermRental?.monthlyCashFlow || 0) * 12;
    const strCashFlow = (data.strAnalysis?.monthlyCashFlow || 0) * 12;
    
    const configuration = {
      type: 'bar',
      data: {
        labels: ['Annual ROI (%)', 'Annual Cash Flow ($)'],
        datasets: [
          {
            label: 'Long-term Rental',
            data: [ltrROI, ltrCashFlow],
            backgroundColor: this.colors.primary,
            borderColor: this.colors.primary,
            borderWidth: 2
          },
          {
            label: 'Short-term Rental',
            data: [strROI, strCashFlow],
            backgroundColor: this.colors.accent,
            borderColor: this.colors.accent,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Rental Strategy Comparison',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.dataIndex === 0) {
                  // ROI percentage
                  label += context.parsed.y.toFixed(1) + '%';
                } else {
                  // Cash flow in dollars
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value, index, values) {
                // Different formatting for different data types
                if (this.chart.data.labels[this.chart.getActiveElements()[0]?.index] === 'Annual ROI (%)') {
                  return value + '%';
                }
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(value);
              }
            },
            grid: {
              borderDash: [2, 2]
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    };
    
    const customCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
    return await customCanvas.renderToBuffer(configuration);
  }

  /**
   * Generate monthly expense breakdown pie chart
   */
  async generateExpensePieChart(data, width = 600, height = 600) {
    const rental = data.longTermRental || {};
    const expenses = [
      { label: 'Mortgage', value: rental.mortgagePayment || 0, color: this.colors.primary },
      { label: 'Property Tax', value: rental.propertyTax || 0, color: this.colors.secondary },
      { label: 'Insurance', value: rental.insurance || 0, color: this.colors.accent },
      { label: 'HOA/Condo Fees', value: rental.hoaFees || 0, color: this.colors.warning },
      { label: 'Maintenance', value: rental.maintenance || 0, color: this.colors.danger },
      { label: 'Property Mgmt', value: rental.propertyManagement || 0, color: this.colors.success },
      { label: 'Utilities', value: rental.utilities || 0, color: this.colors.dark }
    ].filter(e => e.value > 0);
    
    const configuration = {
      type: 'doughnut',
      data: {
        labels: expenses.map(e => e.label),
        datasets: [{
          data: expenses.map(e => e.value),
          backgroundColor: expenses.map(e => e.color),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Expense Breakdown',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'right',
            labels: {
              generateLabels: function(chart) {
                const data = chart.data;
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const percentage = ((value / total) * 100).toFixed(1);
                  const formattedValue = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0
                  }).format(value);
                  
                  return {
                    text: `${label}: ${formattedValue} (${percentage}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    hidden: false,
                    index: i
                  };
                });
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                const formattedValue = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(value);
                return `${label}: ${formattedValue} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    const customCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
    return await customCanvas.renderToBuffer(configuration);
  }

  /**
   * Generate occupancy rate trends chart (seasonal)
   */
  async generateOccupancyTrendsChart(data, width = 800, height = 400) {
    const seasonalData = data.strAnalysis?.seasonalData || {
      spring: { occupancy: 0.63 },
      summer: { occupancy: 0.77 },
      fall: { occupancy: 0.66 },
      winter: { occupancy: 0.59 }
    };
    
    const configuration = {
      type: 'radar',
      data: {
        labels: ['Spring', 'Summer', 'Fall', 'Winter'],
        datasets: [
          {
            label: 'Occupancy Rate',
            data: [
              seasonalData.spring.occupancy * 100,
              seasonalData.summer.occupancy * 100,
              seasonalData.fall.occupancy * 100,
              seasonalData.winter.occupancy * 100
            ],
            borderColor: this.colors.primary,
            backgroundColor: this.colors.primaryAlpha,
            borderWidth: 3,
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: this.colors.primary
          },
          {
            label: 'Market Average',
            data: [65, 75, 65, 60], // Market average for comparison
            borderColor: this.colors.secondary,
            backgroundColor: this.colors.secondaryAlpha,
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: this.colors.secondary,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: this.colors.secondary
          }
        ]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Seasonal Occupancy Trends',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'bottom'
          }
        },
        scales: {
          r: {
            angleLines: {
              display: true
            },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    };
    
    const customCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
    return await customCanvas.renderToBuffer(configuration);
  }

  /**
   * Generate investment grade gauge chart
   */
  async generateInvestmentGaugeChart(data, width = 400, height = 300) {
    const roi = data.longTermRental?.annualROI || 0;
    const cashFlow = data.longTermRental?.monthlyCashFlow || 0;
    const capRate = data.longTermRental?.capRate || 0;
    
    // Calculate investment score (0-100)
    let score = 0;
    if (roi >= 15) score += 40;
    else if (roi >= 10) score += 30;
    else if (roi >= 7) score += 20;
    else if (roi >= 5) score += 10;
    else if (roi >= 0) score += 5;
    
    if (cashFlow >= 1000) score += 30;
    else if (cashFlow >= 500) score += 20;
    else if (cashFlow >= 200) score += 15;
    else if (cashFlow >= 0) score += 10;
    
    if (capRate >= 8) score += 30;
    else if (capRate >= 6) score += 20;
    else if (capRate >= 4) score += 10;
    else if (capRate >= 2) score += 5;
    
    // Determine color based on score
    let gaugeColor;
    if (score >= 80) gaugeColor = this.colors.success;
    else if (score >= 60) gaugeColor = this.colors.accent;
    else if (score >= 40) gaugeColor = this.colors.warning;
    else gaugeColor = this.colors.danger;
    
    const configuration = {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: [gaugeColor, this.colors.light],
          borderWidth: 0
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        rotation: -90,
        circumference: 180,
        plugins: {
          title: {
            display: true,
            text: 'Investment Score',
            font: {
              size: 18,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        }
      }
    };
    
    const customCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
    return await customCanvas.renderToBuffer(configuration);
  }

  /**
   * Generate all charts for a report
   */
  async generateAllCharts(analysisData) {
    const charts = {};
    
    try {
      // Generate each chart
      charts.cashFlow = await this.generateCashFlowChart(analysisData);
      
      if (analysisData.strAnalysis) {
        charts.roiComparison = await this.generateROIComparisonChart(analysisData);
        charts.occupancyTrends = await this.generateOccupancyTrendsChart(analysisData);
      }
      
      charts.expenseBreakdown = await this.generateExpensePieChart(analysisData);
      charts.investmentGauge = await this.generateInvestmentGaugeChart(analysisData);
      
    } catch (error) {
      console.error('Error generating charts:', error);
    }
    
    return charts;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PDFChartGenerator };
} else {
  window.PDFChartGenerator = PDFChartGenerator;
}