/**
 * ローディング画面用のカラー定数
 * PR #278で実装した明るいカラースキームに統一
 */

export const BRAND_COLORS = {
  SKY_BLUE: '#0EA5E9',
  EMERALD: '#10B981',
  AMBER: '#F59E0B',
} as const;

export const BACKGROUND_GRADIENT =
  'linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 25%, #FEF3C7 50%, #FED7AA 75%, #FECACA 100%)';

export const LOGO_GRADIENT = `linear-gradient(135deg, ${BRAND_COLORS.SKY_BLUE} 0%, ${BRAND_COLORS.EMERALD} 50%, ${BRAND_COLORS.AMBER} 100%)`;

export const DOT_COLORS = [
  { color: BRAND_COLORS.SKY_BLUE, label: 'Sky blue' },
  { color: BRAND_COLORS.EMERALD, label: 'Emerald' },
  { color: BRAND_COLORS.AMBER, label: 'Amber' },
] as const;
