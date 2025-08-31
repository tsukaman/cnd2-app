'use client';

import { useState } from 'react';
import { DiagnosisStyle } from '@/lib/diagnosis-engine-unified';
import { DiagnosisResult } from '@/types';

interface MultiStyleResult {
  style: DiagnosisStyle;
  result: DiagnosisResult;
}

interface MultiStyleResultsProps {
  results: MultiStyleResult[];
  summary: {
    bestStyle: DiagnosisStyle;
    bestScore: number;
    averageScore: number;
    allScores: Array<{ style: DiagnosisStyle; score: number }>;
    recommendation: string;
  };
}

export function MultiStyleResults({ results, summary }: MultiStyleResultsProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewMode, setViewMode] = useState<'tabs' | 'grid'>('tabs');

  const getStyleInfo = (style: DiagnosisStyle) => {
    const styleMap = {
      creative: { label: 'クリエイティブ', icon: '🎨', color: 'purple' },
      astrological: { label: '占星術', icon: '⭐', color: 'blue' },
      fortune: { label: '点取り占い', icon: '🔮', color: 'pink' },
      technical: { label: '技術分析', icon: '📊', color: 'green' }
    };
    return styleMap[style];
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: 'bg-purple-600 text-purple-400 border-purple-500',
      blue: 'bg-blue-600 text-blue-400 border-blue-500',
      pink: 'bg-pink-600 text-pink-400 border-pink-500',
      green: 'bg-green-600 text-green-400 border-green-500'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.purple;
  };

  return (
    <div className="space-y-6">
      {/* サマリー */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
        <h3 className="text-xl font-bold text-white mb-4">診断結果サマリー</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-black/30 rounded-lg p-3">
            <p className="text-sm text-gray-400">最高相性スタイル</p>
            <p className="text-lg font-bold text-white flex items-center gap-2">
              {getStyleInfo(summary.bestStyle).icon}
              {getStyleInfo(summary.bestStyle).label}
            </p>
            <p className="text-2xl font-bold text-purple-400">{summary.bestScore}%</p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-3">
            <p className="text-sm text-gray-400">平均相性スコア</p>
            <p className="text-3xl font-bold text-white mt-2">{summary.averageScore}%</p>
          </div>
        </div>

        <p className="text-sm text-gray-300">{summary.recommendation}</p>
      </div>

      {/* ビューモード切り替え */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setViewMode('tabs')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'tabs' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          タブ表示
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'grid' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          比較表示
        </button>
      </div>

      {/* タブ表示 */}
      {viewMode === 'tabs' && (
        <div>
          {/* タブヘッダー */}
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            {results.map((result, index) => {
              const styleInfo = getStyleInfo(result.style);
              return (
                <button
                  key={result.style}
                  onClick={() => setSelectedTab(index)}
                  className={`
                    px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all
                    ${selectedTab === index
                      ? `${getColorClasses(styleInfo.color).split(' ')[0]} text-white shadow-lg`
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }
                  `}
                >
                  <span className="mr-2">{styleInfo.icon}</span>
                  {styleInfo.label}
                </button>
              );
            })}
          </div>

          {/* タブコンテンツ */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            {results[selectedTab] && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-bold text-white">
                    {getStyleInfo(results[selectedTab].style).icon}
                    {getStyleInfo(results[selectedTab].style).label}診断
                  </h4>
                  <div className="text-3xl font-bold text-purple-400">
                    {results[selectedTab].result.compatibility}%
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-400 mb-1">診断結果</h5>
                    <p className="text-white">{results[selectedTab].result.summary}</p>
                  </div>

                  {results[selectedTab].result.strengths && results[selectedTab].result.strengths.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-1">強み</h5>
                      <ul className="text-gray-300 list-disc list-inside">
                        {results[selectedTab].result.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results[selectedTab].result.opportunities && results[selectedTab].result.opportunities.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-1">機会</h5>
                      <ul className="text-gray-300 list-disc list-inside">
                        {results[selectedTab].result.opportunities.map((opportunity: string, index: number) => (
                          <li key={index}>{opportunity}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results[selectedTab].result.advice && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-400 mb-1">アドバイス</h5>
                      <p className="text-gray-300">{results[selectedTab].result.advice}</p>
                    </div>
                  )}

                  {results[selectedTab].result.fortuneTelling && (
                    <div className="bg-purple-900/30 rounded-lg p-4 mt-4">
                      <h5 className="text-sm font-medium text-purple-400 mb-2">🔮 運勢診断</h5>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                          <span className="text-purple-400">総合運:</span>{' '}
                          {results[selectedTab].result.fortuneTelling.overall}点
                        </p>
                        <p className="text-gray-300">
                          <span className="text-purple-400">技術運:</span>{' '}
                          {results[selectedTab].result.fortuneTelling.tech}点
                        </p>
                        <p className="text-gray-300">
                          <span className="text-purple-400">コラボ運:</span>{' '}
                          {results[selectedTab].result.fortuneTelling.collaboration}点
                        </p>
                        <p className="text-gray-300">
                          <span className="text-purple-400">成長運:</span>{' '}
                          {results[selectedTab].result.fortuneTelling.growth}点
                        </p>
                        {results[selectedTab].result.fortuneTelling.message && (
                          <p className="text-gray-300 mt-2">
                            {results[selectedTab].result.fortuneTelling.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ラッキーアイテム・アクション（DiagnosisResultの直接フィールド） */}
                  {(results[selectedTab].result.luckyItem || results[selectedTab].result.luckyAction) && (
                    <div className="bg-yellow-900/20 rounded-lg p-4 mt-4">
                      <h5 className="text-sm font-medium text-yellow-400 mb-2">🌟 ラッキー要素</h5>
                      <div className="space-y-2 text-sm">
                        {results[selectedTab].result.luckyItem && (
                          <p className="text-gray-300">
                            <span className="text-yellow-400">ラッキーアイテム:</span>{' '}
                            {results[selectedTab].result.luckyItem}
                          </p>
                        )}
                        {results[selectedTab].result.luckyAction && (
                          <p className="text-gray-300">
                            <span className="text-yellow-400">ラッキーアクション:</span>{' '}
                            {results[selectedTab].result.luckyAction}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* グリッド比較表示 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((result) => {
            const styleInfo = getStyleInfo(result.style);
            const score = result.result.compatibility;
            
            return (
              <div
                key={result.style}
                className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{styleInfo.icon}</span>
                    {styleInfo.label}
                  </h4>
                  <div className={`text-2xl font-bold ${getColorClasses(styleInfo.color).split(' ')[1]}`}>
                    {score}%
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 line-clamp-3">
                  {result.result.summary}
                </p>

                {result.style === summary.bestStyle && (
                  <div className="mt-3 inline-flex items-center px-2 py-1 bg-purple-900/50 rounded text-xs text-purple-400">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    最高相性
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* スコア比較チャート */}
      <div className="bg-gray-800/50 rounded-xl p-5">
        <h4 className="text-lg font-bold text-white mb-4">スコア比較</h4>
        <div className="space-y-3">
          {summary.allScores.map((scoreData) => {
            const styleInfo = getStyleInfo(scoreData.style);
            const percentage = (scoreData.score / 100) * 100;
            
            return (
              <div key={scoreData.style} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    {styleInfo.icon} {styleInfo.label}
                  </span>
                  <span className="text-white font-medium">{scoreData.score}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      getColorClasses(styleInfo.color).split(' ')[0]
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}