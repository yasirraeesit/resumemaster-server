import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path for storing resumes (resolved from workspace root/server directory)
const DB_FILE = path.join(__dirname, '..', 'resumes.json');

// Ensure DB file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Helper to flush section text arrays into standard schema objects (heuristic parser)
function flushSection(section, buffer, resumeData) {
  if (buffer.length === 0) return;
  const content = buffer.join('\n');

  if (section === 'summary') {
    resumeData.summary = content;
  } else if (section === 'skills') {
    resumeData.skills = buffer
      .flatMap(line => line.split(/[|,]/))
      .map(s => s.trim())
      .filter(Boolean);
  } else if (section === 'experience') {
    resumeData.experience.push({
      company: 'Extracted Company',
      role: 'Extracted Role',
      startDate: '',
      endDate: '',
      description: content
    });
  } else if (section === 'education') {
    resumeData.education.push({
      school: 'Extracted School',
      degree: 'Extracted Degree',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      description: content
    });
  } else if (section === 'projects') {
    resumeData.projects.push({
      name: 'Extracted Project',
      description: content,
      url: ''
    });
  }
}

/**
 * Call Gemini API to parse raw text into clean structured resume schema
 */
async function parseWithGemini(resumeText, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `
You are an expert resume parsing system. Analyze the following raw text extracted from a resume PDF and map it into a structured JSON format matching the schema instructions.

Rules:
1. Ensure all experience descriptions, projects, and education descriptions are converted into clean, separate bullet points starting with the bullet character "•" separated by newlines.
2. For education entries, extract fields like school, degree, fieldOfStudy, location, startDate, and endDate accurately.
3. For skills, return an array of strings representing individual skills/technologies.
4. If details are missing or cannot be found, leave them as empty strings "" or empty arrays [].
5. Do not include markdown wraps (like \`\`\`json) in your final response. Return ONLY the raw JSON string.

Raw Resume Text:
${resumeText}

JSON Schema structure:
{
  "personalInfo": {
    "fullName": "Candidate full name",
    "title": "Candidate current professional title / target role",
    "email": "Candidate email address",
    "phone": "Candidate phone number",
    "location": "Candidate city and state",
    "website": "Candidate personal website link",
    "github": "Candidate GitHub profile link",
    "linkedin": "Candidate LinkedIn profile link"
  },
  "summary": "Professional summary of qualifications",
  "skills": ["array of skills / keywords"],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "location": "Location (City, State)",
      "startDate": "Start date (e.g. Jan 2021)",
      "endDate": "End date (e.g. Present or Dec 2023)",
      "description": "Achievement bullet points starting with • and separated by newlines"
    }
  ],
  "education": [
    {
      "school": "School or University Name",
      "degree": "Degree (e.g. Bachelor of Science)",
      "fieldOfStudy": "Field of Study (e.g. Computer Science)",
      "location": "Location (City, State)",
      "startDate": "Start Date",
      "endDate": "End Date",
      "description": "Achievements / details starting with • and separated by newlines"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Details and outcomes starting with •",
      "url": "Project website / repository URL"
    }
  ]
}
`;

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
 * Endpoint: Parse PDF Resume file to JSON
 */
export const parseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF file.' });
    }

    const dataBuffer = req.file.buffer;
    const parsedData = await pdfParse(dataBuffer);
    const text = parsedData.text;

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      console.log('[Server] Attempting parsing with Gemini API...');
      try {
        const extractedData = await parseWithGemini(text, apiKey);
        console.log('[Server] Gemini successfully parsed PDF!');
        return res.json({
          success: true,
          text: text,
          extractedData: extractedData
        });
      } catch (geminiError) {
        console.error('[Server] Gemini parsing failed, falling back to heuristics:', geminiError);
      }
    }

    // Heuristics Fallback
    console.log('[Server] Using heuristics fallback for parsing...');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    const resumeData = {
      personalInfo: {
        fullName: '',
        title: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        github: '',
        linkedin: ''
      },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      projects: []
    };

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const urls = text.match(/https?:\/\/[^\s]+/gi) || [];

    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) resumeData.personalInfo.email = emails[0];

    const phones = text.match(phoneRegex);
    if (phones && phones.length > 0) resumeData.personalInfo.phone = phones[0];

    urls.forEach(url => {
      if (url.includes('github.com')) resumeData.personalInfo.github = url;
      else if (url.includes('linkedin.com')) resumeData.personalInfo.linkedin = url;
      else resumeData.personalInfo.website = url;
    });

    if (lines.length > 0) {
      const potentialName = lines[0];
      if (potentialName.length < 30 && !potentialName.includes('@') && !potentialName.includes('/')) {
        resumeData.personalInfo.fullName = potentialName;
      }
    }

    let currentSection = 'summary';
    let currentTextBuffer = [];

    const sectionHeaders = {
      summary: ['summary', 'profile', 'objective', 'about me'],
      experience: ['experience', 'work experience', 'employment history', 'work history', 'professional experience'],
      education: ['education', 'academic background', 'studies'],
      skills: ['skills', 'technical skills', 'skills & technologies', 'competencies'],
      projects: ['projects', 'personal projects', 'key projects', 'academic projects']
    };

    lines.forEach((line, index) => {
      if (index === 0 && line === resumeData.personalInfo.fullName) return;

      const lineLower = line.toLowerCase().replace(/[^a-z ]/g, '').trim();
      let matchedHeader = null;

      for (const [sectionKey, keywords] of Object.entries(sectionHeaders)) {
        if (keywords.includes(lineLower)) {
          matchedHeader = sectionKey;
          break;
        }
      }

      if (matchedHeader) {
        flushSection(currentSection, currentTextBuffer, resumeData);
        currentSection = matchedHeader;
        currentTextBuffer = [];
      } else {
        currentTextBuffer.push(line);
      }
    });
    
    flushSection(currentSection, currentTextBuffer, resumeData);

    if (resumeData.skills.length > 0 && resumeData.skills.every(s => s.includes(',') || s.includes('|'))) {
      const skillsText = resumeData.skills.join(', ');
      resumeData.skills = skillsText
        .split(/[|,]/)
        .map(s => s.trim())
        .filter(Boolean);
    }

    res.json({
      success: true,
      text: text,
      extractedData: resumeData
    });
  } catch (error) {
    console.error('PDF parsing error:', error);
    res.status(500).json({ error: 'Failed to parse resume PDF. ' + error.message });
  }
};

/**
 * Endpoint: Get all saved resumes
 */
export const getResumes = (req, res) => {
  try {
    const fileData = fs.readFileSync(DB_FILE, 'utf8');
    res.json(JSON.parse(fileData));
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve resumes.' });
  }
};

/**
 * Endpoint: Save / update a resume
 */
export const saveResume = (req, res) => {
  try {
    const { id, title, data } = req.body;
    
    if (!title || !data) {
      return res.status(400).json({ error: 'Title and data are required.' });
    }

    const fileData = fs.readFileSync(DB_FILE, 'utf8');
    const resumes = JSON.parse(fileData);

    const newResume = {
      id: id || Date.now().toString(),
      title,
      data,
      updatedAt: new Date().toISOString()
    };

    const existingIndex = resumes.findIndex(r => r.id === newResume.id);
    if (existingIndex > -1) {
      resumes[existingIndex] = newResume;
    } else {
      resumes.push(newResume);
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(resumes, null, 2));
    res.json({ success: true, resume: newResume });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save resume. ' + error.message });
  }
};

/**
 * Endpoint: Delete a resume
 */
export const deleteResume = (req, res) => {
  try {
    const { id } = req.params;
    const fileData = fs.readFileSync(DB_FILE, 'utf8');
    const resumes = JSON.parse(fileData);

    const filtered = resumes.filter(r => r.id !== id);
    fs.writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resume.' });
  }
};
