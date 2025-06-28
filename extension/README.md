# StarterPackApp Browser Extension

Analyze real estate investments with one click directly from Realtor.ca property listings.

## Features

- **One-Click Analysis**: Analyze any property on Realtor.ca with a single click
- **Automatic Data Extraction**: No manual data entry - the extension extracts all property details
- **Instant ROI Calculations**: See cash flow, cap rate, and investment potential
- **STR vs LTR Comparison**: Compare short-term rental (Airbnb) vs long-term rental strategies
- **Seamless Integration**: Works with your StarterPackApp account

## Installation

### For Development

1. Clone the repository
2. Open Chrome or Edge browser
3. Navigate to `chrome://extensions` (or `edge://extensions`)
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select the `extension` directory

### For Production

The extension will be available on the Chrome Web Store and Edge Add-ons store (coming soon).

## Usage

1. **Login to StarterPackApp**: First, login to your account at [starterpackapp.vercel.app](https://starterpackapp.vercel.app)
2. **Browse Properties**: Navigate to any property listing on Realtor.ca
3. **Click Analyze**: Click the "Analyze with StarterPackApp" button that appears on the listing
4. **View Results**: The analysis will open in a new tab with comprehensive ROI calculations

## How It Works

1. The extension extracts property data from Realtor.ca listings:
   - Address and location
   - Price and property details
   - Bedrooms, bathrooms, square footage
   - Property taxes and condo fees
   - MLS number and description

2. Sends data securely to StarterPackApp API

3. Opens analysis results showing:
   - Traditional rental income potential
   - Short-term rental (Airbnb) projections
   - Cash flow analysis
   - Investment recommendations

## Data Extracted

- **Property Identification**: MLS number, URL
- **Location**: Full address with street, city, province, postal code
- **Property Details**: Bedrooms, bathrooms, square feet, property type, year built
- **Financial Info**: Listing price, property taxes, condo/strata fees
- **Description**: Full property description

## Privacy & Security

- Only extracts data from properties you explicitly choose to analyze
- Requires authentication with your StarterPackApp account
- All data transmitted securely over HTTPS
- No data is stored locally in the extension

## Troubleshooting

### "Please login first" error
- Make sure you're logged in to StarterPackApp in your browser
- Try refreshing the Realtor.ca page after logging in

### Button doesn't appear
- Ensure you're on a property details page (not search results)
- Try refreshing the page
- Check that the extension is enabled

### Analysis fails
- Verify your StarterPackApp account is active
- Check you haven't exceeded your monthly analysis limit
- Try refreshing and clicking analyze again

## Development

### Building for Production

```bash
cd extension
npm run package
```

This creates `starterpackapp-extension.zip` ready for store submission.

### Testing

1. Make changes to the extension code
2. Go to `chrome://extensions`
3. Click the refresh icon on the StarterPackApp extension
4. Test your changes on Realtor.ca

## Support

For issues or questions:
- Email: support@starterpackapp.com
- Documentation: [starterpackapp.vercel.app/docs](https://starterpackapp.vercel.app/docs)

## License

MIT License - Part of StarterPackApp