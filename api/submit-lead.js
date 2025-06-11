
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email } = req.body;

    const airtableRes = await fetch("https://api.airtable.com/v0/appulB9SOqm16pklS/Leads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Name: name,
          Email: email,
          "Submitted At": new Date().toISOString()
        }
      }),
    });

    if (airtableRes.ok) {
      res.status(200).json({ success: true });
    } else {
      const error = await airtableRes.text();
      res.status(500).json({ success: false, error });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
