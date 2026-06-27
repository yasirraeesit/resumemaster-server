import pdfParse from 'pdf-parse';
import Resume from '../models/Resume.js';
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

// ── Sanitize parsed Gemini response to fix common formatting artifacts ──
function sanitizeParsed(data) {
  if (!data || typeof data !== 'object') return data;

  const cleanDescription = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/\r\n/g, '\n')          // normalize line endings
      .replace(/\n{2,}/g, '\n')        // collapse double+ newlines to single
      .split('\n')
      .map(line => line.replace(/^[•\-\*\s]+/, '').trim()) // strip leading bullet chars
      .filter(line => line.length > 1) // remove blank or single-char lines
      .map(line => `• ${line}`)        // re-normalize with clean bullet prefix
      .join('\n');
  };

  const toArray = (val) => Array.isArray(val) ? val : [];
  const toStr   = (val) => (val && typeof val === 'string') ? val.trim() : '';

  return {
    personalInfo: {
      fullName:  toStr(data.personalInfo?.fullName),
      title:     toStr(data.personalInfo?.title),
      email:     toStr(data.personalInfo?.email),
      phone:     toStr(data.personalInfo?.phone),
      location:  toStr(data.personalInfo?.location),
      website:   toStr(data.personalInfo?.website),
      github:    toStr(data.personalInfo?.github),
      linkedin:  toStr(data.personalInfo?.linkedin),
    },
    summary: toStr(data.summary),
    skills: toArray(data.skills).map(s => toStr(s)).filter(Boolean),
    experience: toArray(data.experience).map(exp => ({
      company:   toStr(exp.company),
      role:      toStr(exp.role),
      location:  toStr(exp.location),
      startDate: toStr(exp.startDate),
      endDate:   toStr(exp.endDate),
      description: cleanDescription(exp.description)
    })),
    education: toArray(data.education).map(edu => ({
      school:       toStr(edu.school),
      degree:       toStr(edu.degree),
      fieldOfStudy: toStr(edu.fieldOfStudy),
      location:     toStr(edu.location),
      startDate:    toStr(edu.startDate),
      endDate:      toStr(edu.endDate),
      description:  cleanDescription(edu.description)
    })),
    projects: toArray(data.projects).map(proj => ({
      name:        toStr(proj.name),
      description: cleanDescription(proj.description),
      url:         toStr(proj.url)
    })),
    sections: ['summary', 'skills', 'experience', 'education', 'projects']
  };
}

/**
 * Call Gemini API to parse raw text into clean structured resume schema
 */
async function parseWithGemini(resumeText, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `You are an expert resume parsing system. Analyze the raw text extracted from a resume PDF and return ONLY a valid JSON object matching the schema below. No markdown, no explanation, no code blocks — raw JSON only.

CRITICAL FORMATTING RULES:
1. All "description" fields for experience, education, and projects MUST be a string of bullet points.
2. Each bullet point MUST start with the character "•" (bullet) followed by a space, then the text.
3. Separate each bullet with EXACTLY ONE newline character (\\n). NO double newlines, NO blank lines.
4. If a description has only one point, still format it as a single bullet: "• Achieved X."
5. Skills MUST be an array of individual skill strings, never a comma-separated single string.
6. Dates should follow the format "Mon YYYY" (e.g., "Jan 2021") or "YYYY" for education. Use "Present" if ongoing.
7. If a field cannot be determined, use "" for strings and [] for arrays. NEVER use null.

Raw Resume Text:
"""
${resumeText}
"""

Required JSON Schema:
{
  "personalInfo": {
    "fullName": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": "",
    "github": "",
    "linkedin": ""
  },
  "summary": "",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "",
      "role": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "description": "• Achieved X by doing Y, resulting in Z.\\n• Led team of 5 engineers to deliver..."
    }
  ],
  "education": [
    {
      "school": "",
      "degree": "",
      "fieldOfStudy": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "description": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "• Built X using Y technology.\\n• Achieved Z outcome.",
      "url": ""
    }
  ]
}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
  }

  const resJson = await response.json();
  const textOutput = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) throw new Error('Failed to retrieve content from Gemini response.');

  const parsed = JSON.parse(textOutput.trim());
  return sanitizeParsed(parsed);
}

// ── Improved heuristic fallback parser ─────────────────────────────
function heuristicParse(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const resumeData = {
    personalInfo: { fullName: '', title: '', email: '', phone: '', location: '', website: '', github: '', linkedin: '' },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    sections: ['summary', 'skills', 'experience', 'education', 'projects']
  };

  // 1. Extract Name (first short alphabetic line that is not an email/URL)
  let nameIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length < 40 && line.length > 2 && !line.includes('@') && !/https?:\/\//.test(line) && /^[A-Za-z\s.'-]+$/.test(line)) {
      resumeData.personalInfo.fullName = line;
      nameIndex = i;
      break;
    }
  }

  // 2. Extract Professional Title (1-2 lines directly after the Name)
  if (nameIndex !== -1) {
    for (let i = nameIndex + 1; i <= Math.min(nameIndex + 3, lines.length - 1); i++) {
      const line = lines[i];
      if (line.includes('@') || /https?:\/\//.test(line) || /[\d()+-]{7,}/.test(line)) continue;
      if (line.length < 60 && /^[A-Z][a-zA-Z\s\-&/,|()]+$/.test(line)) {
        resumeData.personalInfo.title = line;
        break;
      }
    }
  }

  // 3. Extract Location (City, State / City, Country from first 15 lines of text)
  const headerText = lines.slice(0, 15).join('\n');
  const locationMatch = headerText.match(/\b([A-Z][a-zA-Z\s.-]+,\s*(?:[A-Z]{2}|[A-Z][a-z]{2,15}))\b/);
  if (locationMatch) {
    resumeData.personalInfo.location = locationMatch[1].trim();
  }

  // 4. Extract Contact Info (Email & Phone)
  const emailMatch = text.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = text.match(/(\+?[\d\s\-().]{7,15}\d)/);
  if (emailMatch) resumeData.personalInfo.email = emailMatch[1];
  if (phoneMatch) resumeData.personalInfo.phone = phoneMatch[1].trim();

  // 5. Extract Profile Links (supporting links without protocols like linkedin.com/in/...)
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\u00A0-\uD7FF]+/i);
  if (linkedinMatch) {
    let url = linkedinMatch[0];
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    resumeData.personalInfo.linkedin = url;
  }

  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-]+/i);
  if (githubMatch) {
    let url = githubMatch[0];
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    resumeData.personalInfo.github = url;
  }

  // General website extraction (excluding email, github, and linkedin)
  const allUrls = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}(?:\/[^\s]*)?/gi) || [];
  for (const urlToken of allUrls) {
    if (/github\.com/i.test(urlToken) || /linkedin\.com/i.test(urlToken) || /@/i.test(urlToken)) continue;
    let url = urlToken;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    resumeData.personalInfo.website = url;
    break;
  }

  // Section detection
  // Fuzzy section header detection — handles ALL CAPS, misspellings, and partial matches
  const SECTION_PATTERNS = {
    summary:    /\b(summary|profile|professional summary|objective|about me|about)\b/i,
    experience: /\b(experience|experiance|experince|expierence|work experience|employment|professional experience|career history|work history)\b/i,
    education:  /\b(education|academic|studies|qualifications|degree)\b/i,
    skills:     /\b(skills|technical skills|technologies|competencies|tools|tech stack|core competencies)\b/i,
    projects:   /\b(projects|personal projects|side projects|portfolio|key projects|academic projects)\b/i,
  };

  // Detects 'Company | Role — 1.2 Years' or 'Company | Role — Jan 2021 - Present' patterns
  const COMPANY_ROLE_LINE = /^(.+?)\s*[|\u2014\u2013\-]{1,3}\s*(.+?)\s*[\u2014\-]{1,3}\s*(.+)$/;
  const DATE_RANGE = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|\d+\.?\d*\s*(?:year|yr|month|mo)s?)\s*[-–—to]*\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|now)?/i;
  const BULLET_LINE = /^[•\-\*\u2022●]\s*/;

  let currentSection = null;
  let buffer = [];

  const pushExperience = (buf) => {
    if (!buf.length) return;
    let role = '', company = '', startDate = '', endDate = '', descLines = [];

    for (const line of buf) {
      // Handle 'Company | Role — Duration' format (e.g. 'INNOVENT Tech | Junior MERN Stack Developer — 1.2 Years')
      const companyRoleMatch = line.match(COMPANY_ROLE_LINE);
      if (companyRoleMatch && !company) {
        company   = companyRoleMatch[1].trim();
        role      = companyRoleMatch[2].trim();
        const durStr = companyRoleMatch[3].trim();
        // Try to extract date range from duration string
        const dateMatch = durStr.match(DATE_RANGE);
        if (dateMatch) {
          startDate = dateMatch[1] || '';
          endDate   = dateMatch[2] || durStr;
        } else {
          endDate = durStr; // e.g. '1.2 Years'
        }
      } else {
        const dateMatch = line.match(DATE_RANGE);
        if (dateMatch && !startDate && !company) {
          startDate = dateMatch[1] || '';
          endDate   = dateMatch[2] || '';
        } else if (BULLET_LINE.test(line) || line.startsWith('●') || line.startsWith('•')) {
          descLines.push(line.replace(/^[•\-\*●\s]+/, '').trim());
        } else if (!role && !company && line.length > 2) {
          role = line;
        } else if (!company && line.length > 2) {
          company = line;
        }
      }
    }
    if (company || role) {
      resumeData.experience.push({
        company:   company || 'Unknown Company',
        role:      role    || 'Unknown Role',
        startDate, endDate,
        description: descLines.map(l => `• ${l}`).join('\n')
      });
    }
  };

  const pushEducation = (buf) => {
    if (!buf.length) return;
    let school = '', degree = '', fieldOfStudy = '', startDate = '', endDate = '';
    for (const line of buf) {
      // Lines containing year ranges are dates
      const dateMatch = line.match(/(\d{4})\s*[-–—]\s*(\d{4}|present)/i);
      if (dateMatch) {
        startDate = dateMatch[1]; endDate = dateMatch[2];
        continue;
      }
      // Lines containing university/college/school keywords = school name
      if (/\b(university|college|school|institute|academy|hajvery|iqra|lums|nust|fast|comsats|uet|pu|bahria)\b/i.test(line)) {
        school = line.replace(dateMatch?.[0] || '', '').trim();
      } else if (!degree && line.length > 3) {
        degree = line;
      } else if (degree && !fieldOfStudy && line.length > 3) {
        fieldOfStudy = line;
      }
    }
    // If school wasn't found by keyword, use second non-date line
    if (!school && buf.length > 1) {
      school = buf.find(l => !/(\d{4})/.test(l) && l !== degree) || '';
    }
    resumeData.education.push({ school, degree, fieldOfStudy, location: '', startDate, endDate, description: '' });
  };

  const pushProject = (buf) => {
    if (!buf.length) return;
    // First line = project title (strip URL if accidentally the title)
    const name = buf[0] || 'Unnamed Project';
    let url = '';
    const descLines = [];

    for (const line of buf.slice(1)) {
      // Extract URL
      const urlMatch = line.match(/https?:\/\/[^\s)>]+/);
      if (/^(URL:|https?:\/\/)/i.test(line) && urlMatch) {
        url = urlMatch[0].replace(/[.,;]+$/, '');
        continue;
      }
      // Skip empty bullets like standalone '●' or '•'
      if (/^[●•]\s*$/.test(line.trim())) continue;
      // Collect bullet lines (already joined by first pass)
      if (/^[●•\-\*\s]*[●•]/.test(line) || line.trim().startsWith('●') || line.trim().startsWith('•')) {
        const cleaned = line.replace(/^[●•\-\*\s]+/, '').trim();
        if (cleaned.length > 2) descLines.push(`• ${cleaned}`);
      }
    }

    resumeData.projects.push({ name: name.replace(/^(URL:|https?:\/\/\S+)/i, '').trim() || 'Project', description: descLines.join('\n'), url });
  };


  const flushBuffer = (section, buf) => {
    if (!buf.length) return;
    if (section === 'summary') {
      resumeData.summary = buf.join(' ').trim();
    } else if (section === 'skills') {
      resumeData.skills = buf.flatMap(l => l.split(/[|,;]/)).map(s => s.replace(/^[•\-\*\s]+/, '').trim()).filter(s => s.length > 1 && s.length < 40);
    } else if (section === 'experience') {
      // Split into individual jobs by detecting 'Company | Role — Duration' header lines
      const jobs = [[]];
      for (const line of buf) {
        if (line.match(COMPANY_ROLE_LINE) && jobs[jobs.length - 1].some(l => BULLET_LINE.test(l) || l.startsWith('●'))) {
          jobs.push([line]);
        } else {
          jobs[jobs.length - 1].push(line);
        }
      }
      jobs.filter(j => j.length > 0).forEach(pushExperience);
    } else if (section === 'education') {
      pushEducation(buf);
    } else if (section === 'projects') {
      // Strategy: join continuation lines to their preceding bullet,
      // split into projects when we see a project title after a URL marker.
      // A project title is a non-bullet line that contains '|' or is a short title-case phrase
      // AND appears right after a URL line or at the very start.

      const URL_LINE  = /^(https?:\/\/|URL:|●\s*$)/i;
      const PROJ_TITLE = (line) =>
        !BULLET_LINE.test(line) &&
        !URL_LINE.test(line) &&
        line.length > 5 && line.length < 120 &&
        (line.includes('|') || /^[A-Z][A-Za-z0-9\s\-&:.,'"]+$/.test(line));

      // First pass: join wrapped continuation lines to their preceding bullet
      const joined = [];
      for (const line of buf) {
        const isBullet = BULLET_LINE.test(line) || line.startsWith('●') || line.startsWith('•');
        const isUrl    = URL_LINE.test(line);
        const isTitle  = PROJ_TITLE(line);

        if (isBullet || isUrl || isTitle || joined.length === 0) {
          joined.push(line);
        } else {
          // Continuation of previous line — append to it
          const last = joined[joined.length - 1];
          const lastIsBullet = BULLET_LINE.test(last) || last.startsWith('●') || last.startsWith('•');
          if (lastIsBullet && last.trim() !== '●' && last.trim() !== '•') {
            joined[joined.length - 1] = last + ' ' + line;
          } else {
            joined.push(line);
          }
        }
      }

      // Second pass: split into individual projects
      // A new project starts when we see a title line that comes after a URL or at start
      const projs = [[]];
      let lastWasUrl = false;

      for (const line of joined) {
        const isBullet = BULLET_LINE.test(line) || line.startsWith('●') || line.startsWith('•');
        const isUrl    = URL_LINE.test(line);
        const isTitle  = PROJ_TITLE(line);

        if (isTitle && (lastWasUrl || projs[projs.length - 1].length === 0)) {
          if (projs[projs.length - 1].length > 0) projs.push([]);
          projs[projs.length - 1].push(line);
          lastWasUrl = false;
        } else if (isUrl) {
          // Store URL in current project but mark boundary
          projs[projs.length - 1].push(line);
          lastWasUrl = true;
        } else if (isTitle && projs[projs.length - 1].length === 0) {
          projs[projs.length - 1].push(line);
          lastWasUrl = false;
        } else {
          projs[projs.length - 1].push(line);
          if (!isUrl) lastWasUrl = false;
        }
      }

      projs.filter(p => p.length > 0).forEach(pushProject);
    }

  };

  for (const line of lines) {
    let matched = null;
    // Check if the entire line (after stripping non-alpha) matches a section header keyword
    const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').trim();
    // Only treat as a section header if the line is short (< 50 chars) and matches
    if (cleanLine.length > 0 && cleanLine.length < 50) {
      for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
        if (pattern.test(cleanLine)) {
          matched = key;
          break;
        }
      }
    }
    if (matched) {
      flushBuffer(currentSection, buffer);
      currentSection = matched;
      buffer = [];
    } else {
      buffer.push(line);
    }
  }
  flushBuffer(currentSection, buffer);

  return resumeData;
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

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'Could not extract text from this PDF. It may be image-based or encrypted.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      console.log('[Server] Attempting parsing with Gemini API...');
      try {
        const extractedData = await parseWithGemini(text, apiKey);
        console.log('[Server] Gemini successfully parsed PDF!');
        return res.json({ success: true, text, extractedData, method: 'gemini' });
      } catch (geminiError) {
        console.error('[Server] Gemini parsing failed, falling back to heuristics:', geminiError.message);
      }
    }

    // Heuristic Fallback
    console.log('[Server] Using improved heuristics fallback for parsing...');
    const extractedData = heuristicParse(text);

    res.json({ success: true, text, extractedData, method: 'heuristic' });
  } catch (error) {
    console.error('PDF parsing error:', error);
    res.status(500).json({ error: 'Failed to parse resume PDF. ' + error.message });
  }
};

/**
 * Endpoint: Get all saved resumes
 */
export const getResumes = async (req, res) => {
  try {
    const userResumes = await Resume.find({ userId: req.userId }).sort({ updatedAt: -1 });
    // Map _id to id for client convenience
    const mapped = userResumes.map(r => ({
      id: r._id,
      title: r.title,
      data: r.data,
      updatedAt: r.updatedAt
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve resumes. ' + error.message });
  }
};

/**
 * Endpoint: Save / update a resume
 */
export const saveResume = async (req, res) => {
  try {
    const { id, title, data } = req.body;
    
    if (!title || !data) {
      return res.status(400).json({ error: 'Title and data are required.' });
    }

    let resume;
    if (id) {
      resume = await Resume.findById(id);
      if (!resume) {
        return res.status(404).json({ error: 'Resume not found.' });
      }
      if (resume.userId.toString() !== req.userId) {
        return res.status(403).json({ error: 'Unauthorized to modify this resume.' });
      }
      resume.title = title;
      resume.data = data;
      resume.updatedAt = new Date();
    } else {
      resume = new Resume({
        userId: req.userId,
        title,
        data
      });
    }

    await resume.save();
    
    res.json({
      success: true,
      resume: {
        id: resume._id,
        title: resume.title,
        data: resume.data,
        updatedAt: resume.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save resume. ' + error.message });
  }
};

/**
 * Endpoint: Delete a resume
 */
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    if (resume.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this resume.' });
    }

    await Resume.findByIdAndDelete(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete resume. ' + error.message });
  }
};

/**
 * ATS Resume Score Engine — powered by Gemini 2.5 Flash
 * Scores a resume against a specific job description on 5 dimensions
 */
export const scoreResumeATS = async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return res.status(400).json({ error: 'Gemini API Key is not configured on the server.' });
  }
  if (!resumeText || resumeText.trim() === '') {
    return res.status(400).json({ error: 'Resume text is required.' });
  }
  if (!jobDescription || jobDescription.trim() === '') {
    return res.status(400).json({ error: 'Job description is required to score against.' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
You are a world-class Applicant Tracking System (ATS) and resume coach. Analyze the candidate's resume against the target job description.

Candidate Resume:
"""
${resumeText}
"""

Target Job Description:
"""
${jobDescription}
"""

Task — Evaluate the resume on 5 dimensions and return a structured JSON report:

1. **overallScore** (0–100): Holistic ATS compatibility score.
2. **keywordMatchPercent** (0–100): Percentage of critical JD keywords/phrases found in resume.
3. **foundKeywords**: Array of important JD keywords that ARE present in the resume (max 12).
4. **missingKeywords**: Array of important JD keywords that are MISSING from the resume (max 10).
5. **sectionScores**: Object with scores (0–100) for: summary, experience, skills, education, formatting.
6. **fixes**: Array of 4–6 specific, actionable suggestions to improve the resume for this JD (be precise, e.g. "Add 'Kubernetes' to your skills section — it appears 4x in the JD").
7. **verdict**: One of "Strong Match", "Moderate Match", or "Weak Match".

Return ONLY the JSON object. No markdown code blocks.

JSON Schema:
{
  "overallScore": 78,
  "keywordMatchPercent": 65,
  "verdict": "Moderate Match",
  "foundKeywords": ["React", "TypeScript", "REST APIs"],
  "missingKeywords": ["Kubernetes", "GraphQL", "CI/CD"],
  "sectionScores": {
    "summary": 80,
    "experience": 75,
    "skills": 70,
    "education": 90,
    "formatting": 85
  },
  "fixes": [
    "Add 'Kubernetes' and 'Docker' to your skills section — they appear 5 times in the JD.",
    "Quantify your impact in the TechCorp role — add metrics like team size, revenue, or % improvements.",
    "Your summary does not mention 'cloud infrastructure' which is a core JD requirement."
  ]
}
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
    }

    const resJson = await response.json();
    const textOutput = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) throw new Error('Empty Gemini response.');

    const result = JSON.parse(textOutput.trim());
    console.log('[Server] ATS Score generated:', result.overallScore);
    res.json(result);
  } catch (error) {
    console.error('ATS scoring failed:', error);
    res.status(500).json({ error: 'Failed to score resume: ' + error.message });
  }
};
