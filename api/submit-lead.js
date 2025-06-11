import { NextResponse } from 'next/server';

export async function POST(request) {
  const { name, email } = await request.json();

  const airtableRes = await fetch('https://api.airtable.com/v0/appulB9SOqm16pklS/Leads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
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

  if (airtableRes.ok) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
