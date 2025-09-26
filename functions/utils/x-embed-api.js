// @ts-check
/**
 * X (Twitter) oEmbed API client
 * 無料で使える公式embed APIを利用してプロフィール情報を取得
 */

/**
 * Fetch basic profile data using X's oEmbed API
 * @param {string} username - X username without @ symbol
 * @returns {Promise<Object|null>} Embed data or null if failed
 */
export async function fetchEmbedData(username) {
  try {
    // X の公式 oEmbed エンドポイント（無料・認証不要）
    const response = await fetch(
      `https://publish.twitter.com/oembed?` +
      `url=https://twitter.com/${encodeURIComponent(username)}&` +
      `hide_thread=true&` +
      `hide_media=true&` +
      `omit_script=true&` +
      `dnt=true`
    );

    if (!response.ok) {
      console.warn(`[X embed API] Failed to fetch for ${username}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // embed API から取得できる情報
    return {
      author_name: data.author_name,     // 表示名
      author_url: data.author_url,       // プロフィールURL
      provider_name: data.provider_name, // "Twitter"
      html: data.html,                   // 埋め込みHTML（追加情報を含む）
      cache_age: data.cache_age || 3600  // キャッシュ推奨時間（秒）
    };
  } catch (error) {
    console.error('[X embed API] Error:', error);
    return null;
  }
}

/**
 * Fetch recent tweet embeds for a user
 * @param {string} username - X username
 * @param {string[]} tweetIds - Array of tweet IDs to fetch
 * @returns {Promise<Array>} Array of tweet embed data
 */
export async function fetchTweetEmbeds(username, tweetIds = []) {
  const tweets = [];

  for (const tweetId of tweetIds.slice(0, 5)) { // 最大5件まで
    try {
      const response = await fetch(
        `https://publish.twitter.com/oembed?` +
        `url=https://twitter.com/${encodeURIComponent(username)}/status/${tweetId}&` +
        `hide_thread=true&` +
        `omit_script=true&` +
        `dnt=true`
      );

      if (response.ok) {
        const tweetData = await response.json();
        tweets.push({
          id: tweetId,
          html: tweetData.html,
          author_name: tweetData.author_name,
          cache_age: tweetData.cache_age
        });
      }
    } catch (error) {
      console.warn(`[X embed API] Failed to fetch tweet ${tweetId}:`, error);
      // Individual tweet failures are non-critical
      continue;
    }
  }

  return tweets;
}

/**
 * Extract text content from embed HTML
 * @param {string} html - Embed HTML
 * @returns {string} Extracted text
 */
export function extractTextFromEmbedHtml(html) {
  if (!html) return '';

  // Remove HTML tags and extract text
  const textContent = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return textContent;
}