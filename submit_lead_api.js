// File: api/submit-lead.js (for Vercel or Netlify)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel's Node runtime may not populate req.body automatically when
  // the request is sent as raw JSON. Parse it manually to be safe.
  let payload = req.body;
  if (!payload) {
    try {
      payload = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => (data += chunk));
        req.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      });
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const { name, email } = payload;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing name or email' });
  }

  // Airtable credentials are provided via environment variables in Vercel
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appulB9SOqm16pklS';
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Leads';

  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          Name: name,
          Email: email,
          'Submitted At': new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(500).json({ error: 'Airtable error', details: errorData });
    }

    return res.status(200).json({ message: 'Success' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
