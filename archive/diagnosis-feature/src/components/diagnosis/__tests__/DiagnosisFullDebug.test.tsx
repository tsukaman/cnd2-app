import { render, screen } from '@testing-library/react';
import { DiagnosisFullDebug } from '../DiagnosisFullDebug';
import type { DiagnosisResult } from '@/types';

// モックデータ
const mockResult: DiagnosisResult = {
  id: 'test-123',
  mode: 'duo',
  type: 'Cloud Native Engineer',
  compatibility: 85,
  summary: 'テスト診断結果',
  conversationStarters: ['話題1', '話題2'],
  hiddenGems: '隠れた共通点',
  luckyItem: 'ラッキーアイテム',
  luckyAction: 'ラッキーアクション',
  luckyProject: 'Kubernetes',
  astrologicalAnalysis: '占星術的な分析内容',
  techStackCompatibility: '技術スタック互換性分析',
  participants: [],
  createdAt: '2025-09-01T12:00:00Z',
  aiPowered: true,
  metadata: {
    analysis: {
      astrologicalAnalysis: '占星術的な分析内容（metadata内）',
      techStackCompatibility: '技術スタック互換性分析（metadata内）'
    }
  }
};

describe('DiagnosisFullDebug', () => {
  it('should display all LLM fields correctly', () => {
    render(<DiagnosisFullDebug result={mockResult} />);
    
    // デバッグモードのヘッダーが表示される
    expect(screen.getByText('DEBUG MODE: LLM全フィールド表示')).toBeInTheDocument();
    
    // 現在表示されているフィールドセクション
    expect(screen.getByText('✅ 現在表示されているフィールド')).toBeInTheDocument();
    expect(screen.getByText(/type: Cloud Native Engineer/)).toBeInTheDocument();
    expect(screen.getByText(/compatibility\/score: 85/)).toBeInTheDocument();
    
    // 未使用フィールドセクション
    expect(screen.getByText('⚠️ LLMから取得しているが表示されていないフィールド')).toBeInTheDocument();
    expect(screen.getByText('astrologicalAnalysis（占星術的分析）')).toBeInTheDocument();
    expect(screen.getByText('techStackCompatibility（技術スタック互換性）')).toBeInTheDocument();
  });

  it('should calculate token estimates accurately', () => {
    render(<DiagnosisFullDebug result={mockResult} />);
    
    // トークン削減の推定効果セクション
    expect(screen.getByText('💰 トークン削減の推定効果')).toBeInTheDocument();
    
    // 各フィールドの削減量が表示される
    expect(screen.getByText('占星術的分析削除:')).toBeInTheDocument();
    expect(screen.getByText('技術スタック互換性削除:')).toBeInTheDocument();
    expect(screen.getByText('抽出されたプロフィール削除:')).toBeInTheDocument();
    
    // 合計削減量が表示される
    expect(screen.getByText('合計削減量:')).toBeInTheDocument();
    expect(screen.getByText(/約\d+~\d+ tokens\/診断/)).toBeInTheDocument();
  });

  it('should handle missing fields gracefully', () => {
    const minimalResult: DiagnosisResult = {
      id: 'test-minimal',
      mode: 'duo',
      type: 'Test Type',
      compatibility: 50,
      summary: 'Minimal test',
      conversationStarters: [],
      hiddenGems: '',
      luckyItem: '',
      luckyAction: '',
      luckyProject: '',
      participants: [],
      createdAt: '2025-09-01T12:00:00Z',
      aiPowered: false
    };
    
    render(<DiagnosisFullDebug result={minimalResult} />);
    
    // コンポーネントがクラッシュしないことを確認
    expect(screen.getByText('DEBUG MODE: LLM全フィールド表示')).toBeInTheDocument();
    
    // 必須フィールドが表示される
    expect(screen.getByText(/type: Test Type/)).toBeInTheDocument();
    expect(screen.getByText(/compatibility\/score: 50/)).toBeInTheDocument();
  });

  it('should display metadata analysis fields when available', () => {
    const resultWithAnalysis: DiagnosisResult = {
      ...mockResult,
      metadata: {
        analysis: {
          astrologicalAnalysis: '占星術的な分析',
          techStackCompatibility: '技術スタック互換性'
        }
      }
    };
    
    render(<DiagnosisFullDebug result={resultWithAnalysis} />);
    
    // デバッグビューが表示されることを確認
    expect(screen.getByText('DEBUG MODE: LLM全フィールド表示')).toBeInTheDocument();
    
    // フィールドが複数箇所に表示される可能性があるため、getAllByTextを使用
    const astroElements = screen.getAllByText(/astrologicalAnalysis/);
    expect(astroElements.length).toBeGreaterThan(0);
    
    const techElements = screen.getAllByText(/techStackCompatibility/);
    expect(techElements.length).toBeGreaterThan(0);
  });

  it('should show warning for unused extracted_profiles', () => {
    render(<DiagnosisFullDebug result={mockResult} />);
    
    // extracted_profilesの警告
    expect(screen.getByText('extracted_profiles（抽出されたプロフィール）')).toBeInTheDocument();
    expect(screen.getByText(/元のプロフィールデータ.*を既に持っているため不要/)).toBeInTheDocument();
  });

  it('should display raw JSON data in collapsible section', () => {
    render(<DiagnosisFullDebug result={mockResult} />);
    
    // 生のJSONデータセクション
    const detailsElement = screen.getByText('📋 生のJSONデータを表示（クリックで展開）');
    expect(detailsElement).toBeInTheDocument();
    
    // summary要素の親要素を確認
    const summaryElement = detailsElement.closest('summary');
    expect(summaryElement).toBeInTheDocument();
  });

  it('should display token savings percentage', () => {
    render(<DiagnosisFullDebug result={mockResult} />);
    
    // パーセンテージ表示
    expect(screen.getByText(/約30-40%のトークン削減が可能/)).toBeInTheDocument();
  });
});