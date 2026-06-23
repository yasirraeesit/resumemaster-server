import { cleanAndTokenize, extractKeywords, TECH_KEYWORDS } from '../utils/keywordExtractor.js';

/**
 * Endpoint: Match job description against resume text and extract missing keywords
 */
export const matchJob = (req, res) => {
  const { resumeText, jobDescription, resumeSkills = [] } = req.body;

  if (!jobDescription) {
    return res.status(400).json({ error: 'Job description is required.' });
  }

  const fullResumeText = `${resumeText || ''} ${resumeSkills.join(' ')}`;

  // Extract keywords matching our tech keyword list
  const jdKeywords = extractKeywords(jobDescription, TECH_KEYWORDS);
  
  const wordsInJd = cleanAndTokenize(jobDescription);
  const uniqueWordsInJd = Array.from(new Set(wordsInJd));
  
  const matched = [];
  const missing = [];

  jdKeywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    const escapedKw = kwLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
    
    if (regex.test(fullResumeText)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });

  // Score calculation
  let score = 0;
  if (jdKeywords.length > 0) {
    score = Math.round((matched.length / jdKeywords.length) * 100);
  } else {
    const resumeTokens = new Set(cleanAndTokenize(fullResumeText));
    const jdTokens = uniqueWordsInJd.filter(w => w.length > 4);
    
    if (jdTokens.length > 0) {
      const matchCount = jdTokens.filter(t => resumeTokens.has(t)).length;
      score = Math.round((matchCount / jdTokens.length) * 100);
    } else {
      score = 100;
    }
  }

  // Pre-flight check / guidelines checks
  const auditItems = [];
  
  const wordCount = (resumeText || '').split(/\s+/).filter(Boolean).length;
  if (wordCount > 700) {
    auditItems.push({
      id: 'length',
      type: 'warning',
      message: `Resume word count is high (${wordCount} words). Try keeping it under 650 words for a standard single-page document.`
    });
  } else if (wordCount < 150 && wordCount > 0) {
    auditItems.push({
      id: 'length',
      type: 'warning',
      message: `Resume is extremely short (${wordCount} words). Add depth about your technical highlights.`
    });
  }

  const actionVerbs = ['developed', 'designed', 'managed', 'implemented', 'led', 'engineered', 'created', 'built', 'optimized', 'scalable', 'reduced', 'improved', 'increased', 'delivered'];
  const resumeVerbs = actionVerbs.filter(verb => new RegExp(`\\b${verb}`, 'i').test(fullResumeText));
  
  if (resumeVerbs.length < 4) {
    auditItems.push({
      id: 'verbs',
      type: 'warning',
      message: 'Add action verbs (e.g., Developed, Optimized, Engineered, Led) to frame your contributions in an impactful style.'
    });
  } else {
    auditItems.push({
      id: 'verbs',
      type: 'success',
      message: `Strong usage of professional action verbs (${resumeVerbs.join(', ')}).`
    });
  }

  const textLower = (resumeText || '').toLowerCase();
  const missingHeaders = [];
  if (!textLower.includes('experience') && !textLower.includes('history')) missingHeaders.push('Work Experience');
  if (!textLower.includes('education')) missingHeaders.push('Education');
  if (!textLower.includes('skills')) missingHeaders.push('Skills');

  if (missingHeaders.length > 0) {
    auditItems.push({
      id: 'headers',
      type: 'danger',
      message: 'Missing standard headings: ' + missingHeaders.join(', ') + '. ATS parsers rely on traditional headers to segment data.'
    });
  } else {
    auditItems.push({
      id: 'headers',
      type: 'success',
      message: 'Standard structural headings are present.'
    });
  }

  const contactAlerts = [];
  if (!textLower.includes('@')) contactAlerts.push('Email');
  if (!textLower.match(/linkedin\.com/)) contactAlerts.push('LinkedIn Profile');
  
  if (contactAlerts.length > 0) {
    auditItems.push({
      id: 'contact',
      type: 'warning',
      message: 'Missing critical contact links: ' + contactAlerts.join(', ') + '. Recruiters need standard contact points.'
    });
  } else {
    auditItems.push({
      id: 'contact',
      type: 'success',
      message: 'Standard communication contacts found.'
    });
  }

  res.json({
    score: Math.min(score, 100),
    matchedKeywords: matched,
    missingKeywords: missing,
    auditItems: auditItems
  });
};
