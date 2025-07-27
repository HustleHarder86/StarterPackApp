/**
 * Components Index
 * Central export point for all refactored components
 */

// Analysis Components (Consolidated)
export { AirbnbListings, AirbnbListingsEmpty } from './analysis/AirbnbListings.js';
export { InvestmentVerdict, InvestmentVerdictEmpty } from './analysis/InvestmentVerdict.js';
export { FinancialSummary } from './analysis/FinancialSummary.js';

// UI Components (Existing)
export { Card } from '../components/ui/Card.js';
export { Badge, StatusBadge, MetricBadge, LiveDataBadge, PerformanceBadge } from '../components/ui/Badge.js';
export { Button } from '../components/ui/Button.js';
export { LoadingSpinner } from '../components/ui/LoadingSpinner.js';
export { ProgressIndicator } from '../components/ui/ProgressIndicator.js';
export { Tooltip, RatingTooltip, InfoTooltip } from '../components/ui/Tooltip.js';
export { RatingLegend, CompactRatingLegend } from '../components/ui/RatingLegend.js';

// Other Analysis Components
export { LongTermRentalAnalysis } from '../components/analysis/LongTermRentalAnalysis.js';
export { PropertyAppreciationChart } from '../components/analysis/PropertyAppreciationChart.js';
export { InteractiveFinancialCalculator } from '../components/analysis/InteractiveFinancialCalculator.js';

// Form Components
export { PropertyAnalysisForm } from '../components/PropertyAnalysisForm.jsx';
export { PropertyConfirmation } from '../components/PropertyConfirmation.js';