// @ts-check
/**
 * X (Twitter) profile scraper
 * Prairie Card スクレイピングの仕組みを流用したWebスクレイピング実装
 */

/**
 * Extract value using regex pattern
 * @param {string} html - HTML content
 * @param {RegExp|string} pattern - Regex pattern
 * @returns {string|null}
 */
function extractByPattern(html, pattern) {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  const match = html.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract multiple values using regex pattern
 * @param {string} html - HTML content
 * @param {RegExp|string} pattern - Regex pattern
 * @returns {string[]}
 */
function extractAllByPattern(html, pattern) {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : pattern;
  const matches = html.match(regex) || [];
  return matches;
}

/**
 * Scrape X profile page
 * @param {string} username - X username without @ symbol
 * @param {Object} env - Environment object with logger
 * @returns {Promise<Object>} Scraped profile data
 */
export async function scrapeXProfile(username, env) {
  const logger = env?.logger || console;

  try {
    const response = await fetch(`https://x.com/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`User @${username} not found`);
      }
      throw new Error(`Failed to fetch profile: HTTP ${response.status}`);
    }

    const html = await response.text();

    // Check if account is suspended or doesn't exist
    if (html.includes('account has been suspended') || html.includes('This account doesn't exist')) {
      throw new Error(`Account @${username} is suspended or does not exist`);
    }

    // Try to extract JSON-LD data first (more reliable)
    let profileData = extractFromJsonLd(html);

    // Fallback to regex extraction if JSON-LD fails
    if (!profileData.name) {
      profileData = extractFromHtml(html);
    }

    // Extract recent tweets
    const tweets = extractTweetsFromHtml(html);

    logger.info(`[X Scraper] Successfully scraped profile for @${username}`, {
      hasName: !!profileData.name,
      tweetsCount: tweets.length,
      followers: profileData.followers
    });

    return { ...profileData, tweets };
  } catch (error) {
    logger.error(`[X Scraper] Error scraping @${username}:`, error);
    throw error;
  }
}

/**
 * Extract profile data from JSON-LD structured data
 * @param {string} html - HTML content
 * @returns {Object}
 */
function extractFromJsonLd(html) {
  const profileData = {};

  // Look for JSON-LD script tag
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>({[^<]+})<\/script>/);

  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);

      if (jsonData['@type'] === 'Person' || jsonData['@type'] === 'ProfilePage') {
        profileData.name = jsonData.name || jsonData.author?.name;
        profileData.bio = jsonData.description;
        profileData.avatar = jsonData.image?.url || jsonData.image;
        profileData.url = jsonData.url;
      }
    } catch (e) {
      // JSON-LD parsing failed, will fallback to regex
    }
  }

  return profileData;
}

/**
 * Extract profile data using regex patterns
 * @param {string} html - HTML content
 * @returns {Object}
 */
function extractFromHtml(html) {
  return {
    name: extractByPattern(html, /"name":"([^"]+)"/),
    bio: extractByPattern(html, /"description":"([^"]+)"/),
    location: extractByPattern(html, /"location":"([^"]+)"/),
    website: extractByPattern(html, /"url":"([^"]+)"/),
    avatar: extractByPattern(html, /"profile_image_url_https":"([^"]+)"/) ||
            extractByPattern(html, /property="og:image" content="([^"]+)"/),
    banner: extractByPattern(html, /"profile_banner_url":"([^"]+)"/),
    verified: html.includes('"verified":true') || html.includes('verified-badge'),
    protected: html.includes('"protected":true'),
    followers: parseInt(extractByPattern(html, /"followers_count":(\d+)/) || '0'),
    following: parseInt(extractByPattern(html, /"friends_count":(\d+)/) || '0'),
    tweets: parseInt(extractByPattern(html, /"statuses_count":(\d+)/) || '0'),
    listed: parseInt(extractByPattern(html, /"listed_count":(\d+)/) || '0'),
    created_at: extractByPattern(html, /"created_at":"([^"]+)"/)
  };
}

/**
 * Extract recent tweets from HTML
 * @param {string} html - HTML content
 * @returns {Array}
 */
function extractTweetsFromHtml(html) {
  const tweets = [];

  // Try multiple patterns to extract tweet text
  const tweetPatterns = [
    /<div[^>]*data-testid="tweetText"[^>]*>([^<]+)</g,
    /<span[^>]*>([^<]{20,})<\/span>/g, // Longer text spans likely to be tweets
    /"full_text":"([^"]+)"/g
  ];

  for (const pattern of tweetPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      for (const match of matches.slice(0, 10)) { // Get up to 10 tweets
        const text = match.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim();
        if (text && text.length > 20) { // Filter out short snippets
          tweets.push({
            text: text.substring(0, 280), // Limit to tweet length
            // Attempt to extract metrics if available
            metrics: {
              likes: parseInt(extractByPattern(match, /"favorite_count":(\d+)/) || '0'),
              retweets: parseInt(extractByPattern(match, /"retweet_count":(\d+)/) || '0'),
              replies: parseInt(extractByPattern(match, /"reply_count":(\d+)/) || '0')
            }
          });
        }
      }
      if (tweets.length > 0) break;
    }
  }

  return tweets;
}

/**
 * Extract topics and hashtags from tweets
 * @param {Array} tweets - Array of tweet objects
 * @returns {Object} Topics and hashtags
 */
export function extractTopicsFromTweets(tweets) {
  const hashtags = new Set();
  const topics = new Set();
  const techKeywords = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'node', 'python',
    'golang', 'rust', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'devops',
    'cicd', 'api', 'database', 'sql', 'nosql', 'mongodb', 'postgresql',
    'redis', 'graphql', 'rest', 'microservices', 'serverless', 'cloud',
    'frontend', 'backend', 'fullstack', 'mobile', 'ios', 'android', 'flutter'
  ];

  for (const tweet of tweets) {
    if (!tweet.text) continue;

    // Extract hashtags
    const hashtagMatches = tweet.text.match(/#\w+/g) || [];
    hashtagMatches.forEach(tag => hashtags.add(tag.toLowerCase()));

    // Extract tech topics
    const lowerText = tweet.text.toLowerCase();
    for (const keyword of techKeywords) {
      if (lowerText.includes(keyword)) {
        topics.add(keyword);
      }
    }
  }

  return {
    hashtags: Array.from(hashtags).slice(0, 20),
    topics: Array.from(topics).slice(0, 20)
  };
}