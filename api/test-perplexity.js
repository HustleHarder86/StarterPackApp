export default async function handler(req, res) {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${perplexityApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3-sonar-large-32k-online",
      messages: [
        { role: "user", content: "What is ROI in real estate?" }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: data });
  }

  res.status(200).json({ result: data });
}
