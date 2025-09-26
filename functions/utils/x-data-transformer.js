// @ts-check
/**
 * Transform X data from various sources into XProfile format
 */

import { extractTopicsFromTweets } from './x-scraper.js';

/**
 * Transform embed API and scraped data into XProfile format
 * @param {string} username - X username
 * @param {Object|null} embedData - Data from X embed API
 * @param {Object|null} scrapedData - Data from web scraping
 * @returns {Object} XProfile formatted data
 */
export function transformToXProfile(username, embedData, scrapedData) {
  // Merge data with fallbacks
  const name = embedData?.author_name || scrapedData?.name || username;
  const bio = scrapedData?.bio || '';
  const tweets = scrapedData?.tweets || [];
  const { hashtags, topics } = extractTopicsFromTweets(tweets);

  // Calculate active hours from tweet timestamps (mock implementation)
  const activeHours = calculateActiveHours(tweets);

  // Infer tech stack from bio and tweets
  const techStack = inferTechStack(bio, tweets);

  const xProfile = {
    basic: {
      id: scrapedData?.id,
      username: username,
      name: name,
      bio: bio,
      location: scrapedData?.location,
      website: scrapedData?.website,
      avatar: scrapedData?.avatar,
      banner: scrapedData?.banner,
      verified: scrapedData?.verified || false,
      protected: scrapedData?.protected || false,
      createdAt: scrapedData?.created_at
    },
    metrics: {
      followers: scrapedData?.followers || 0,
      following: scrapedData?.following || 0,
      tweets: scrapedData?.tweets || 0,
      listed: scrapedData?.listed || 0
    },
    details: {
      recentTweets: tweets.map((tweet, index) => ({
        id: `tweet_${index}`,
        text: tweet.text || '',
        createdAt: tweet.created_at || new Date().toISOString(),
        metrics: tweet.metrics || {
          likes: 0,
          retweets: 0,
          replies: 0
        }
      })),
      topics: topics,
      hashtags: hashtags,
      mentionedUsers: extractMentionedUsers(tweets),
      languages: detectLanguages(tweets),
      activeHours: activeHours
    },
    analysis: {
      techStack: techStack,
      interests: [...topics, ...hashtags.filter(h => !h.startsWith('#')).slice(0, 5)],
      personality: analyzePersonality(tweets)
    },
    metadata: {
      fetchedAt: new Date().toISOString(),
      cacheAge: calculateDynamicCacheAge(embedData, scrapedData),
      embedAvailable: !!embedData,
      scrapingAvailable: !!scrapedData
    }
  };

  return xProfile;
}

/**
 * Calculate dynamic cache age based on profile data
 * @param {Object} embedData - oEmbed API data
 * @param {Object} scrapedData - Scraped profile data
 * @returns {number} Cache age in seconds
 */
function calculateDynamicCacheAge(embedData, scrapedData) {
  // Base cache age from embed API or default
  const baseCacheAge = embedData?.cache_age || 3600;

  // Verified accounts get longer cache (more stable)
  const isVerified = embedData?.author_verified || scrapedData?.verified;
  const verifiedMultiplier = isVerified ? 2 : 1;

  // High follower count profiles get longer cache (less likely to change frequently)
  const followers = scrapedData?.followers || embedData?.author_followers || 0;
  const followerMultiplier = followers > 100000 ? 1.5 : 1;

  // Calculate final cache age with min/max bounds
  const dynamicCacheAge = baseCacheAge * verifiedMultiplier * followerMultiplier;

  // Ensure cache is between 5 minutes (300s) and 24 hours (86400s)
  return Math.max(300, Math.min(dynamicCacheAge, 86400));
}

/**
 * Calculate active hours from tweets
 * @param {Array} tweets - Array of tweets
 * @returns {number[]} Array of hours (0-23) when user is most active
 */
function calculateActiveHours(tweets) {
  // Mock implementation - would need actual tweet timestamps
  // Return common working hours for now
  return [9, 10, 11, 14, 15, 16, 17, 18];
}

/**
 * Infer tech stack from bio and tweets
 * @param {string} bio - User bio
 * @param {Array} tweets - User tweets
 * @returns {string[]} Inferred tech stack
 */
function inferTechStack(bio, tweets) {
  const techStack = new Set();
  const content = bio + ' ' + tweets.map(t => t.text || '').join(' ');
  const lowerContent = content.toLowerCase();

  const techPatterns = {
    'JavaScript': /javascript|js|node\.?js|typescript|ts/i,
    'React': /react|redux|next\.?js/i,
    'Vue': /vue|nuxt/i,
    'Python': /python|django|flask|fastapi/i,
    'Go': /golang|go lang|\bgo\b/i,
    'Rust': /rust|cargo/i,
    'Docker': /docker|container|kubernetes|k8s/i,
    'AWS': /aws|amazon web|ec2|s3|lambda/i,
    'GCP': /gcp|google cloud|firebase/i,
    'Database': /sql|postgres|mysql|mongodb|redis/i,
    'DevOps': /devops|ci\/cd|jenkins|github actions/i
  };

  for (const [tech, pattern] of Object.entries(techPatterns)) {
    if (pattern.test(content)) {
      techStack.add(tech);
    }
  }

  return Array.from(techStack);
}

/**
 * Extract mentioned users from tweets
 * @param {Array} tweets - Array of tweets
 * @returns {string[]} Array of mentioned usernames
 */
function extractMentionedUsers(tweets) {
  const mentions = new Set();

  for (const tweet of tweets) {
    if (!tweet.text) continue;
    const mentionMatches = tweet.text.match(/@\w+/g) || [];
    mentionMatches.forEach(mention => mentions.add(mention.substring(1)));
  }

  return Array.from(mentions).slice(0, 10);
}

/**
 * Detect languages from tweet content
 * @param {Array} tweets - Array of tweets
 * @returns {string[]} Detected languages
 */
function detectLanguages(tweets) {
  const languages = new Set();

  for (const tweet of tweets) {
    if (!tweet.text) continue;

    // Simple language detection based on character patterns
    if (/[あ-ん]/.test(tweet.text)) {
      languages.add('ja'); // Japanese
    }
    if (/[一-龯]/.test(tweet.text)) {
      languages.add('zh'); // Chinese
    }
    if (/[가-힣]/.test(tweet.text)) {
      languages.add('ko'); // Korean
    }
    if (/[a-zA-Z]{3,}/.test(tweet.text)) {
      languages.add('en'); // English
    }
  }

  return Array.from(languages);
}

/**
 * Analyze personality from tweets
 * @param {Array} tweets - Array of tweets
 * @returns {string} Personality description
 */
function analyzePersonality(tweets) {
  if (tweets.length === 0) return 'プロフィール分析中';

  const tweetTexts = tweets.map(t => t.text || '').join(' ');

  // Simple personality analysis based on patterns
  const patterns = {
    technical: /code|programming|debug|implement|develop|build/i,
    collaborative: /team|together|collaborate|help|share|community/i,
    educational: /learn|teach|explain|tutorial|guide|tips/i,
    creative: /design|create|idea|innovate|imagine|art/i
  };

  const traits = [];
  for (const [trait, pattern] of Object.entries(patterns)) {
    if (pattern.test(tweetTexts)) {
      traits.push(trait);
    }
  }

  if (traits.includes('technical') && traits.includes('collaborative')) {
    return 'Technical collaborator - 技術的な議論と協働を重視';
  } else if (traits.includes('educational')) {
    return 'Knowledge sharer - 知識の共有と教育に熱心';
  } else if (traits.includes('creative')) {
    return 'Creative innovator - 創造的なアイデアと革新を追求';
  } else if (traits.includes('technical')) {
    return 'Technical specialist - 技術的な深掘りを好む';
  } else {
    return 'Engaged participant - 積極的な参加者';
  }
}