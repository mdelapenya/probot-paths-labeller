const expect = require('expect');
const codeowners = require('../lib/codeowners');

describe('codeowners', () => {
  let ownersFile;

  beforeEach(() => {
    ownersFile = codeowners(`
      # Comment
      * @owner @org/team     # @@probot-codeowners-labeller:"label1","label2"
      *.pdf finance@gmail.com
      *.rb *.py @user        ##### @@probot-codeowners-labeller:"label4","label5"
      *.txt @writer          # @@probot-codeowners-labeller:"label-only" @@probot-other:"labelOther"
      *.doc @officer          # @@probot-codeowners-labeller:"label-non-repeated" @@probot-codeowners-labeller:"label"
      *.md @focused          
      LICENSE @org/legal     # @@probot-other:"labelOther1","labelOther2"
      README.md @overriden   # @@probot-codeowners-labeller:"label-precedence"
    `);
  });

  describe('owners', () => {
    it('default owners for everything in the repo', () => {
      expect(ownersFile.ownersFor('*')).toEqual(['@owner', '@org/team']);
    });

    it('returns all users without a path specified', () => {
      expect(ownersFile.ownersFor('README')).toEqual(['@owner', '@org/team']);
    });

    it('returns teams with matching path', () => {
      expect(ownersFile.ownersFor('LICENSE')).toEqual('@org/legal');
    });

    it('returns email with matching path', () => {
      expect(ownersFile.ownersFor('*.pdf')).toEqual('finance@gmail.com');
    });

    it('returns users matching any path', () => {
      expect(ownersFile.ownersFor('foo.rb').includes('@user')).toBe(true);
      expect(ownersFile.ownersFor('foo.py').includes('@user')).toBe(true);
    });

    it('returns user without precedence', () => {
      expect(ownersFile.ownersFor('LICENSE.md')).toEqual(['@focused']);
    });

    it('returns user with precedence', () => {
      expect(ownersFile.ownersFor('README.md')).toEqual(['@overriden']);
    });
  });

  describe('labels', () => {
    it('returns default labels for everything in the repo', () => {
      expect(ownersFile.labelsFor('*')).toEqual(['label1', 'label2']);
    });

    it('returns default labels without a path specified', () => {
      expect(ownersFile.labelsFor('README')).toEqual(['label1', 'label2']);
    });

    it('returns labels only for codeowners-labeller probot', () => {
      expect(ownersFile.labelsFor('note.txt')).toEqual(['label-only']);
    });

    it('returns labels only for the first codeowners-labeller probot', () => {
      expect(ownersFile.labelsFor('letter.doc')).toEqual(['label-non-repeated']);
    });

    it('returns no labels for a path without labels', () => {
      expect(ownersFile.labelsFor('report.pdf')).toEqual([]);
    });

    it('returns no labels with a different probot marker', () => {
      expect(ownersFile.labelsFor('LICENSE')).toEqual([]);
    });

    it('returns labels matching any of multiple paths', () => {
      const rubyLabels = ownersFile.labelsFor('foo.rb');
      expect(rubyLabels.includes('label4')).toBe(true);
      expect(rubyLabels.includes('label5')).toBe(true);
      
      const pythonLabels = ownersFile.labelsFor('foo.py');
      expect(pythonLabels.includes('label4')).toBe(true);
      expect(pythonLabels.includes('label5')).toBe(true);
    });

    it('returns labels without precedence', () => {
      expect(ownersFile.labelsFor('LICENSE.md')).toEqual([]);
    });

    it('returns labels with precedence', () => {
      expect(ownersFile.labelsFor('README.md')).toEqual(['label-precedence']);
    });
  });
});
