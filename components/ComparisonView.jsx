const ComparisonView = ({ analyses }) => {
  return (
    <div className="comparison-grid">
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
            <th>ROI</th>
            <th>Best Strategy</th>
          </tr>
        </thead>
        <tbody>
          {analyses.map(analysis => (
            <tr key={analysis.id}>
              <td>{analysis.property_address}</td>
              <td>{formatCurrency(analysis.property_details.estimated_value)}</td>
              <td>{analysis.roi_percentage}%</td>
              <td>{analysis.recommendation.split('.')[0]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
