// File: api/submit-contact.js (for Vercel)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields: name, email, or message' });
  }

  // Airtable credentials from environment variables
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'your_actual_base_id_here';
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Leads';

  if (!airtableApiKey) {
    console.error('Missing AIRTABLE_API_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error' });
  }

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
          Message: message,
          'Submitted At': new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error:', errorData);
      return res.status(500).json({ error: 'Failed to save contact information', details: errorData });
    }

    const data = await response.json();
    console.log('Contact form submitted successfully:', data.id);
    
    return res.status(200).json({ message: 'Contact form submitted successfully', id: data.id });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
