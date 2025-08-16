// Report Customization Modal Component
const ReportCustomizationModal = ({ isOpen, onClose, onGenerate, analysisData }) => {
  const [selectedSections, setSelectedSections] = React.useState({
    executiveSummary: true,
    propertyDetails: true,
    financialAnalysis: true,
    longTermRental: true,
    shortTermRental: true,
    comparativeAnalysis: true,
    investmentRecommendations: true,
    riskAssessment: true,
    marketTrends: true
  });
  
  const [reportFormat, setReportFormat] = React.useState('detailed');
  const [customNotes, setCustomNotes] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  const sectionLabels = {
    executiveSummary: 'Executive Summary with Charts 📊',
    propertyDetails: 'Property Details',
    financialAnalysis: 'Financial Analysis with Expense Charts 📈',
    longTermRental: 'Long-term Rental Analysis',
    shortTermRental: 'Short-term Rental (STR) Analysis with Comparisons 📉',
    comparativeAnalysis: 'Comparative Market Analysis',
    investmentRecommendations: 'Investment Recommendations with Grade 🎯',
    riskAssessment: 'Risk Assessment Matrix',
    marketTrends: 'Market Trends & Outlook'
  };

  const handleSectionToggle = (section) => {
    setSelectedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    const reportConfig = {
      selectedSections: Object.keys(selectedSections).filter(key => selectedSections[key]),
      format: reportFormat,
      customNotes: customNotes.trim()
    };
    
    try {
      await onGenerate(reportConfig);
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCount = Object.values(selectedSections).filter(Boolean).length;

  if (!isOpen) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && onClose()
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'
    },
      // Header
      React.createElement('div', {
        className: 'p-6 border-b border-gray-200'
      },
        React.createElement('div', {
          className: 'flex justify-between items-center'
        },
          React.createElement('h2', {
            className: 'text-2xl font-bold text-gray-900'
          }, 'Customize Your Report'),
          React.createElement('button', {
            onClick: onClose,
            className: 'text-gray-400 hover:text-gray-600'
          },
            React.createElement('svg', {
              className: 'w-6 h-6',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M6 18L18 6M6 6l12 12'
              })
            )
          )
        ),
        React.createElement('p', {
          className: 'mt-2 text-sm text-gray-600'
        }, `Select the sections you want to include in your PDF report (${selectedCount} selected)`),
        React.createElement('div', {
          className: 'mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200'
        },
          React.createElement('p', {
            className: 'text-xs text-blue-800 font-medium'
          }, '✨ NEW FEATURES: Your report now includes professional charts, visual KPIs, investment grade ratings, and enhanced data visualizations!')
        )
      ),

      // Content
      React.createElement('div', {
        className: 'p-6'
      },
        // Report Format Selection
        React.createElement('div', {
          className: 'mb-6'
        },
          React.createElement('label', {
            className: 'block text-sm font-medium text-gray-700 mb-2'
          }, 'Report Format'),
          React.createElement('div', {
            className: 'flex gap-4'
          },
            React.createElement('label', {
              className: 'flex items-center cursor-pointer'
            },
              React.createElement('input', {
                type: 'radio',
                value: 'detailed',
                checked: reportFormat === 'detailed',
                onChange: (e) => setReportFormat(e.target.value),
                className: 'mr-2 text-blue-600'
              }),
              React.createElement('span', {
                className: 'text-sm'
              }, 'Detailed Report'),
              React.createElement('span', {
                className: 'ml-2 text-xs text-gray-500'
              }, '(Full analysis)')
            ),
            React.createElement('label', {
              className: 'flex items-center cursor-pointer'
            },
              React.createElement('input', {
                type: 'radio',
                value: 'summary',
                checked: reportFormat === 'summary',
                onChange: (e) => setReportFormat(e.target.value),
                className: 'mr-2 text-blue-600'
              }),
              React.createElement('span', {
                className: 'text-sm'
              }, 'Summary Report'),
              React.createElement('span', {
                className: 'ml-2 text-xs text-gray-500'
              }, '(Key highlights)')
            )
          )
        ),

        // Section Selection
        React.createElement('div', {
          className: 'mb-6'
        },
          React.createElement('label', {
            className: 'block text-sm font-medium text-gray-700 mb-3'
          }, 'Report Sections'),
          React.createElement('div', {
            className: 'space-y-2 bg-gray-50 p-4 rounded-lg'
          },
            Object.entries(sectionLabels).map(([key, label]) => 
              React.createElement('label', {
                key: key,
                className: 'flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer transition-colors'
              },
                React.createElement('div', {
                  className: 'flex items-center'
                },
                  React.createElement('input', {
                    type: 'checkbox',
                    checked: selectedSections[key],
                    onChange: () => handleSectionToggle(key),
                    className: 'h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
                  }),
                  React.createElement('span', {
                    className: 'ml-3 text-sm text-gray-700'
                  }, label)
                ),
                // Show if section has data
                analysisData && (
                  key === 'shortTermRental' && !analysisData.strAnalysis ? 
                  React.createElement('span', {
                    className: 'text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded'
                  }, 'No data') : 
                  React.createElement('span', {
                    className: 'text-xs text-green-600 bg-green-100 px-2 py-1 rounded'
                  }, 'Available')
                )
              )
            )
          ),
          React.createElement('div', {
            className: 'mt-2 flex justify-between text-xs'
          },
            React.createElement('button', {
              onClick: () => setSelectedSections(Object.fromEntries(
                Object.keys(sectionLabels).map(key => [key, true])
              )),
              className: 'text-blue-600 hover:text-blue-800'
            }, 'Select All'),
            React.createElement('button', {
              onClick: () => setSelectedSections(Object.fromEntries(
                Object.keys(sectionLabels).map(key => [key, false])
              )),
              className: 'text-blue-600 hover:text-blue-800'
            }, 'Deselect All')
          )
        ),

        // Custom Notes
        React.createElement('div', {
          className: 'mb-6'
        },
          React.createElement('label', {
            className: 'block text-sm font-medium text-gray-700 mb-2'
          }, 'Custom Notes (Optional)'),
          React.createElement('textarea', {
            value: customNotes,
            onChange: (e) => setCustomNotes(e.target.value),
            placeholder: 'Add any custom notes or disclaimers for your client...',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
            rows: 4
          }),
          React.createElement('p', {
            className: 'mt-1 text-xs text-gray-500'
          }, 'These notes will appear at the end of the report')
        )
      ),

      // Footer
      React.createElement('div', {
        className: 'p-6 border-t border-gray-200 bg-gray-50'
      },
        React.createElement('div', {
          className: 'flex justify-between items-center'
        },
          React.createElement('p', {
            className: 'text-sm text-gray-600'
          }, 
            selectedCount === 0 ? 
            'Please select at least one section' : 
            `Your report will include ${selectedCount} section${selectedCount === 1 ? '' : 's'}`
          ),
          React.createElement('div', {
            className: 'flex gap-3'
          },
            React.createElement('button', {
              onClick: onClose,
              disabled: isGenerating,
              className: 'px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
            }, 'Cancel'),
            React.createElement('button', {
              onClick: handleGenerate,
              disabled: selectedCount === 0 || isGenerating,
              className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            },
              isGenerating && React.createElement('svg', {
                className: 'animate-spin h-4 w-4',
                xmlns: 'http://www.w3.org/2000/svg',
                fill: 'none',
                viewBox: '0 0 24 24'
              },
                React.createElement('circle', {
                  className: 'opacity-25',
                  cx: '12',
                  cy: '12',
                  r: '10',
                  stroke: 'currentColor',
                  strokeWidth: '4'
                }),
                React.createElement('path', {
                  className: 'opacity-75',
                  fill: 'currentColor',
                  d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                })
              ),
              isGenerating ? 'Generating...' : 'Generate PDF Report'
            )
          )
        )
      )
    )
  );
};

// Export for use in other components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReportCustomizationModal;
}