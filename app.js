document.getElementById('search-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const city = form.get('city') || '';
  const maxPrice = parseInt(form.get('maxPrice'), 10);
  const propertyType = (form.get('propertyType') || '').toLowerCase();
  const minROI = parseFloat(form.get('minROI'));

  if (isNaN(maxPrice) || isNaN(minROI)) {
    alert('Please provide valid numeric values.');
    return;
  }

  try {
    const res = await fetch('data/listings.json');
    if (!res.ok) throw new Error('Network response was not ok');
    const listings = await res.json();

    const filtered = listings.filter(l =>
      l.city.toLowerCase().includes(city.toLowerCase()) &&
      l.price <= maxPrice &&
      l.propertyType.toLowerCase().includes(propertyType) &&
      l.roi >= minROI
    );

    const results = document.getElementById('results');
    results.innerHTML =
      filtered
        .map(l => `
      <div>
        <h3>${l.address}</h3>
        <p>Price: $${l.price}</p>
        <p>Rent Estimate: $${l.rent}/month</p>
        <p>ROI: ${l.roi}%</p>
        <a href="${l.link}" target="_blank" rel="noopener noreferrer">View Listing</a>
      </div>
      <hr />
    `)
        .join('') || '<p>No results found.</p>';
  } catch (err) {
    alert('Failed to load listings.');
    console.error(err);
  }
});
