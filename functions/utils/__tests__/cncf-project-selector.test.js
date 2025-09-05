/**
 * CNCFプロジェクトランダム選択のテスト
 */

const {
  CNCF_GRADUATED_PROJECTS,
  CNCF_INCUBATING_PROJECTS,
  CNCF_SANDBOX_PROJECTS,
  ALL_CNCF_PROJECTS,
  getRandomCNCFProject,
  CNCF_STATS
} = require('../cncf-projects.js');

describe('CNCF Projects Data Structure', () => {
  describe('Project counts', () => {
    it('should have the correct total number of projects', () => {
      expect(ALL_CNCF_PROJECTS.length).toBe(200);
      expect(CNCF_STATS.total).toBe(200);
    });

    it('should have the correct number of graduated projects', () => {
      expect(CNCF_GRADUATED_PROJECTS.length).toBe(31);
      expect(CNCF_STATS.graduated).toBe(31);
    });

    it('should have the correct number of incubating projects', () => {
      expect(CNCF_INCUBATING_PROJECTS.length).toBe(36);
      expect(CNCF_STATS.incubating).toBe(36);
    });

    it('should have the correct number of sandbox projects', () => {
      expect(CNCF_SANDBOX_PROJECTS.length).toBe(133);
      expect(CNCF_STATS.sandbox).toBe(133);
    });
  });

  describe('Project data fields', () => {
    it('all projects should have required fields', () => {
      ALL_CNCF_PROJECTS.forEach(project => {
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('description');
        expect(project).toHaveProperty('description_en');
        expect(project).toHaveProperty('homepage');
        
        expect(typeof project.name).toBe('string');
        expect(typeof project.description).toBe('string');
        expect(typeof project.description_en).toBe('string');
        expect(typeof project.homepage).toBe('string');
        
        expect(project.name.length).toBeGreaterThan(0);
        expect(project.description.length).toBeGreaterThan(0);
        expect(project.description_en.length).toBeGreaterThan(0);
        expect(project.homepage.length).toBeGreaterThan(0);
      });
    });

    it('all homepage URLs should be valid', () => {
      ALL_CNCF_PROJECTS.forEach(project => {
        expect(project.homepage).toMatch(/^https?:\/\//);
      });
    });

    it('Japanese descriptions should be in Japanese', () => {
      // Check a few known projects for Japanese content
      const kubernetes = ALL_CNCF_PROJECTS.find(p => p.name === 'Kubernetes');
      expect(kubernetes).toBeDefined();
      expect(kubernetes.description).toContain('コンテナ');
    });

    it('English descriptions should be in English', () => {
      const kubernetes = ALL_CNCF_PROJECTS.find(p => p.name === 'Kubernetes');
      expect(kubernetes).toBeDefined();
      expect(kubernetes.description_en).toContain('containerized');
    });
  });

  describe('ALL_CNCF_PROJECTS array', () => {
    it('should combine all categories correctly', () => {
      const totalFromCategories = 
        CNCF_GRADUATED_PROJECTS.length + 
        CNCF_INCUBATING_PROJECTS.length + 
        CNCF_SANDBOX_PROJECTS.length;
      
      expect(ALL_CNCF_PROJECTS.length).toBe(totalFromCategories);
    });

    it('should not have duplicate projects', () => {
      const projectNames = ALL_CNCF_PROJECTS.map(p => p.name);
      const uniqueNames = new Set(projectNames);
      expect(uniqueNames.size).toBe(projectNames.length);
    });
  });
});

describe('getRandomCNCFProject function', () => {
  describe('Random selection', () => {
    it('should return a valid project', () => {
      const project = getRandomCNCFProject();
      expect(project).toBeDefined();
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('description');
      expect(project).toHaveProperty('homepage');
    });

    it('should return graduated projects when specified', () => {
      const project = getRandomCNCFProject('graduated');
      expect(CNCF_GRADUATED_PROJECTS).toContainEqual(project);
    });

    it('should return incubating projects when specified', () => {
      const project = getRandomCNCFProject('incubating');
      expect(CNCF_INCUBATING_PROJECTS).toContainEqual(project);
    });

    it('should return sandbox projects when specified', () => {
      const project = getRandomCNCFProject('sandbox');
      expect(CNCF_SANDBOX_PROJECTS).toContainEqual(project);
    });

    it('should return from all projects when no category specified', () => {
      const project = getRandomCNCFProject();
      expect(ALL_CNCF_PROJECTS).toContainEqual(project);
    });
  });

  describe('Distribution', () => {
    it('should select different projects over multiple calls', () => {
      const selections = new Set();
      // Run 50 times to get a good sample
      for (let i = 0; i < 50; i++) {
        const project = getRandomCNCFProject();
        selections.add(project.name);
      }
      // Should have selected multiple different projects
      expect(selections.size).toBeGreaterThan(10);
    });

    it('should be able to select any project from the list', () => {
      // This is a statistical test - with random selection,
      // we can't guarantee all projects will be selected,
      // but we can verify the mechanism works
      const testCategory = 'graduated';
      const categoryProjects = CNCF_GRADUATED_PROJECTS;
      const selections = new Set();
      
      // Run many times to increase probability
      for (let i = 0; i < 100; i++) {
        const project = getRandomCNCFProject(testCategory);
        selections.add(project.name);
      }
      
      // Should have selected a good portion of available projects
      expect(selections.size).toBeGreaterThan(categoryProjects.length * 0.3);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid category gracefully', () => {
      const project = getRandomCNCFProject('invalid-category');
      expect(project).toBeDefined();
      expect(ALL_CNCF_PROJECTS).toContainEqual(project);
    });

    it('should handle null category', () => {
      const project = getRandomCNCFProject(null);
      expect(project).toBeDefined();
      expect(ALL_CNCF_PROJECTS).toContainEqual(project);
    });

    it('should handle undefined category', () => {
      const project = getRandomCNCFProject(undefined);
      expect(project).toBeDefined();
      expect(ALL_CNCF_PROJECTS).toContainEqual(project);
    });
  });
});

describe('CNCF_STATS object', () => {
  it('should have all required properties', () => {
    expect(CNCF_STATS).toHaveProperty('total');
    expect(CNCF_STATS).toHaveProperty('graduated');
    expect(CNCF_STATS).toHaveProperty('incubating');
    expect(CNCF_STATS).toHaveProperty('sandbox');
    expect(CNCF_STATS).toHaveProperty('lastUpdated');
  });

  it('should have correct data types', () => {
    expect(typeof CNCF_STATS.total).toBe('number');
    expect(typeof CNCF_STATS.graduated).toBe('number');
    expect(typeof CNCF_STATS.incubating).toBe('number');
    expect(typeof CNCF_STATS.sandbox).toBe('number');
    expect(typeof CNCF_STATS.lastUpdated).toBe('string');
  });

  it('should have consistent counts', () => {
    const sum = CNCF_STATS.graduated + CNCF_STATS.incubating + CNCF_STATS.sandbox;
    expect(sum).toBe(CNCF_STATS.total);
  });

  it('should have valid date format', () => {
    expect(CNCF_STATS.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('Known Projects Validation', () => {
  it('should include well-known graduated projects', () => {
    const knownProjects = ['Kubernetes', 'Prometheus', 'Envoy', 'Helm', 'Istio'];
    const graduatedNames = CNCF_GRADUATED_PROJECTS.map(p => p.name);
    
    knownProjects.forEach(name => {
      expect(graduatedNames).toContain(name);
    });
  });

  it('should have proper data for Kubernetes', () => {
    const kubernetes = ALL_CNCF_PROJECTS.find(p => p.name === 'Kubernetes');
    expect(kubernetes).toBeDefined();
    expect(kubernetes.homepage).toBe('https://kubernetes.io/');
    expect(kubernetes.description).toContain('コンテナ');
    expect(kubernetes.description_en).toContain('containerized');
  });
});