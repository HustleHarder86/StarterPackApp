# Real Estate ROI Finder

A simple web app to filter dummy real estate listings based on ROI and user input.

## Setup

1. Upload these files to a GitHub repo.
2. Go to [Vercel](https://vercel.com), log in with GitHub, and import the repo.
3. Vercel will auto-deploy your app with a public URL.

### Environment Variables

Create the following environment variables in your Vercel project so the lead
capture form can post new records to Airtable:

```
AIRTABLE_API_KEY      # Your Airtable API key
AIRTABLE_BASE_ID      # The base ID that contains the Leads table
AIRTABLE_TABLE_NAME   # The table to store new leads (e.g. "Leads")
```

## How It Works

- Users enter search criteria
- Dummy listings are filtered based on ROI, price, city, and type
- Results are shown with links to listings
