const expect = require('expect');
const pathsForLabels = require('../lib/paths-for-labels');

describe('pathsForLabels', () => {
  let labels;

  beforeEach(() => {
    labels = pathsForLabels(`---
- "label1":
  - "*"
- "label2":
  - "*"
- "":
  - "*.pdf"
  - "*.md"
  - "LICENSE"
- "label4":
  - "*.py"
  - "*.rb"
- "label5":
  - "*.py"
  - "*.rb"
- "label6":
  - "folder/**/*.txt"
  - "*.doc"
- "label7":
  - "*.doc"
- "label8":
  - "README.doc"`);
  });

  describe('labels', () => {
    it('returns default labels for everything in the repo', () => {
      expect(labels.for('*')).toEqual(['label1', 'label2']);
    });

    it('returns default labels without a path specified', () => {
      expect(labels.for('README')).toEqual(['label1', 'label2']);
    });

    it('returns no labels for a path without labels', () => {
      expect(labels.for('report.pdf')).toEqual([]);
    });

    it('returns labels matching any of multiple paths', () => {
      const rubyLabels = labels.for('foo.rb');
      expect(rubyLabels.includes('label1')).toBe(true);
      expect(rubyLabels.includes('label2')).toBe(true);
      expect(rubyLabels.includes('label4')).toBe(true);
      expect(rubyLabels.includes('label5')).toBe(true);
      
      const pythonLabels = labels.for('foo.py');
      expect(pythonLabels.includes('label1')).toBe(true);
      expect(pythonLabels.includes('label2')).toBe(true);
      expect(pythonLabels.includes('label4')).toBe(true);
      expect(pythonLabels.includes('label5')).toBe(true);
    });

    it('returns labels from glob patterns', () => {
      expect(labels.for('folder/file1.txt').includes('label6')).toBe(true);
      expect(labels.for('folder/file2.txt').includes('label6')).toBe(true);

      expect(labels.for('folder/subdir/file1.txt').includes('label6')).toBe(true);
      expect(labels.for('folder/subdir/file2.txt').includes('label6')).toBe(true);

      expect(labels.for('folder/a/b/c/d/e/f/g/h/i/j/file1.txt').includes('label6')).toBe(true);
      expect(labels.for('folder/a/b/c/d/e/f/g/h/i/j/file2.txt').includes('label6')).toBe(true);
    });

    it('returns labels without precedence', () => {
      expect(labels.for('README.doc')).toEqual(['label1','label2','label6','label7','label8']);
    });
  });
});
