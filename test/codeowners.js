const expect = require('expect');
const codeowners = require('../lib/codeowners');

describe('owners', () => {
  let ownersFile;

  beforeEach(() => {
    ownersFile = codeowners(`
      # Comment
      * @owner @org/team     # @@probot-codeowners-labeller:"label1","label2"
      *.pdf finance@gmail.com
      *.rb *.py @user
      *.md @focused          ##### @@probot-codeowners-labeller:"label4","label5"
      LICENSE @org/legal     # @@probot-other:"label1","label2"
      README.md @overriden
    `);
  });

  it('default owners for everything in the repo', () => {
    expect(ownersFile.for('*')).toEqual(['@owner', '@org/team']);
  });

  it('returns all users without a path specified', () => {
    expect(ownersFile.for('README')).toEqual(['@owner', '@org/team']);
  });

  it('returns teams with matching path', () => {
    expect(ownersFile.for('LICENSE')).toEqual('@org/legal');
  });

  it('returns email with matching path', () => {
    expect(ownersFile.for('*.pdf')).toEqual('finance@gmail.com');
  });

  it('returns users matching any path', () => {
    expect(ownersFile.for('foo.rb').includes('@user')).toBe(true);
    expect(ownersFile.for('foo.py').includes('@user')).toBe(true);
  });

  it('returns user without precedence', () => {
    expect(ownersFile.for('LICENSE.md')).toEqual(['@focused']);
  });

  it('returns user with precedence', () => {
    expect(ownersFile.for('README.md')).toEqual(['@overriden']);
  });
});
