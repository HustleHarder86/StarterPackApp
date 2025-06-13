export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { name, email, message } = req.body;

  try {
    const airtableRes = await fetch('https://api.airtable.com/v0/YOUR_BASE_ID/Contact%20Us%20Requests', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: name,
              Email: email,
              Message: message
            }
          }
        ]
      })
    });

    if (!airtableRes.ok) throw new Error(await airtableRes.text());

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Airtable error:', error);
    return res.status(500).json({ error: 'Failed to submit to Airtable' });
  }
}
