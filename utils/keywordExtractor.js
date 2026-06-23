// Preset list of standard keywords/skills for analysis
export const TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'sql', 'nosql', 'html', 'css',
  'react', 'angular', 'vue', 'next.js', 'nuxt', 'express', 'nest.js', 'django', 'flask', 'fastapi', 'spring boot', 'laravel',
  'node.js', 'node', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'github actions', 'terraform', 'jenkins',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'git', 'github', 'jira', 'figma', 'agile', 'scrum',
  'rest api', 'graphql', 'microservices', 'system design', 'machine learning', 'data science', 'ai', 'devops',
  'product management', 'project management', 'ui/ux', 'unit testing', 'jest', 'cypress', 'redux', 'tailwind'
];

/**
 * Clean and split text into tokens
 * @param {string} text 
 * @returns {string[]}
 */
export function cleanAndTokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s\-\.\#\+]/g, ' ') // Keep alphanumeric, space, hyphens, dots, hash, plus (C++, C#, .NET)
    .split(/\s+/)
    .filter(token => token.length > 1);
}

/**
 * Extract keywords present in text based on a checklist dictionary
 * @param {string} text 
 * @param {string[]} targetKeywords 
 * @returns {string[]}
 */
export function extractKeywords(text, targetKeywords = TECH_KEYWORDS) {
  const found = new Set();
  
  targetKeywords.forEach(keyword => {
    const kwLower = keyword.toLowerCase();
    const escapedKw = kwLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
    if (regex.test(text)) {
      found.add(keyword);
    }
  });

  return Array.from(found);
}
