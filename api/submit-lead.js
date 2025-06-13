// File: api/submit-lead.js (for Vercel or Netlify)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing name or email' });
  }

 h5n9gu-codex/troubleshoot-api-connection-to-airtable
  // Airtable credentials are provided via environment variables in Vercel
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appulB9SOqm16pklS';
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Leads';

  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const baseId = 'appulB9SOqm16pklS';
  const tableName = 'Leads';
main

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
 h5n9gu-codex/troubleshoot-api-connection-to-airtable
          Email: email,
          'Submitted At': new Date().toISOString()

          Email: email
 main
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
