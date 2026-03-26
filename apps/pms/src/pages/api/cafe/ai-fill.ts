import type { NextApiRequest, NextApiResponse } from 'next'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

  const { name, diet } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })

  const dietLabel = diet === 'non_veg' ? 'non-vegetarian' : diet === 'egg' ? 'egg-based/eggetarian' : 'vegetarian'

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        messages: [
          {
            role: 'system',
            content: 'You are a cafe nutritionist. Return ONLY valid JSON, no markdown or explanation.',
          },
          {
            role: 'user',
            content: `For this Indian cafe dish, return a JSON object:

Dish: "${name}"
Diet: ${dietLabel}

JSON shape:
{
  "description": "One-line appetizing description, max 100 chars",
  "calories": <number, kcal for one serving>,
  "protein": <number, grams>,
  "carbs": <number, grams>,
  "fats": <number, grams>,
  "fibre": <number, grams>,
  "sugar": <number, grams>,
  "recipe": "Brief recipe steps, 2-3 sentences",
  "ingredients": "Comma-separated list of main ingredients"
}

Use realistic values for a typical Indian cafe portion.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(502).json({ error: `OpenAI API error: ${response.status}`, details: err })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(502).json({ error: 'Failed to parse AI response' })

    const parsed = JSON.parse(jsonMatch[0])
    return res.status(200).json(parsed)
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
