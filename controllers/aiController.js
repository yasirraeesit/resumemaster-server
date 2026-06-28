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

/**
 * Endpoint: Generate professional summary based on resume profile details
 */
export const generateSummary = async (req, res) => {
  const { title, skills, experience, projects } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // Build local heuristic backup summary
  const cleanTitle = title && title.trim() !== '' ? title : 'Software Professional';
  const skillsList = Array.isArray(skills) && skills.length > 0 ? skills.slice(0, 4) : ['Full-Stack Development', 'Software Engineering', 'System Architecture'];
  const companies = Array.isArray(experience) && experience.length > 0 ? experience.map(e => e.company).filter(Boolean) : [];
  const projectNames = Array.isArray(projects) && projects.length > 0 ? projects.map(p => p.name).filter(Boolean) : [];

  const mainCompany = companies.length > 0 ? companies[0] : '';
  const mainProj = projectNames.length > 0 ? projectNames[0] : '';

  let backupSummary = `Results-driven ${cleanTitle} with a strong technical foundation, specializing in ${skillsList.join(', ')} to engineer high-performance web ecosystems.`;
  if (mainCompany && mainProj) {
    backupSummary += ` Proven history of delivering scalable solutions, demonstrated through development roles at ${mainCompany} and key software projects like ${mainProj}.`;
  } else if (mainCompany) {
    backupSummary += ` Proven history of delivering scalable solutions, demonstrated through technical contributions at ${mainCompany}.`;
  } else if (mainProj) {
    backupSummary += ` Proven history of delivering scalable solutions, demonstrated through key software projects like ${mainProj}.`;
  }
  backupSummary += ` Focused on writing clean, production-ready code, optimizing database query performances, and leveraging agile methodologies to drive rapid business growth.`;

  // Try using Gemini if API key exists
  if (apiKey && apiKey.trim() !== '') {
    try {
      const prompt = `
You are a senior professional resume writer. Review the candidate's profile details:
Role Title: "${cleanTitle}"
Top Skills: ${JSON.stringify(skillsList)}
Experience Details: ${JSON.stringify(experience || [])}
Projects: ${JSON.stringify(projects || [])}

Task:
1. Compose a highly impactful, tailored 3-sentence professional summary (around 60-80 words) for the top of the resume.
2. Emphasize tech stack expertise, key business accomplishments, and engineering qualities.
3. Do not include markdown code block formats. Return ONLY the JSON object.

JSON Schema output:
{
  "summary": "string containing the generated summary text"
}
`;
      console.log('[Server] Generating professional summary with Gemini...');
      const result = await callGemini(prompt, apiKey);
      if (result && result.summary) {
        return res.json(result);
      }
    } catch (error) {
      console.error('[Server] Gemini summary generation failed, using heuristic backup:', error.message);
    }
  }

  // Fallback response
  res.json({ summary: backupSummary });
};

/**
 * Endpoint: Tailor full resume data to target Job Description using Gemini
 */
export const tailorResume = async (req, res) => {
  const { resumeData, jobDescription } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({ error: 'Gemini API Key is not configured on the server.' });
  }

  if (!resumeData || !jobDescription || jobDescription.trim() === '') {
    return res.status(400).json({ error: 'Both resumeData and target jobDescription are required.' });
  }

  try {
    const prompt = `
You are a senior professional resume writer and career coach.
Review the candidate's current resume data in JSON format:
${JSON.stringify(resumeData)}

And review the target Job Description:
"${jobDescription}"

Task:
1. Review the entire resume and the job description.
2. Tailor the professional summary to match the core expectations of the role.
3. Tailor the work experience bullet points (descriptions) and project bullet points (descriptions) to highlight technical skills, frameworks, achievements, and responsibilities that directly align with the job description. Do not invent fictitious job history, but optimize the terminology, emphasize matching tech stack details, and use action verbs with X-Y-Z outcomes.
4. Keep the other structural fields (personalInfo, skills list, dates, company names, etc.) intact but make sure any tailored fields have their values updated.
5. Return the entire modified resume JSON object.
6. Do not include markdown code block formats in the output. Return ONLY the JSON object.

The output JSON structure MUST match the input resume schema exactly, containing:
{
  "personalInfo": {
    "fullName": "string",
    "title": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "website": "string",
    "github": "string",
    "linkedin": "string"
  },
  "summary": "tailored summary",
  "skills": [ "string" ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "tailored description bullets starting with •"
    }
  ],
  "education": [
    {
      "school": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "tailored description bullets starting with •",
      "url": "string"
    }
  ],
  "sections": [ "string" ],
  "customSections": {
    "sectionKey": {
      "title": "string",
      "items": [ "string" ]
    }
  }
}
`;

    console.log('[Server] Tailoring resume with Gemini...');
    const result = await callGemini(prompt, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Gemini resume tailoring failed:', error);
    res.status(500).json({ error: 'Failed to tailor resume: ' + error.message });
  }
};

