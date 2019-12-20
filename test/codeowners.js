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
