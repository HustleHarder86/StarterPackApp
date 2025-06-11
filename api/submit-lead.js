export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }

  const { name, email } = req.body;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = 'appulB9SOqm16pklS';
  const tableName = 'Leads';

  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: { Name: name, Email: email } })
  });

  const result = await response.json();

  if (!response.ok) {
    return res.status(500).json({ error: result });
  }

  return res.status(200).json({ success: true, data: result });
}