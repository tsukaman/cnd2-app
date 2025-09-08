'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Clock, Layers, RefreshCw, X } from 'lucide-react';

interface GameConfig {
  presentationTimeLimit: number;
  preparationTimeLimit: number; // プレゼン準備時間
  scoringTimeLimit: number; // 採点時間
  numberOfSets: number;
  redrawLimits: {
    upper: number;
    middle: number;
    lower: number;
  };
}

interface GameConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: GameConfig) => void;
  playerCount: number;
}

export function GameConfigModal({ isOpen, onClose, onConfirm, playerCount }: GameConfigModalProps) {
  const [config, setConfig] = useState<GameConfig>({
    presentationTimeLimit: 60,
    preparationTimeLimit: 30,
    scoringTimeLimit: 60,
    numberOfSets: 1,
    redrawLimits: {
      upper: 1,
      middle: 1,
      lower: 1
    }
  });

  const handleConfirm = () => {
    onConfirm(config);
    onClose();
  };

  const updateRedrawLimit = (type: 'upper' | 'middle' | 'lower', value: number) => {
    setConfig(prev => ({
      ...prev,
      redrawLimits: {
        ...prev.redrawLimits,
        [type]: Math.max(0, Math.min(3, value))
      }
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6"
          >
            <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-orange-500" />
                  ゲーム設定
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Settings */}
              <div className="space-y-6">
                {/* Presentation Time */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Clock className="w-4 h-4" />
                    プレゼン時間
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="30"
                      max="120"
                      step="30"
                      value={config.presentationTimeLimit}
                      onChange={(e) => setConfig(prev => ({ ...prev, presentationTimeLimit: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-blue-600 min-w-[60px] text-right">
                      {config.presentationTimeLimit}秒
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span className="relative -ml-2">30秒</span>
                    <span className="relative -ml-2">60秒</span>
                    <span className="relative -mr-2">90秒</span>
                    <span className="relative -mr-4">120秒</span>
                  </div>
                </div>

                {/* Preparation Time */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Clock className="w-4 h-4" />
                    プレゼン準備時間
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="15"
                      value={config.preparationTimeLimit}
                      onChange={(e) => setConfig(prev => ({ ...prev, preparationTimeLimit: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-purple-600 min-w-[60px] text-right">
                      {config.preparationTimeLimit}秒
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span className="relative -ml-2">15秒</span>
                    <span className="relative -ml-2">30秒</span>
                    <span className="relative -mr-2">45秒</span>
                    <span className="relative -mr-4">60秒</span>
                  </div>
                </div>

                {/* Scoring Time */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Clock className="w-4 h-4" />
                    採点時間
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="30"
                      max="90"
                      step="30"
                      value={config.scoringTimeLimit}
                      onChange={(e) => setConfig(prev => ({ ...prev, scoringTimeLimit: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-orange-600 min-w-[60px] text-right">
                      {config.scoringTimeLimit}秒
                    </span>
                  </div>
                  <div className="relative flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span className="relative -ml-2">30秒</span>
                    <span className="absolute left-1/2 -translate-x-1/2">60秒</span>
                    <span className="relative -mr-3">90秒</span>
                  </div>
                </div>

                {/* Number of Sets */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Layers className="w-4 h-4" />
                    プレイセット数
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        onClick={() => setConfig(prev => ({ ...prev, numberOfSets: num }))}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                          config.numberOfSets === num
                            ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {num}セット
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    合計プレゼン回数: {config.numberOfSets * playerCount}回
                  </p>
                </div>

                {/* Redraw Limits */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <RefreshCw className="w-4 h-4" />
                    再選出回数（救済措置）
                  </label>
                  <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                    {['upper', 'middle', 'lower'].map((type) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {type === 'upper' ? '上の句' : type === 'middle' ? '中の句' : '下の句'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateRedrawLimit(type as 'upper' | 'middle' | 'lower', config.redrawLimits[type as keyof typeof config.redrawLimits] - 1)}
                            className="w-8 h-8 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
                            disabled={config.redrawLimits[type as keyof typeof config.redrawLimits] === 0}
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-gray-800">
                            {config.redrawLimits[type as keyof typeof config.redrawLimits]}
                          </span>
                          <button
                            onClick={() => updateRedrawLimit(type as 'upper' | 'middle' | 'lower', config.redrawLimits[type as keyof typeof config.redrawLimits] + 1)}
                            className="w-8 h-8 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
                            disabled={config.redrawLimits[type as keyof typeof config.redrawLimits] === 3}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 mt-2">
                      ※各プレイヤーが川柳を作り直せる回数です
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  ゲーム開始
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}