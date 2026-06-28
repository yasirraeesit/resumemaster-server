/**
 * Helper to call Gemini API
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
 * Endpoint: Generate tailored Cover Letter
 */
export const generateCoverLetter = async (req, res) => {
  const { resumeText, jobDescription, tone = 'Professional', length = 'Detailed' } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({ error: 'Gemini API Key is not configured on the server.' });
  }

  if (!jobDescription || jobDescription.trim() === '') {
    return res.status(400).json({ error: 'Target Job Description is required.' });
  }

  try {
    const prompt = `
You are a senior professional cover letter writer.
Candidate Resume Text:
"${resumeText || ''}"

Target Job Description:
"${jobDescription}"

Task:
1. Write a highly tailored cover letter matching the target job description.
2. Structure the letter with standard spacing and paragraphs:
   - Date placeholder (e.g. June 22, 2026)
   - Candidate details placeholders (Name, Location, Email, Phone) at the top.
   - Dear Hiring Manager,
   - Paragraph 1: An attention-grabbing hook explaining interest in the role and referencing the company.
   - Paragraph 2: Core achievements from the candidate's resume that match the job description's critical skill needs. Mention metrics if available.
   - Paragraph 3: Alignment of values, why they are excited about this company, and call to action.
   - Sincerely,
   - Candidate Name placeholder.
3. Tone of the cover letter: "${tone}". Adjust the style, expressions, and vocabulary to match this tone.
4. Length of the cover letter: "${length === 'Short' ? 'short, concise and focused (around 200-250 words)' : 'detailed and descriptive (around 350-450 words)'}".
5. Do not include markdown code block formatting. Return ONLY the JSON object.

JSON Schema output:
{
  "coverLetter": "string containing the full cover letter with newlines"
}
`;

    console.log('[Server] Generating Cover Letter with Gemini...');
    const result = await callGemini(prompt, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Gemini cover letter generation failed:', error);
    res.status(500).json({ error: 'Failed to generate cover letter: ' + error.message });
  }
};

/**
 * Endpoint: Optimize LinkedIn Profile sections
 */
export const generateLinkedIn = async (req, res) => {
  const { resumeText } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({ error: 'Gemini API Key is not configured on the server.' });
  }

  try {
    const prompt = `
You are a senior LinkedIn profile branding consultant.
Candidate Resume Text:
"${resumeText || ''}"

Task:
1. Create optimized profile materials to boost recruiter visibility in search engines.
2. Generate:
   - 3 LinkedIn Headline Options (emphasizing specialization, credentials, and key skills under 220 chars).
   - 1 LinkedIn "About" Summary (around 200-250 words, written in the first person, conversational, inviting, ending with a bulleted specialties catalog).
3. Do not include markdown code block formatting. Return ONLY the JSON object.

JSON Schema output:
{
  "headlines": [
    "Headline option 1 (e.g. Senior Frontend Engineer | React | Next.js | TypeScript)",
    "Headline option 2",
    "Headline option 3"
  ],
  "about": "Conversational LinkedIn summary written in first-person with a clean layout."
}
`;

    console.log('[Server] Generating LinkedIn optimizations with Gemini...');
    const result = await callGemini(prompt, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Gemini LinkedIn optimization failed:', error);
    res.status(500).json({ error: 'Failed to generate LinkedIn optimizations: ' + error.message });
  }
};

/**
 * Endpoint: Predict Interview Q&A
 */
export const generateInterviewPrep = async (req, res) => {
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
You are a senior technical recruiter and mock interviewer.
Candidate Resume Text:
"${resumeText || ''}"

Target Job Description:
"${jobDescription}"

Task:
1. Review the candidate's skills and the target role requirements.
2. Predict 4 specific questions they are highly likely to face (2 technical questions about their stack, and 2 behavioral/situational questions).
3. For each question, provide 3 brief bullet points of answer tips (coaching on what they should highlight based on their resume achievements).
4. Do not include markdown code block formatting. Return ONLY the JSON object.

JSON Schema output:
{
  "questions": [
    {
      "id": 1,
      "type": "Technical",
      "question": "Predicted question text",
      "tips": "Bullet tips on what to talk about (e.g. • Highlight your PostgreSQL migration work... • Mention the 40% query optimization...)"
    }
  ]
}
`;

    console.log('[Server] Generating predicted interview questions with Gemini...');
    const result = await callGemini(prompt, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Gemini predicted questions failed:', error);
    res.status(500).json({ error: 'Failed to generate interview prep materials: ' + error.message });
  }
};

/**
 * Endpoint: Evaluate mock interview user response with Speech AI
 */
export const evaluateInterviewAnswer = async (req, res) => {
  const { question, userAnswer, resumeText } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({ error: 'Gemini API Key is not configured on the server.' });
  }

  if (!question || !userAnswer) {
    return res.status(400).json({ error: 'Question and User Answer are required.' });
  }

  try {
    const prompt = `
You are an expert career coach and technical interviewer. Evaluate the candidate's spoken response to the interview question below.

Question Asked:
"${question}"

Candidate Spoken Answer:
"${userAnswer}"

Candidate Resume Profile (for background context):
"${resumeText || ''}"

Task:
1. Grade the candidate's answer out of 100 based on accuracy, relevance, communication clarity, and whether they included measurable metrics.
2. Outline specific strengths in their answer.
3. Outline key weaknesses and gaps (e.g. "You failed to explain the outcome of your action" or "Define the technical details of the framework").
4. Provide a sample model response showing how a top-tier candidate would answer this question using the STAR method.
5. Return ONLY the JSON object matching the schema below. Do not wrap in markdown tags.

JSON Schema output:
{
  "score": 85,
  "strengths": "Outline of key strengths (bulleted list)",
  "weaknesses": "Outline of key weaknesses / areas for improvement (bulleted list)",
  "modelAnswer": "A high-performance mock answer utilizing the STAR method."
}
`;

    console.log('[Server] Evaluating mock interview answer with Gemini...');
    const result = await callGemini(prompt, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Gemini mock interview evaluation failed:', error);
    res.status(500).json({ error: 'Failed to evaluate interview answer: ' + error.message });
  }
};

/**
 * Endpoint: Generate tailored LinkedIn Post
 */
export const generateLinkedInPost = async (req, res) => {
  const { resumeText, topic, tone = 'Professional', hookStyle = 'Bold statement', useEmojis = true, cta = 'None' } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({ error: 'Gemini API Key is not configured on the server.' });
  }

  if (!topic || topic.trim() === '') {
    return res.status(400).json({ error: 'Post topic / objective is required.' });
  }

  try {
    const prompt = `
You are an expert LinkedIn content creator and professional ghostwriter.
Candidate Resume details (use this context to personalize details in the post if relevant to their background):
"${resumeText || ''}"

Post Topic / Goal:
"${topic}"

Formatting Parameters:
1. Tone: "${tone}" (e.g. Professional, Casual, Inspiring, Assertive, Humorous)
2. Hook style: "${hookStyle}" (e.g. Question, Bold statement, Story opening, Statistic)
3. Emojis enabled: ${useEmojis ? 'Yes (include rich, professional emojis throughout)' : 'No (strictly do not include emojis)'}
4. Call to Action (CTA): "${cta}" (e.g. 'Let\'s connect', 'Read my blog', 'Leave a comment', 'None')

Task:
1. Write a highly engaging LinkedIn post based on the topic.
2. The hook must grab the reader's attention instantly in the first 2 lines.
3. Break the post into short paragraphs or bullet lists for readability.
4. Keep the total length around 100 to 200 words.
5. End with the specified Call to Action (CTA) if it is not 'None'.
6. Generate 3-5 high-engagement hashtags at the bottom.
7. Return ONLY a JSON object matching the schema below. No markdown wrappers.

JSON Schema output:
{
  "post": "string containing the full LinkedIn post text with newlines"
}
`;

    console.log('[Server] Generating LinkedIn Post with Gemini...');
    const result = await callGemini(prompt, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Gemini LinkedIn post generation failed:', error);
    res.status(500).json({ error: 'Failed to generate LinkedIn post: ' + error.message });
  }
};

