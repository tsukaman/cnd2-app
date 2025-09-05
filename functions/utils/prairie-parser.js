/**
 * Prairie Card Parser for Cloudflare Functions
 * Simplified version without cheerio (using regex for Edge Runtime compatibility)
 */

// Constants for array limits and string lengths
const LIMITS = {
  SKILLS: 15,           // Maximum number of skills to extract
  TAGS: 15,             // Maximum number of tags to extract
  INTERESTS: 10,        // Maximum number of interests to extract
  CERTIFICATIONS: 10,   // Maximum number of certifications to extract
  COMMUNITIES: 10,      // Maximum number of communities to extract
  HASHTAGS: 10,         // Maximum number of hashtags to extract
  BIO_LENGTH: 500,      // Maximum bio length in characters
  COMPANY_LENGTH: 100,  // Maximum company name length in characters
  TITLE_LENGTH: 100,    // Maximum title length in characters
  META_TAG_LENGTH: 1000, // Maximum meta tag content length (ReDoS protection)
  META_ATTR_LENGTH: 500,  // Maximum meta tag attribute length (ReDoS protection)
  FETCH_TIMEOUT_MS: 5000 // Fetch timeout in milliseconds
};

/**
 * Extract text content from HTML using regex
 * @param {string} html - HTML content
 * @param {string} selector - CSS selector pattern
 * @returns {string} - Extracted text
 */
function extractTextByClass(html, className) {
  // Match various HTML patterns with the given class
  const escapedClassName = escapeRegExp(className);
  const patterns = [
    new RegExp(`<[^>]+class="[^"]*${escapedClassName}[^"]*"[^>]*>([^<]+)<`, 'i'),
    new RegExp(`<[^>]+class='[^']*${escapedClassName}[^']*'[^>]*>([^<]+)<`, 'i'),
    new RegExp(`<${escapedClassName}[^>]*>([^<]+)</${escapedClassName}>`, 'i'),
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
  const escapedClassName = escapeRegExp(className);
  
  // Pattern 1: class="className" or class="something className" or class="className something"
  const pattern = new RegExp(`<[^>]+class="[^"]*\\b${escapedClassName}\\b[^"]*"[^>]*>([^<]+)<`, 'gi');
  const matches = html.matchAll(pattern);
  
  for (const match of matches) {
    if (match[1]) {
      items.push(match[1].trim());
    }
  }
  
  // Pattern 2: class='className' (single quotes)
  const singleQuotePattern = new RegExp(`<[^>]+class='[^']*\\b${escapedClassName}\\b[^']*'[^>]*>([^<]+)<`, 'gi');
  const singleQuoteMatches = html.matchAll(singleQuotePattern);
  
  for (const match of singleQuoteMatches) {
    if (match[1]) {
      items.push(match[1].trim());
    }
  }
  
  // Pattern 3: data-field="className"
  const dataPattern = new RegExp(`data-field="${escapedClassName}"[^>]*>([^<]+)<`, 'gi');
  const dataMatches = html.matchAll(dataPattern);
  
  for (const match of dataMatches) {
    if (match[1]) {
      items.push(match[1].trim());
    }
  }
  
  return [...new Set(items)]; // Remove duplicates
}

/**
 * Extract hashtags from specific elements only (not from entire HTML)
 * @param {string} html - HTML content
 * @param {string[]} classNames - Array of class names to search within
 * @returns {string[]} - Array of extracted hashtags
 */
function extractHashtagsFromElements(html, classNames) {
  const hashtags = [];
  // Hashtag extraction pattern
  // Regex breakdown: /#([\w]{1,50}|[ぁ-んァ-ヶー]{1,20}|[一-龠]{1,20})/g
  //   #            - Literal hashtag symbol
  //   (...)        - Capture group for hashtag content
  //   [\w]{1,50}   - Alphanumeric characters (1-50 chars) for English hashtags
  //   |            - OR operator
  //   [ぁ-んァ-ヶー]{1,20} - Hiragana/Katakana (1-20 chars) for Japanese hashtags
  //   |            - OR operator
  //   [一-龠]{1,20} - Kanji characters (1-20 chars) for Japanese/Chinese hashtags
  //   g            - Global flag to find all matches
  const hashtagPattern = /#([\w]{1,50}|[ぁ-んァ-ヶー]{1,20}|[一-龠]{1,20})/g;
  
  // Extract content from specified elements
  for (const className of classNames) {
    const elements = extractArrayByClass(html, className);
    
    // Search for hashtags within these elements
    for (const element of elements) {
      const matches = element.matchAll(hashtagPattern);
      for (const match of matches) {
        const hashtag = '#' + match[1];
        if (!hashtags.includes(hashtag) && hashtags.length < LIMITS.HASHTAGS) {
          hashtags.push(hashtag);
        }
      }
    }
  }
  
  return hashtags;
}

/**
 * Extract social media URL
 * @param {string} html - HTML content
 * @param {string} domain - Domain to search for
 * @returns {string|undefined} - URL if found
 */
function extractSocialUrl(html, domain) {
  const escapedDomain = escapeRegExp(domain);
  const pattern = new RegExp(`https?://(?:www\\.)?${escapedDomain}[^"'\\s>]+`, 'i');
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
  const escapedIdentifier = escapeRegExp(identifier);
  const pattern = new RegExp(`href="([^"]+)"[^>]*>[^<]*${escapedIdentifier}|${escapedIdentifier}[^<]*<[^>]*href="([^"]+)"`, 'i');
  const match = html.match(pattern);
  return match ? (match[1] || match[2]) : undefined;
}

/**
 * Extract meta tag content
 * @param {string} html - HTML content
 * @param {string} property - Meta property name (e.g., 'og:title', 'description')
 * @returns {string|undefined} - Content value if found
 */
function extractMetaContent(html, property) {
  // Escape property for regex
  const escapedProperty = property.replace(/:/g, '\\:');
  
  // Try multiple patterns for meta tags (with length limits for ReDoS protection)
  const patterns = [
    // Pattern: <meta property="og:title" content="value">
    new RegExp(`<meta[^>]{0,${LIMITS.META_ATTR_LENGTH}}property=["']${escapedProperty}["'][^>]{0,${LIMITS.META_ATTR_LENGTH}}content=["']([^"']{1,${LIMITS.META_TAG_LENGTH}})["']`, 'i'),
    // Pattern: <meta content="value" property="og:title">
    new RegExp(`<meta[^>]{0,${LIMITS.META_ATTR_LENGTH}}content=["']([^"']{1,${LIMITS.META_TAG_LENGTH}})["'][^>]{0,${LIMITS.META_ATTR_LENGTH}}property=["']${escapedProperty}["']`, 'i'),
    // Pattern: <meta name="description" content="value">
    new RegExp(`<meta[^>]{0,${LIMITS.META_ATTR_LENGTH}}name=["']${property}["'][^>]{0,${LIMITS.META_ATTR_LENGTH}}content=["']([^"']{1,${LIMITS.META_TAG_LENGTH}})["']`, 'i'),
    // Pattern: <meta content="value" name="description">
    new RegExp(`<meta[^>]{0,${LIMITS.META_ATTR_LENGTH}}content=["']([^"']{1,${LIMITS.META_TAG_LENGTH}})["'][^>]{0,${LIMITS.META_ATTR_LENGTH}}name=["']${property}["']`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return undefined;
}

/**
 * Extract name from meta tags
 * @param {string} html - HTML content
 * @returns {string} - Extracted name or empty string
 */
function extractNameFromMeta(html, env) {
  const debugMode = env?.DEBUG_MODE === 'true';
  
  // Try multiple sources for name extraction
  const ogTitle = extractMetaContent(html, 'og:title');
  const twitterTitle = extractMetaContent(html, 'twitter:title');
  const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  
  if (debugMode) {
    console.log('[DEBUG] Name extraction sources:', {
      ogTitle,
      twitterTitle,
      titleTag
    });
  }
  
  const titleSource = ogTitle || twitterTitle || titleTag || '';
  
  // Extract name from various patterns
  // Pattern 1: "名前 のプロフィール" or "名前 の プロフィール"
  // Improved with stricter boundaries: limit name length and ensure end of string
  // Regex breakdown: /^(.{1,100}?)\s*の?\s*(?:プロフィール|Profile|Prairie Card)(?:\s|$)/i
  //   ^            - Start of string
  //   (.{1,100}?)  - Capture group: 1-100 characters (non-greedy) for the name
  //   \s*          - Optional whitespace
  //   の?          - Optional Japanese possessive particle
  //   \s*          - Optional whitespace
  //   (?:...)      - Non-capturing group for suffix keywords
  //   (?:\s|$)     - End with whitespace or end of string
  //   i            - Case insensitive flag
  const nameMatch = titleSource.match(/^(.{1,100}?)\s*の?\s*(?:プロフィール|Profile|Prairie Card)(?:\s|$)/i);
  if (nameMatch) {
    const extractedName = nameMatch[1].trim();
    if (debugMode) {
      console.log('[DEBUG] Name extracted with pattern 1:', extractedName);
    }
    return extractedName;
  }
  
  // Pattern 2: Remove " - Prairie Card" or " | Prairie Card" suffix
  if (titleSource) {
    let cleanName = titleSource.replace(/\s*[-–—|]\s*Prairie\s*Card.*$/i, '').trim();
    // Also remove just "Prairie Card" at the end
    cleanName = cleanName.replace(/\s*Prairie\s*Card\s*$/i, '').trim();
    if (cleanName) {
      if (debugMode) {
        console.log('[DEBUG] Name extracted with pattern 2:', cleanName);
      }
      return cleanName;
    }
  }
  
  if (debugMode) {
    console.log('[DEBUG] No name extracted from meta tags');
  }
  
  return '';
}

/**
 * Extract profile information from meta tags
 * @param {string} html - HTML content
 * @returns {Object} - Profile information (company, bio)
 */
function extractProfileFromMeta(html) {
  const description = extractMetaContent(html, 'og:description') || 
                     extractMetaContent(html, 'description') || '';
  
  const result = {};
  
  // Extract company from various patterns (with length limits for ReDoS protection)
  const companyPatterns = [
    // Pattern 1: @Company format checked first (higher priority)
    // Matches: @CompanyName | ... or @CompanyName (end of string)
    /@\s*([^。、\n|]{1,${LIMITS.COMPANY_LENGTH}}?)(?:\s*[|]|$)/,
    // Pattern 2: Japanese affiliation patterns
    // Matches: 所属：CompanyName, 勤務:CompanyName, 在籍：CompanyName
    /(?:所属|勤務|在籍)[：:]?\s*([^。、\n|]{1,${LIMITS.COMPANY_LENGTH}})/,
    // Pattern 3: Company with keywords (captures only the company name part)
    // Matches: at CompanyName Inc., @ CompanyName株式会社
    /(?:at |@ )?([\w\s]{1,30}(?:会社|Company|Corp|Inc|Ltd|株式会社)\.?)(?:\s*[|]|$)/
  ];
  
  for (const pattern of companyPatterns) {
    const match = description.match(pattern);
    if (match) {
      result.company = match[1].trim();
      break;
    }
  }
  
  // Use entire description as bio (up to BIO_LENGTH chars)
  if (description && description.length > 0) {
    result.bio = description.substring(0, LIMITS.BIO_LENGTH);
  }
  
  return result;
}

/**
 * Extract avatar from meta tags
 * @param {string} html - HTML content
 * @returns {string|undefined} - Avatar URL if found
 */
function extractAvatarFromMeta(html) {
  return extractMetaContent(html, 'og:image');
}

/**
 * Escape regular expression special characters
 * @param {string} string - String to escape
 * @returns {string} - Escaped string safe for regex
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * Extract text from data-field attribute
 * @param {string} html - HTML content
 * @param {string} fieldName - Field name to search for
 * @returns {string} - Extracted text
 */
function extractTextByDataField(html, fieldName) {
  const escapedFieldName = escapeRegExp(fieldName);
  const pattern = new RegExp(`<[^>]+data-field=["']${escapedFieldName}["'][^>]*>([^<]+)<`, 'i');
  const match = html.match(pattern);
  return match && match[1] ? match[1].trim() : '';
}

/**
 * Parse Prairie Card HTML into profile structure
 * @param {string} html - Prairie Card HTML content
 * @returns {Object} - Parsed profile object
 */
function parseFromHTML(html, env) {
  const debugMode = env?.DEBUG_MODE === 'true';
  
  // Handle null or undefined input
  if (!html) {
    html = '';
  }
  
  // Convert to string if not already
  html = String(html);
  
  if (debugMode) {
    console.log('[DEBUG] Prairie Parser - Starting HTML parsing...');
    console.log('[DEBUG] HTML length:', html.length);
    console.log('[DEBUG] HTML sample (first 500 chars):', html.substring(0, 500));
  }
  
  // Extract information from meta tags first
  const metaName = extractNameFromMeta(html, env);
  const metaProfile = extractProfileFromMeta(html);
  const metaAvatar = extractAvatarFromMeta(html);
  
  // Extract basic information with multiple fallbacks
  const nameCandidates = {
    'profile-name': extractTextByClass(html, 'profile-name'),
    'name': extractTextByClass(html, 'name'),
    'data-name': extractTextByDataField(html, 'name'),
    'user-name': extractTextByClass(html, 'user-name'),
    'display-name': extractTextByClass(html, 'display-name'),
    'h1': html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim(),
    'h2-name': html.match(/<h2[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)</i)?.[1]?.trim(),
    'meta': metaName
  };
  
  if (debugMode) {
    console.log('[DEBUG] Name extraction candidates:', nameCandidates);
  }
  
  const name = nameCandidates['profile-name'] || 
               nameCandidates['name'] ||
               nameCandidates['data-name'] ||
               nameCandidates['user-name'] ||
               nameCandidates['display-name'] ||
               nameCandidates['h1'] ||
               nameCandidates['h2-name'] ||
               nameCandidates['meta'] ||
               '';
               
  const title = extractTextByClass(html, 'title') ||
                extractTextByClass(html, 'role') ||
                extractTextByClass(html, 'job-title') ||
                extractTextByClass(html, 'position') ||
                extractTextByDataField(html, 'title') ||
                extractTextByDataField(html, 'role') ||
                '';
                
  const company = extractTextByClass(html, 'company') ||
                  extractTextByClass(html, 'organization') ||
                  extractTextByClass(html, 'affiliation') ||
                  extractTextByClass(html, 'workplace') ||
                  extractTextByDataField(html, 'company') ||
                  extractTextByDataField(html, 'organization') ||
                  metaProfile.company ||
                  '';
                  
  const bioCandidate = extractTextByClass(html, 'bio') ||
                       extractTextByClass(html, 'description') ||
                       extractTextByClass(html, 'about') ||
                       extractTextByClass(html, 'introduction') ||
                       extractTextByClass(html, 'profile-text') ||
                       extractTextByDataField(html, 'bio') ||
                       extractTextByDataField(html, 'about') ||
                       metaProfile.bio ||
                       '';
  
  // Limit bio length to BIO_LENGTH
  const bio = bioCandidate ? bioCandidate.substring(0, LIMITS.BIO_LENGTH) : '';
              
  // Extract skills and tags with enhanced patterns
  const skills = [
    ...extractArrayByClass(html, 'skill'),
    ...extractArrayByClass(html, 'skill-tag'),
    ...extractArrayByClass(html, 'skills'),
    ...extractArrayByClass(html, 'tech'),
    ...extractArrayByClass(html, 'technology'),
  ];
  
  // Note: Removed automatic tech keyword extraction as it was causing false positives
  // Skills should only come from explicitly marked elements in the HTML
  
  const tags = [
    ...extractArrayByClass(html, 'tag'),
    ...extractArrayByClass(html, 'tags'),
    ...extractArrayByClass(html, 'keyword'),
    ...extractArrayByClass(html, 'label'),
    ...extractArrayByClass(html, 'badge'),
  ];
  
  // Extract hashtags ONLY from explicit hashtag-related elements
  // This prevents false positives from general HTML content
  const hashtagElements = ['hashtag', 'hashtags', 'tag', 'tags', 'keyword', 'keywords'];
  const extractedHashtags = extractHashtagsFromElements(html, hashtagElements);
  
  // Merge hashtags with existing tags (avoiding duplicates)
  for (const hashtag of extractedHashtags) {
    if (!tags.includes(hashtag)) {
      tags.push(hashtag);
    }
  }
  
  const interests = [
    ...extractArrayByClass(html, 'interest'),
    ...extractArrayByClass(html, 'interests'),
    ...extractArrayByClass(html, 'hobby'),
    ...extractArrayByClass(html, 'hobbies'),
    ...extractArrayByClass(html, 'like'),
  ];
  
  const certifications = [
    ...extractArrayByClass(html, 'certification'),
    ...extractArrayByClass(html, 'certifications'),
    ...extractArrayByClass(html, 'cert'),
    ...extractArrayByClass(html, 'certificate'),
    ...extractArrayByClass(html, 'qualification'),
  ];
  
  const communities = [
    ...extractArrayByClass(html, 'community'),
    ...extractArrayByClass(html, 'communities'),
    ...extractArrayByClass(html, 'group'),
    ...extractArrayByClass(html, 'organization'),
    ...extractArrayByClass(html, 'meetup'),
  ];
  
  // Extract motto
  const motto = extractTextByClass(html, 'motto') ||
                extractTextByClass(html, 'slogan') ||
                extractTextByClass(html, 'catchphrase') ||
                extractTextByDataField(html, 'motto') ||
                undefined;
  
  // Extract social links
  const twitter = extractSocialUrl(html, 'twitter.com') || extractSocialUrl(html, 'x.com');
  const github = extractSocialUrl(html, 'github.com');
  const linkedin = extractSocialUrl(html, 'linkedin.com');
  const facebook = extractSocialUrl(html, 'facebook.com');
  const website = extractLink(html, 'website') || extractLink(html, 'homepage') || extractLink(html, 'portfolio');
  const blog = extractLink(html, 'blog');
  const qiita = extractSocialUrl(html, 'qiita.com');
  const zenn = extractSocialUrl(html, 'zenn.dev');
  
  // Remove duplicates and limit arrays
  const uniqueSkills = [...new Set(skills)].slice(0, LIMITS.SKILLS);
  const uniqueTags = [...new Set(tags)].slice(0, LIMITS.TAGS);
  const uniqueInterests = [...new Set(interests)].slice(0, LIMITS.INTERESTS);
  const uniqueCertifications = [...new Set(certifications)].slice(0, LIMITS.CERTIFICATIONS);
  const uniqueCommunities = [...new Set(communities)].slice(0, LIMITS.COMMUNITIES);
  
  // Build the profile object matching PrairieProfile type
  // IMPORTANT: HTML Escaping Strategy
  // We DO NOT escape HTML in this parser for the following reasons:
  // 1. The frontend components use DOMPurify for sanitization
  // 2. Double-escaping would cause display issues (e.g., "&amp;lt;" instead of "<")
  // 3. The extracted text from HTML is already plain text (tags removed)
  // 4. The escapeHtml() function is available for specific use cases if needed
  // Security Note: Always ensure the frontend properly sanitizes before rendering
  const profile = {
    basic: {
      name: name || '名前未設定',  // Use Japanese default as fallback
      title: title || '',
      company: company || '',
      bio: bio || '',
      avatar: metaAvatar || undefined,
    },
    details: {
      tags: uniqueTags.filter(Boolean),
      skills: uniqueSkills.filter(Boolean),
      interests: uniqueInterests.filter(Boolean),
      certifications: uniqueCertifications.filter(Boolean),
      communities: uniqueCommunities.filter(Boolean),
      motto: motto || undefined,
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
  
  if (debugMode) {
    console.log('[DEBUG] Final profile structure:', {
      basic: {
        name: profile.basic.name,
        title: profile.basic.title,
        company: profile.basic.company,
        bio: profile.basic.bio ? profile.basic.bio.substring(0, 100) + '...' : undefined,
        hasAvatar: !!profile.basic.avatar
      },
      details: {
        skills: profile.details.skills,
        interests: profile.details.interests,
        tags: profile.details.tags,
        motto: profile.details.motto
      },
      social: Object.keys(profile.social).filter(key => profile.social[key]).length + ' links found'
    });
  } else {
    console.log('[Prairie Parser] Parsed profile:', {
      name: profile.basic.name,
      hasSkills: profile.details.skills.length > 0,
      hasTags: profile.details.tags.length > 0,
      hasInterests: profile.details.interests.length > 0,
    });
  }
  
  return profile;
}

/**
 * Validate Prairie Card URL
 * Accepted formats:
 * - https://my.prairie.cards/u/{username}
 * - https://my.prairie.cards/cards/{uuid}
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid Prairie Card URL
 */
function validatePrairieCardUrl(url) {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS protocol (security requirement)
    if (parsed.protocol !== 'https:') {
      return false;
    }
    
    // Only allow my.prairie.cards domain to avoid server load
    if (parsed.hostname !== 'my.prairie.cards') {
      return false;
    }
    
    // Check for valid path patterns
    // /u/{username} - ユーザー名にはアルファベット、数字、ドット、アンダースコア、ハイフンを許可
    // /cards/{uuid} - UUID形式
    const pathPattern = /^\/(?:u\/[a-zA-Z0-9._-]+|cards\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/;
    return pathPattern.test(parsed.pathname);
  } catch {
    return false;
  }
}

export {
  parseFromHTML,
  validatePrairieCardUrl,
  escapeHtml,
  escapeRegExp,
};