/**
 * 川柳管理APIクライアント
 */

const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api/senryu-admin'
  : 'http://localhost:3000/api/senryu-admin';

// 環境変数からトークンを取得（クライアントサイドでは設定しない）
// サーバーサイドまたは認証後に動的に設定する必要がある
const getAuthToken = (): string => {
  // クライアントサイドでは localStorage から取得
  if (typeof window !== 'undefined') {
    return localStorage.getItem('senryu-admin-token') || '';
  }
  return '';
};

interface SenryuPost {
  id: string;
  upper: string;
  middle: string;
  lower: string;
  author?: string;
  createdAt: string;
  likes?: number;
}

interface Phrase {
  id: string;
  text: string;
  type: 'upper' | 'middle' | 'lower';
  category?: string;
  createdAt: string;
}

class SenryuAdminClient {
  private getHeaders() {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // 認証トークンを設定するメソッド
  setAuthToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('senryu-admin-token', token);
    }
  }

  // 認証トークンをクリアするメソッド
  clearAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('senryu-admin-token');
    }
  }

  // 投稿関連
  async getAllPosts(): Promise<SenryuPost[]> {
    try {
      const response = await fetch(`${API_BASE}/posts`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      // フォールバック: LocalStorageから取得
      const saved = localStorage.getItem('senryu-posts');
      return saved ? JSON.parse(saved) : [];
    }
  }

  async getPost(id: string): Promise<SenryuPost | null> {
    try {
      const response = await fetch(`${API_BASE}/posts/${id}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  }

  async createPost(data: Omit<SenryuPost, 'id' | 'createdAt'>): Promise<SenryuPost> {
    try {
      const response = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.statusText}`);
      }

      const created = await response.json();

      // LocalStorageにも保存
      const posts = await this.getAllPosts();
      posts.push(created);
      localStorage.setItem('senryu-posts', JSON.stringify(posts));

      return created;
    } catch (error) {
      console.error('Error creating post:', error);
      // フォールバック: LocalStorageに保存
      const id = `p${Date.now()}`;
      const post = {
        id,
        ...data,
        createdAt: new Date().toISOString()
      };

      const posts = await this.getAllPosts();
      posts.push(post);
      localStorage.setItem('senryu-posts', JSON.stringify(posts));

      return post;
    }
  }

  async updatePost(id: string, data: Partial<SenryuPost>): Promise<SenryuPost> {
    try {
      const response = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to update post: ${response.statusText}`);
      }

      const updated = await response.json();

      // LocalStorageも更新
      const posts = await this.getAllPosts();
      const index = posts.findIndex(p => p.id === id);
      if (index !== -1) {
        posts[index] = updated;
        localStorage.setItem('senryu-posts', JSON.stringify(posts));
      }

      return updated;
    } catch (error) {
      console.error('Error updating post:', error);
      // フォールバック: LocalStorageで更新
      const posts = await this.getAllPosts();
      const index = posts.findIndex(p => p.id === id);

      if (index !== -1) {
        posts[index] = { ...posts[index], ...data };
        localStorage.setItem('senryu-posts', JSON.stringify(posts));
        return posts[index];
      }

      throw error;
    }
  }

  async deletePost(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/posts/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.statusText}`);
      }

      // LocalStorageからも削除
      const posts = await this.getAllPosts();
      const filtered = posts.filter(p => p.id !== id);
      localStorage.setItem('senryu-posts', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting post:', error);
      // フォールバック: LocalStorageから削除
      const posts = await this.getAllPosts();
      const filtered = posts.filter(p => p.id !== id);
      localStorage.setItem('senryu-posts', JSON.stringify(filtered));
    }
  }

  // 句関連
  async getAllPhrases(): Promise<{ upper: Phrase[], middle: Phrase[], lower: Phrase[] }> {
    try {
      const response = await fetch(`${API_BASE}/phrases`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch phrases: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching phrases:', error);
      // フォールバック: LocalStorageから取得
      const saved = localStorage.getItem('senryu-phrases');
      if (saved) {
        return JSON.parse(saved);
      }

      // デフォルトデータ
      return {
        upper: [],
        middle: [],
        lower: []
      };
    }
  }

  async getPhrasesByType(type: 'upper' | 'middle' | 'lower'): Promise<Phrase[]> {
    try {
      const response = await fetch(`${API_BASE}/phrases/${type}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} phrases: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${type} phrases:`, error);
      // フォールバック
      const all = await this.getAllPhrases();
      return all[type] || [];
    }
  }

  async createPhrase(data: { text: string, type: 'upper' | 'middle' | 'lower', category?: string }): Promise<Phrase> {
    try {
      const response = await fetch(`${API_BASE}/phrases`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to create phrase: ${response.statusText}`);
      }

      const created = await response.json();

      // LocalStorageにも保存
      const phrases = await this.getAllPhrases();
      phrases[data.type].push(created);
      localStorage.setItem('senryu-phrases', JSON.stringify(phrases));

      return created;
    } catch (error) {
      console.error('Error creating phrase:', error);
      // フォールバック
      const id = `${data.type[0]}${Date.now()}`;
      const phrase: Phrase = {
        id,
        text: data.text,
        type: data.type,
        category: data.category || 'daily',
        createdAt: new Date().toISOString()
      };

      const phrases = await this.getAllPhrases();
      phrases[data.type].push(phrase);
      localStorage.setItem('senryu-phrases', JSON.stringify(phrases));

      return phrase;
    }
  }

  async updatePhrase(id: string, data: Partial<Phrase>): Promise<Phrase> {
    try {
      const response = await fetch(`${API_BASE}/phrases/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to update phrase: ${response.statusText}`);
      }

      const updated = await response.json();

      // LocalStorageも更新
      const phrases = await this.getAllPhrases();
      const type = updated.type as 'upper' | 'middle' | 'lower';
      const index = phrases[type].findIndex((p: Phrase) => p.id === id);

      if (index !== -1) {
        phrases[type][index] = updated;
        localStorage.setItem('senryu-phrases', JSON.stringify(phrases));
      }

      return updated;
    } catch (error) {
      console.error('Error updating phrase:', error);

      // フォールバック: LocalStorageで更新を試みる
      try {
        const phrases = await this.getAllPhrases();
        // IDから型を推測（改善が必要）
        const type = id.startsWith('u') ? 'upper' :
                    id.startsWith('m') ? 'middle' :
                    id.startsWith('l') ? 'lower' : null;

        if (type && phrases[type]) {
          const index = phrases[type].findIndex(p => p.id === id);
          if (index !== -1) {
            const updated = { ...phrases[type][index], ...data };
            phrases[type][index] = updated;
            localStorage.setItem('senryu-phrases', JSON.stringify(phrases));
            return updated;
          }
        }
      } catch (fallbackError) {
        console.error('Fallback update also failed:', fallbackError);
      }

      throw error;
    }
  }

  async deletePhrase(id: string, type: 'upper' | 'middle' | 'lower'): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/phrases/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to delete phrase: ${response.statusText}`);
      }

      // LocalStorageからも削除
      const phrases = await this.getAllPhrases();
      phrases[type] = phrases[type].filter(p => p.id !== id);
      localStorage.setItem('senryu-phrases', JSON.stringify(phrases));
    } catch (error) {
      console.error('Error deleting phrase:', error);
      // フォールバック
      const phrases = await this.getAllPhrases();
      phrases[type] = phrases[type].filter(p => p.id !== id);
      localStorage.setItem('senryu-phrases', JSON.stringify(phrases));
    }
  }

  // データのエクスポート/インポート
  async exportData(): Promise<Blob> {
    const posts = await this.getAllPosts();
    const phrases = await this.getAllPhrases();

    const data = {
      posts,
      phrases,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  async importData(file: File): Promise<{ posts: number, phrases: number }> {
    const text = await file.text();
    const data = JSON.parse(text);

    let postCount = 0;
    let phraseCount = 0;

    // 投稿のインポート
    if (data.posts && Array.isArray(data.posts)) {
      for (const post of data.posts) {
        await this.createPost(post);
        postCount++;
      }
    }

    // 句のインポート
    if (data.phrases) {
      for (const type of ['upper', 'middle', 'lower'] as const) {
        if (data.phrases[type] && Array.isArray(data.phrases[type])) {
          for (const phrase of data.phrases[type]) {
            await this.createPhrase({
              text: phrase.text,
              type,
              category: phrase.category
            });
            phraseCount++;
          }
        }
      }
    }

    return { posts: postCount, phrases: phraseCount };
  }
}

export const senryuAdminClient = new SenryuAdminClient();