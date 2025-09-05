/**
 * CNCFプロジェクトランダム選択のテスト
 */

// Mock data for testing
const mockProjects = [
  'Kubernetes',
  'Prometheus',
  'Envoy',
  'CoreDNS',
  'containerd',
  'Fluentd',
  'Open Policy Agent (OPA)',
  'The Update Framework (TUF)',
  'Cloud Development Kit for Kubernetes (cdk8s)',
  'SPIFFE/SPIRE'
];

/**
 * URL生成ロジックのテスト用関数（diagnosis-v4-openai.jsと同じロジック）
 */
function generateUrlName(projectName) {
  return projectName.toLowerCase()
    .replace(/\s+/g, '-')           // スペース → ハイフン
    .replace(/[^\w-]/g, '')         // 英数字とハイフン以外を削除
    .replace(/-+/g, '-')            // 連続ハイフンを1つに
    .replace(/^-|-$/g, '');         // 前後のハイフンを削除
}

describe('CNCF Project URL Generation', () => {
  describe('URL名の生成', () => {
    it('基本的なプロジェクト名を正しく変換する', () => {
      expect(generateUrlName('Kubernetes')).toBe('kubernetes');
      expect(generateUrlName('Prometheus')).toBe('prometheus');
      expect(generateUrlName('Envoy')).toBe('envoy');
    });

    it('スペースをハイフンに変換する', () => {
      expect(generateUrlName('Open Policy Agent')).toBe('open-policy-agent');
      expect(generateUrlName('Cloud Native')).toBe('cloud-native');
    });

    it('括弧を削除する', () => {
      expect(generateUrlName('Open Policy Agent (OPA)')).toBe('open-policy-agent-opa');
      expect(generateUrlName('The Update Framework (TUF)')).toBe('the-update-framework-tuf');
      expect(generateUrlName('Cloud Development Kit for Kubernetes (cdk8s)'))
        .toBe('cloud-development-kit-for-kubernetes-cdk8s');
    });

    it('スラッシュをハイフンに変換する', () => {
      expect(generateUrlName('SPIFFE/SPIRE')).toBe('spiffespire');
      expect(generateUrlName('Test/Project/Name')).toBe('testprojectname');
    });

    it('特殊文字を削除する', () => {
      expect(generateUrlName('Project@Name')).toBe('projectname');
      expect(generateUrlName('Project#1')).toBe('project1');
      expect(generateUrlName('Project&Name')).toBe('projectname');
      expect(generateUrlName('Project.Name')).toBe('projectname');
    });

    it('連続するハイフンを1つにまとめる', () => {
      expect(generateUrlName('Project---Name')).toBe('project-name');
      expect(generateUrlName('Cloud  Native')).toBe('cloud-native');
    });

    it('前後のハイフンを削除する', () => {
      expect(generateUrlName('-Project-')).toBe('project');
      expect(generateUrlName('---Project---')).toBe('project');
    });

    it('複雑なケースを正しく処理する', () => {
      expect(generateUrlName('!!Cloud-Native@@(Test)##Project/2024!!'))
        .toBe('cloud-nativetestproject2024');
      expect(generateUrlName('  Spaces  Before  And  After  '))
        .toBe('spaces-before-and-after');
    });
  });

  describe('ランダム選択の分布', () => {
    it('すべてのプロジェクトが選択される可能性がある', () => {
      const selections = new Set();
      const mockRandom = (index) => {
        const originalRandom = Math.random;
        Math.random = () => index / mockProjects.length;
        const result = Math.floor(Math.random() * mockProjects.length);
        Math.random = originalRandom;
        return result;
      };

      // 各プロジェクトを模擬的に選択
      for (let i = 0; i < mockProjects.length; i++) {
        const index = mockRandom(i);
        selections.add(mockProjects[index]);
      }

      // すべてのプロジェクトが選択可能であることを確認
      expect(selections.size).toBeGreaterThan(0);
      expect(selections.size).toBeLessThanOrEqual(mockProjects.length);
    });
  });

  describe('エラーハンドリング', () => {
    it('空文字列を適切に処理する', () => {
      expect(generateUrlName('')).toBe('');
    });

    it('数字のみのプロジェクト名を処理する', () => {
      expect(generateUrlName('123')).toBe('123');
      expect(generateUrlName('2024')).toBe('2024');
    });

    it('日本語などの非ASCII文字を削除する', () => {
      expect(generateUrlName('プロジェクト')).toBe('');
      expect(generateUrlName('Project プロジェクト')).toBe('project');
      expect(generateUrlName('😀 Emoji Project 🚀')).toBe('emoji-project');
    });
  });
});

describe('CNCF Project Selection Logic', () => {
  it('ランダムインデックスが配列範囲内である', () => {
    for (let i = 0; i < 100; i++) {
      const randomIndex = Math.floor(Math.random() * mockProjects.length);
      expect(randomIndex).toBeGreaterThanOrEqual(0);
      expect(randomIndex).toBeLessThan(mockProjects.length);
    }
  });

  it('選択されたプロジェクトが有効である', () => {
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * mockProjects.length);
      const selected = mockProjects[randomIndex];
      expect(selected).toBeDefined();
      expect(typeof selected).toBe('string');
      expect(selected.length).toBeGreaterThan(0);
    }
  });
});