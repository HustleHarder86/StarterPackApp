export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing name or email' });
  }

  // Use environment variable for authentication or forwarding leads
  const apiKey = process.env.LEAD_API_KEY;

  try {
    // Forward the lead to an external service using the API key
    if (apiKey) {
      await fetch('https://example.com/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ name, email })
      });
    }
  } catch (err) {
    console.error('Error forwarding lead:', err);
    // Continue to respond with success so the frontend shows success
  }

  return res.status(200).json({ success: true });
}
