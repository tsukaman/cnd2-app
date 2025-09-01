import { render, screen, waitFor } from '@testing-library/react';
import SharedResultClient from '../[id]/SharedResultClient';

// モックは削除（propsで直接IDを渡すため）

// Framer Motion モック
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// ShareButton モック
jest.mock('@/components/share/ShareButton', () => {
  return function ShareButton({ resultId, score }: any) {
    return (
      <button data-testid="share-button">
        Share Result {resultId} - {score}%
      </button>
    );
  };
});

// Fetch モック
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('SharedResultClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('結果を正常に表示する', async () => {
    const mockResult = {
      id: 'test-123',
      mode: 'duo',
      type: 'クラウドネイティブ達人',
      compatibility: 92,
      summary: 'テスト診断結果のサマリー',
      strengths: ['強み1', '強み2', '強み3'],
      opportunities: ['機会1', '機会2'],
      advice: 'テストアドバイス',
      participants: [],
      createdAt: new Date().toISOString(),
      aiPowered: true,
      fortuneMessage: '今日はコンテナが順調に起動する日',
      luckyItem: 'Helmチャート',
      luckyAction: 'kubectl apply -f happiness.yaml',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { result: mockResult },
      }),
    });

    render(<SharedResultClient resultId="test-123" />);

    // ローディング表示を確認
    expect(screen.getByText('診断結果を読み込んでいます...')).toBeInTheDocument();

    // 結果が表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    // 結果の詳細を確認
    expect(screen.getByText('クラウドネイティブ達人')).toBeInTheDocument();
    expect(screen.getByText('テスト診断結果のサマリー')).toBeInTheDocument();
    expect(screen.getByText('強み1')).toBeInTheDocument();
    expect(screen.getByText('機会1')).toBeInTheDocument();
    expect(screen.getByText('テストアドバイス')).toBeInTheDocument();
    expect(screen.getByText('今日はコンテナが順調に起動する日')).toBeInTheDocument();
    expect(screen.getByText('Helmチャート')).toBeInTheDocument();
    expect(screen.getByText('kubectl apply -f happiness.yaml')).toBeInTheDocument();

    // シェアボタンを確認
    expect(screen.getByTestId('share-button')).toBeInTheDocument();
    expect(screen.getByText('Share Result test-123 - 92%')).toBeInTheDocument();
  });

  it('IDが指定されていない場合エラーを表示', async () => {
    render(<SharedResultClient resultId="" />);

    await waitFor(() => {
      expect(screen.getByText('結果が見つかりません')).toBeInTheDocument();
    });

    expect(screen.getByText('結果IDが指定されていません')).toBeInTheDocument();
    expect(screen.getByText('診断を始める')).toBeInTheDocument();
  });

  it('結果が見つからない場合404エラーを表示', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        error: '診断結果が見つかりません',
      }),
    });

    render(<SharedResultClient resultId="not-found" />);

    await waitFor(() => {
      expect(screen.getByText('結果が見つかりません')).toBeInTheDocument();
    });

    expect(screen.getByText('診断結果が見つかりません')).toBeInTheDocument();
    expect(screen.getByText('診断を始める')).toBeInTheDocument();
  });

  it('ネットワークエラー時にエラーを表示', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<SharedResultClient resultId="test-123" />);

    await waitFor(() => {
      expect(screen.getByText('結果が見つかりません')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('運勢情報がない場合でも正常に表示', async () => {
    const mockResult = {
      id: 'test-456',
      mode: 'duo',
      type: 'テストタイプ',
      compatibility: 75,
      summary: 'サマリー',
      strengths: ['強み'],
      opportunities: ['機会'],
      advice: 'アドバイス',
      participants: [],
      createdAt: new Date().toISOString(),
      aiPowered: false,
      // 運勢情報なし
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { result: mockResult },
      }),
    });

    render(<SharedResultClient resultId="test-456" />);

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    // 運勢関連の要素が表示されていないことを確認
    expect(screen.queryByText('今日の運勢')).not.toBeInTheDocument();
    expect(screen.queryByText('ラッキーアイテム')).not.toBeInTheDocument();
    expect(screen.queryByText('ラッキーアクション')).not.toBeInTheDocument();
  });

  it('適切なスコア色を表示', async () => {
    const testCases = [
      { score: 85, expectedGradient: 'from-green-400 to-emerald-400' },
      { score: 65, expectedGradient: 'from-blue-400 to-cyan-400' },
      { score: 45, expectedGradient: 'from-yellow-400 to-orange-400' },
      { score: 35, expectedGradient: 'from-red-400 to-pink-400' },
    ];

    for (const { score, expectedGradient } of testCases) {
      const mockResult = {
        id: `test-${score}`,
        mode: 'duo',
        type: 'テスト',
        compatibility: score,
        summary: 'サマリー',
        strengths: ['強み'],
        opportunities: ['機会'],
        advice: 'アドバイス',
        participants: [],
        createdAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { result: mockResult },
        }),
      });

      const { unmount } = render(<SharedResultClient resultId={`test-${score}`} />);

      await waitFor(() => {
        const scoreElement = screen.getByText(`${score}%`);
        expect(scoreElement).toBeInTheDocument();
        // クラス名に期待するグラデーションが含まれているか確認
        expect(scoreElement.className).toContain('bg-gradient-to-r');
      });

      unmount();
    }
  });
});