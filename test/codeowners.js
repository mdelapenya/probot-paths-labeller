const expect = require('expect');
const codeowners = require('../lib/codeowners');

describe('codeowners', () => {
  let labels;

  beforeEach(() => {
    labels = codeowners(`---
- "*":
  - "label1"
  - "label2"
- "*.pdf": []
- "*.rb":
  - "label4"
  - "label5"
- "*.py":
  - "label4"
  - "label5"
- "*.doc":
  - "label6"
  - "label7"
- "*.md": []
- "LICENSE": []
- "README.md":
  - "label-precedence"`);
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
      expect(rubyLabels.includes('label4')).toBe(true);
      expect(rubyLabels.includes('label5')).toBe(true);

      const pythonLabels = labels.for('foo.py');
      expect(pythonLabels.includes('label4')).toBe(true);
      expect(pythonLabels.includes('label5')).toBe(true);
    });

    it('returns labels without precedence', () => {
      expect(labels.for('LICENSE.md')).toEqual([]);
    });

    it('returns labels with precedence', () => {
      expect(labels.for('README.md')).toEqual(['label-precedence']);
    });
  });
});
