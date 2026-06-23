/**
 * Call Gemini API with a specific prompt and JSON output
 */
async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
  }

  const resJson = await response.json();
  const textOutput = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Failed to retrieve content from Gemini response.');
  }

  return JSON.parse(textOutput.trim());
}

/**
 * Endpoint: Enhance a work experience bullet point using the Google X-Y-Z formula
 */
export const enhanceBullet = async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({ error: 'Gemini API Key is not configured on the server.' });
  }

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Description text is required for enhancement.' });
  }

  try {
    const prompt = `
You are a senior professional resume writer. Review the following work experience/project bullet points:
"${text}"

Task:
1. Rewrite these bullets to follow Google's X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]" where possible. Include measurable metrics and outcomes (if none are provided, make realistic assumptions for the role).
2. Start every bullet point with the bullet symbol "•".
3. Separate bullets with newlines.
4. Keep the output highly impactful, concise, and focused on tech achievements.
5. Do not write introductory or explanatory remarks. Return ONLY the JSON object.

JSON Schema output:
{
  "enhancedText": "string containing the rewritten bullet points starting with •"
}
`;

    console.log('[Server] Enhancing bullet points with Gemini...');
    const result = await callGemini(prompt, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Gemini bullet enhancement failed:', error);
    res.status(500).json({ error: 'Failed to enhance bullet points: ' + error.message });
  }
};

/**
 * Endpoint: Suggest achievement bullet points targeting specific missing keywords from Job Description
 */
export const suggestBullets = async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({ error: 'Gemini API Key is not configured on the server.' });
  }

  if (!jobDescription || jobDescription.trim() === '') {
    return res.status(400).json({ error: 'Target Job Description is required.' });
  }

  try {
    const prompt = `
You are a senior professional recruiter and resume coach.
Candidate Resume Text:
"${resumeText || ''}"

Target Job Description:
"${jobDescription}"

Task:
1. Analyze the mismatch between the candidate's resume and the target job description (e.g. missing technologies, frameworks, or methodologies).
2. Generate 3 highly optimized, achievement-oriented work experience bullet points that describe realistic contributions that utilize the missing technical skills.
3. Every bullet point must start with "•" and be separated by newlines.
4. Use strong action verbs (e.g. Engineered, Orchestrated, Optimized).
5. Do not include markdown code block formats. Return ONLY the JSON object.

JSON Schema output:
{
  "suggestedBullets": "string containing the 3 generated bullet points starting with •"
}
`;

    console.log('[Server] Generating suggested bullets with Gemini...');
    const result = await callGemini(prompt, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Gemini suggest bullets failed:', error);
    res.status(500).json({ error: 'Failed to generate suggestions: ' + error.message });
  }
};
