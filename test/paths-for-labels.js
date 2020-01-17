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
  - "PRIVATE.doc"
- "label4":
  - "*.py"
  - "*.rb"
- "label5":
  - "*.py"
  - "*.rb"
- "label6":
  - "folder/**/*.txt"
  - "*.doc"
- "label8":
  - "script.py"`);
  });

  describe('labels', () => {
    it('returns default labels for everything in the repo', () => {
      expect(labels.for('*')).toEqual(['label1', 'label2']);
    });

    it('returns default labels without a path specified', () => {
      expect(labels.for('README')).toEqual(['label1', 'label2']);
    });

    it('returns no labels for a path without labels', () => {
      expect(labels.for('class.java')).toEqual(['label1', 'label2']);
    });

    it('returns no labels for a excluded path', () => {
      expect(labels.for('report.pdf')).toEqual([]);
      expect(labels.for('CONTRIBUTING.md')).toEqual([]);
      expect(labels.for('LICENSE')).toEqual([]);
    });

    it('returns no labels for a excluded path even with existing labels', () => {
      expect(labels.for('PRIVATE.doc')).toEqual([]);
    });

    it('returns labels matching any of multiple paths', () => {
      const rubyLabels = labels.for('foo.rb');
      expect(rubyLabels).toEqual(['label1', 'label2', 'label4', 'label5']);

      const pythonLabels = labels.for('foo.py');
      expect(pythonLabels).toEqual(['label1', 'label2', 'label4', 'label5']);

      const docLabels = labels.for('SUMMARY.doc');
      expect(docLabels).toEqual(['label1', 'label2', 'label6']);
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
      expect(labels.for('script.py')).toEqual(['label1', 'label2', 'label4', 'label5', 'label8']);
    });
  });
});
