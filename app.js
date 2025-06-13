// Simple app.js - only runs if search form exists
document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.getElementById('search-form');
  
  // Only run if we're on a page with the search form
  if (searchForm) {
    searchForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const form = new FormData(e.target);
      const city = form.get('city');
      const maxPrice = parseInt(form.get('maxPrice'));
      const propertyType = form.get('propertyType').toLowerCase();
      const minROI = parseFloat(form.get('minROI'));

      const res = await fetch('data/listings.json');
      const listings = await res.json();

      const filtered = listings.filter(l => 
        l.city.toLowerCase().includes(city.toLowerCase()) &&
        l.price <= maxPrice &&
        l.propertyType.toLowerCase().includes(propertyType) &&
        l.roi >= minROI
      );

      const results = document.getElementById('results');
      if (results) {
        results.innerHTML = filtered.map(l => `
          <div>
            <h3>${l.address}</h3>
            <p>Price: $${l.price}</p>
            <p>Rent Estimate: $${l.rent}/month</p>
            <p>ROI: ${l.roi}%</p>
            <a href="${l.link}" target="_blank">View Listing</a>
          </div>
          <hr />
        `).join('') || "<p>No results found.</p>";
      }
    });
  }
});
