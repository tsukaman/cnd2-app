'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  Upload,
  RefreshCw,
  Shield
} from 'lucide-react';
import { senryuAdminClient } from '@/lib/api/senryu-admin-client';

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

export default function AdminSenryuDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState<SenryuPost[]>([]);
  const [phrases, setPhrases] = useState<{
    upper: Phrase[];
    middle: Phrase[];
    lower: Phrase[];
  }>({
    upper: [],
    middle: [],
    lower: []
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('posts');

  // Edit dialog states
  const [editingPost, setEditingPost] = useState<SenryuPost | null>(null);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  const [newPhrase, setNewPhrase] = useState<{ text: string; type: 'upper' | 'middle' | 'lower'; category: string }>({ text: '', type: 'upper', category: '' });

  // 簡易認証（本番環境では適切な認証システムを使用してください）
  const handleLogin = async () => {
    try {
      // サーバー側で認証を行うAPIを呼び出す
      // 開発環境では簡易的な認証を許可
      if (process.env.NODE_ENV === 'development' && password === 'dev-password') {
        setIsAuthenticated(true);
        toast.success('開発環境でログインしました');
        loadData();
        return;
      }

      // 本番環境では環境変数や認証サービスを使用
      // TODO: 実際の認証APIエンドポイントに置き換える
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        toast.success('ログインしました');
        loadData();
      } else {
        toast.error('パスワードが正しくありません');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('ログインに失敗しました');
    }
  };

  // データ読み込み
  const loadData = async () => {
    setLoading(true);
    try {
      // APIから投稿データを取得
      const postsData = await senryuAdminClient.getAllPosts();
      setPosts(postsData);

      // APIから句データを取得
      const phrasesData = await senryuAdminClient.getAllPhrases();

      // データが空の場合は初期データを設定
      if (phrasesData.upper.length === 0 && phrasesData.middle.length === 0 && phrasesData.lower.length === 0) {
        const { KAMI_NO_KU, NAKA_NO_KU, SHIMO_NO_KU } = await import('@/lib/senryu/senryu-data-large');

        // 初期データとして最初の50個ずつをインポート
        const initialPhrases = {
          upper: KAMI_NO_KU.slice(0, 50).map((text, i) => ({
            id: `u${i}`,
            text,
            type: 'upper' as const,
            category: i < 30 ? 'tech' : 'daily',
            createdAt: new Date().toISOString()
          })),
          middle: NAKA_NO_KU.slice(0, 50).map((text, i) => ({
            id: `m${i}`,
            text,
            type: 'middle' as const,
            category: i < 30 ? 'tech' : 'daily',
            createdAt: new Date().toISOString()
          })),
          lower: SHIMO_NO_KU.slice(0, 50).map((text, i) => ({
            id: `l${i}`,
            text,
            type: 'lower' as const,
            category: i < 30 ? 'tech' : 'daily',
            createdAt: new Date().toISOString()
          }))
        };

        setPhrases(initialPhrases);
        // LocalStorageに保存（APIが使用できない場合のフォールバック）
        localStorage.setItem('senryu-phrases', JSON.stringify(initialPhrases));
      } else {
        setPhrases(phrasesData);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 投稿の削除
  const deletePost = async (id: string) => {
    try {
      await senryuAdminClient.deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
      toast.success('投稿を削除しました');
    } catch (error) {
      console.error('投稿削除エラー:', error);
      toast.error('投稿の削除に失敗しました');
    }
  };

  // 投稿の更新
  const updatePost = async (post: SenryuPost) => {
    try {
      const updated = await senryuAdminClient.updatePost(post.id, post);
      setPosts(posts.map(p => p.id === updated.id ? updated : p));
      setEditingPost(null);
      toast.success('投稿を更新しました');
    } catch (error) {
      console.error('投稿更新エラー:', error);
      toast.error('投稿の更新に失敗しました');
    }
  };

  // 句の追加
  const addPhrase = async () => {
    try {
      const created = await senryuAdminClient.createPhrase({
        text: newPhrase.text,
        type: newPhrase.type,
        category: newPhrase.category || 'daily'
      });

      setPhrases(prev => ({
        ...prev,
        [newPhrase.type]: [...prev[newPhrase.type], created]
      }));
      setNewPhrase({ text: '', type: 'upper', category: '' });
      toast.success('句を追加しました');
    } catch (error) {
      console.error('句追加エラー:', error);
      toast.error('句の追加に失敗しました');
    }
  };

  // 句の削除
  const deletePhrase = async (type: 'upper' | 'middle' | 'lower', id: string) => {
    try {
      await senryuAdminClient.deletePhrase(id, type);
      setPhrases(prev => ({
        ...prev,
        [type]: prev[type].filter(p => p.id !== id)
      }));
      toast.success('句を削除しました');
    } catch (error) {
      console.error('句削除エラー:', error);
      toast.error('句の削除に失敗しました');
    }
  };

  // 句の更新
  const updatePhrase = async (phrase: Phrase) => {
    try {
      const updated = await senryuAdminClient.updatePhrase(phrase.id, phrase);
      setPhrases(prev => ({
        ...prev,
        [phrase.type]: prev[phrase.type].map(p => p.id === updated.id ? updated : p)
      }));
      setEditingPhrase(null);
      toast.success('句を更新しました');
    } catch (error) {
      console.error('句更新エラー:', error);
      toast.error('句の更新に失敗しました');
    }
  };

  // データのエクスポート
  const exportData = async () => {
    try {
      const blob = await senryuAdminClient.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `senryu-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('データをエクスポートしました');
    } catch (error) {
      console.error('エクスポートエラー:', error);
      toast.error('データのエクスポートに失敗しました');
    }
  };

  // データのインポート
  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await senryuAdminClient.importData(file);
      toast.success(`データをインポートしました (投稿: ${result.posts}件, 句: ${result.phrases}件)`);
      // データを再読み込み
      await loadData();
    } catch (error) {
      console.error('インポートエラー:', error);
      toast.error('データのインポートに失敗しました');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              管理者ログイン
            </CardTitle>
            <CardDescription>
              川柳管理ダッシュボードにアクセスするにはパスワードを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleLogin()}
                placeholder="管理者パスワード"
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              ログイン
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">川柳管理ダッシュボード</h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">投稿と句データの管理</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              更新
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              エクスポート
            </Button>
            <Label htmlFor="import" className="cursor-pointer">
              <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                インポート
              </span>
              <Input
                id="import"
                type="file"
                accept=".json"
                className="hidden"
                onChange={importData}
              />
            </Label>
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">投稿管理</TabsTrigger>
          <TabsTrigger value="upper">上の句</TabsTrigger>
          <TabsTrigger value="middle">中の句</TabsTrigger>
          <TabsTrigger value="lower">下の句</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>投稿一覧</CardTitle>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="検索..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>川柳</TableHead>
                    <TableHead>作者</TableHead>
                    <TableHead>いいね</TableHead>
                    <TableHead>作成日</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts
                    .filter(post =>
                      searchTerm === '' ||
                      post.upper.includes(searchTerm) ||
                      post.middle.includes(searchTerm) ||
                      post.lower.includes(searchTerm)
                    )
                    .map(post => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div>{post.upper}</div>
                            <div>{post.middle}</div>
                            <div>{post.lower}</div>
                          </div>
                        </TableCell>
                        <TableCell>{post.author || '匿名'}</TableCell>
                        <TableCell>{post.likes || 0}</TableCell>
                        <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPost(post)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePost(post.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {(['upper', 'middle', 'lower'] as const).map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {type === 'upper' ? '上の句' : type === 'middle' ? '中の句' : '下の句'}一覧
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        新規追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>新しい句を追加</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-text">テキスト</Label>
                          <Input
                            id="new-text"
                            value={newPhrase.text}
                            onChange={(e) => setNewPhrase({ ...newPhrase, text: e.target.value, type: type as 'upper' | 'middle' | 'lower' })}
                            placeholder={`${type === 'upper' ? '5音' : type === 'middle' ? '7音' : '5-7音'}の句`}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-category">カテゴリ</Label>
                          <select
                            id="new-category"
                            className="w-full p-2 border rounded"
                            value={newPhrase.category}
                            onChange={(e) => setNewPhrase({ ...newPhrase, category: e.target.value })}
                          >
                            <option value="tech">技術</option>
                            <option value="daily">日常</option>
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={addPhrase}>追加</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>テキスト</TableHead>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>作成日</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phrases[type]
                      .filter(phrase =>
                        searchTerm === '' || phrase.text.includes(searchTerm)
                      )
                      .map(phrase => (
                        <TableRow key={phrase.id}>
                          <TableCell>{phrase.text}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              phrase.category === 'tech'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {phrase.category === 'tech' ? '技術' : '日常'}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(phrase.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingPhrase(phrase)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deletePhrase(type, phrase.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* 投稿編集ダイアログ */}
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>投稿を編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>上の句</Label>
                <Input
                  value={editingPost.upper}
                  onChange={(e) => setEditingPost({ ...editingPost, upper: e.target.value })}
                />
              </div>
              <div>
                <Label>中の句</Label>
                <Input
                  value={editingPost.middle}
                  onChange={(e) => setEditingPost({ ...editingPost, middle: e.target.value })}
                />
              </div>
              <div>
                <Label>下の句</Label>
                <Input
                  value={editingPost.lower}
                  onChange={(e) => setEditingPost({ ...editingPost, lower: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPost(null)}>
                キャンセル
              </Button>
              <Button onClick={() => updatePost(editingPost)}>
                更新
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 句編集ダイアログ */}
      {editingPhrase && (
        <Dialog open={!!editingPhrase} onOpenChange={() => setEditingPhrase(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>句を編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>テキスト</Label>
                <Input
                  value={editingPhrase.text}
                  onChange={(e) => setEditingPhrase({ ...editingPhrase, text: e.target.value })}
                />
              </div>
              <div>
                <Label>カテゴリ</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={editingPhrase.category}
                  onChange={(e) => setEditingPhrase({ ...editingPhrase, category: e.target.value })}
                >
                  <option value="tech">技術</option>
                  <option value="daily">日常</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPhrase(null)}>
                キャンセル
              </Button>
              <Button onClick={() => updatePhrase(editingPhrase)}>
                更新
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}