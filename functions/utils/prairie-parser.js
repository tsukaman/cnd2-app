/**
 * Prairie Card Parser for Cloudflare Functions
 * Simplified version without cheerio (using regex for Edge Runtime compatibility)
 */

/**
 * Extract text content from HTML using regex
 * @param {string} html - HTML content
 * @param {string} selector - CSS selector pattern
 * @returns {string} - Extracted text
 */
function extractTextByClass(html, className) {
  // Match various HTML patterns with the given class
  const patterns = [
    new RegExp(`<[^>]+class="[^"]*${className}[^"]*"[^>]*>([^<]+)<`, 'i'),
    new RegExp(`<[^>]+class='[^']*${className}[^']*'[^>]*>([^<]+)<`, 'i'),
    new RegExp(`<${className}[^>]*>([^<]+)</${className}>`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

/**
 * Extract array of items from HTML
 * @param {string} html - HTML content
 * @param {string} className - Class name to search for
 * @returns {string[]} - Array of extracted items
 */
function extractArrayByClass(html, className) {
  const items = [];
  const pattern = new RegExp(`<[^>]+class="[^"]*${className}[^"]*"[^>]*>([^<]+)<`, 'gi');
  const matches = html.matchAll(pattern);
  
  for (const match of matches) {
    if (match[1]) {
      items.push(match[1].trim());
    }
  }
  
  // Also try data-field pattern
  const dataPattern = new RegExp(`data-field="${className}"[^>]*>([^<]+)<`, 'gi');
  const dataMatches = html.matchAll(dataPattern);
  
  for (const match of dataMatches) {
    if (match[1]) {
      items.push(match[1].trim());
    }
  }
  
  return [...new Set(items)]; // Remove duplicates
}

/**
 * Extract social media URL
 * @param {string} html - HTML content
 * @param {string} domain - Domain to search for
 * @returns {string|undefined} - URL if found
 */
function extractSocialUrl(html, domain) {
  const pattern = new RegExp(`https?://(?:www\\.)?${domain.replace('.', '\\.')}[^"'\\s>]+`, 'i');
  const match = html.match(pattern);
  return match ? match[0] : undefined;
}

/**
 * Extract link by class or text
 * @param {string} html - HTML content
 * @param {string} identifier - Class or text to identify the link
 * @returns {string|undefined} - URL if found
 */
function extractLink(html, identifier) {
  // Try to find href with the identifier nearby
  const pattern = new RegExp(`href="([^"]+)"[^>]*>[^<]*${identifier}|${identifier}[^<]*<[^>]*href="([^"]+)"`, 'i');
  const match = html.match(pattern);
  return match ? (match[1] || match[2]) : undefined;
}

/**
 * Escape HTML for security
 * @param {string} unsafe - Unsafe string
 * @returns {string} - Escaped string
 */
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Parse Prairie Card HTML into profile structure
 * @param {string} html - Prairie Card HTML content
 * @returns {Object} - Parsed profile object
 */
function parseFromHTML(html) {
  // Extract basic information
  const name = extractTextByClass(html, 'profile-name') || 
               extractTextByClass(html, 'name') ||
               html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ||
               'CloudNative Enthusiast';
               
  const title = extractTextByClass(html, 'title') ||
                extractTextByClass(html, 'role') ||
                extractTextByClass(html, 'job-title') ||
                '';
                
  const company = extractTextByClass(html, 'company') ||
                  extractTextByClass(html, 'organization') ||
                  extractTextByClass(html, 'affiliation') ||
                  '';
                  
  const bio = extractTextByClass(html, 'bio') ||
              extractTextByClass(html, 'description') ||
              extractTextByClass(html, 'about') ||
              html.match(/<p[^>]*>([^<]{20,})<\/p>/i)?.[1]?.trim() ||
              '';
              
  // Extract skills and tags
  const skills = [
    ...extractArrayByClass(html, 'skill'),
    ...extractArrayByClass(html, 'skill-tag'),
    ...extractArrayByClass(html, 'skills'),
  ];
  
  const tags = [
    ...extractArrayByClass(html, 'tag'),
    ...extractArrayByClass(html, 'tags'),
    ...extractArrayByClass(html, 'keyword'),
  ];
  
  const interests = [
    ...extractArrayByClass(html, 'interest'),
    ...extractArrayByClass(html, 'interests'),
    ...extractArrayByClass(html, 'hobby'),
  ];
  
  const certifications = [
    ...extractArrayByClass(html, 'certification'),
    ...extractArrayByClass(html, 'certifications'),
    ...extractArrayByClass(html, 'cert'),
  ];
  
  const communities = [
    ...extractArrayByClass(html, 'community'),
    ...extractArrayByClass(html, 'communities'),
    ...extractArrayByClass(html, 'group'),
  ];
  
  // Extract social links
  const twitter = extractSocialUrl(html, 'twitter.com') || extractSocialUrl(html, 'x.com');
  const github = extractSocialUrl(html, 'github.com');
  const linkedin = extractSocialUrl(html, 'linkedin.com');
  const facebook = extractSocialUrl(html, 'facebook.com');
  const website = extractLink(html, 'website') || extractLink(html, 'homepage');
  const blog = extractLink(html, 'blog');
  const qiita = extractSocialUrl(html, 'qiita.com');
  const zenn = extractSocialUrl(html, 'zenn.dev');
  
  // Build the profile object matching PrairieProfile type
  return {
    basic: {
      name: escapeHtml(name),
      title: escapeHtml(title),
      company: escapeHtml(company),
      bio: escapeHtml(bio),
      avatar: undefined, // Avatar extraction would require more complex parsing
    },
    details: {
      tags: tags.map(escapeHtml).filter(Boolean),
      skills: skills.map(escapeHtml).filter(Boolean),
      interests: interests.map(escapeHtml).filter(Boolean),
      certifications: certifications.map(escapeHtml).filter(Boolean),
      communities: communities.map(escapeHtml).filter(Boolean),
    },
    social: {
      twitter,
      github,
      linkedin,
      facebook,
      website,
      blog,
      qiita,
      zenn,
    },
    custom: {},
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      connectedBy: 'CND²',
      hashtag: '#cndw2025',
      isPartialData: false,
    },
  };
}

/**
 * Validate Prairie Card URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid Prairie Card URL
 */
function validatePrairieCardUrl(url) {
  try {
    const parsed = new URL(url);
    // Only allow prairie.cards domains
    const validHosts = ['prairie.cards', 'my.prairie.cards'];
    return validHosts.includes(parsed.hostname) || 
           parsed.hostname.endsWith('.prairie.cards');
  } catch {
    return false;
  }
}

module.exports = {
  parseFromHTML,
  validatePrairieCardUrl,
  escapeHtml,
};