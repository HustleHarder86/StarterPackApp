# Real Estate ROI Finder

A simple web app to filter dummy real estate listings based on ROI and user input.

## Setup

1. Upload these files to a GitHub repo.
2. Go to [Vercel](https://vercel.com), log in with GitHub, and import the repo.
3. Vercel will auto-deploy your app with a public URL.

## How It Works

- Users enter search criteria
- Dummy listings are filtered based on ROI, price, city, and type
- Results are shown with links to listings
- Click any listing to open it in a new tab.

## Development

Edit the HTML, CSS, and JavaScript files then push updates to your repository. Vercel will redeploy automatically.

### Lead Form

The lead capture form on `home.html` posts to `/api/submit-lead`. If that endpoint isn't available, submissions are stored in `localStorage` so the demo still works offline.

