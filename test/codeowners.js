const expect = require('expect');
const codeowners = require('../lib/codeowners');

describe('owners', () => {
  let owners;

  beforeEach(() => {
    owners = codeowners(`
      # Comment
      * @owner @org/team
      *.pdf finance@gmail.com
      *.rb *.py @user
      *.md @focused
      LICENSE @org/legal
      README.md @overriden
    `);
  });

  it('default owners for everything in the repo', () => {
    expect(owners.for('*')).toEqual(['@owner', '@org/team']);
  });

  it('returns all users without a path specified', () => {
    expect(owners.for('README')).toEqual(['@owner', '@org/team']);
  });

  it('returns teams with matching path', () => {
    expect(owners.for('LICENSE')).toEqual('@org/legal');
  });

  it('returns email with matching path', () => {
    expect(owners.for('*.pdf')).toEqual('finance@gmail.com');
  });

  it('returns users matching any path', () => {
    expect(owners.for('foo.rb').includes('@user')).toBe(true);
    expect(owners.for('foo.py').includes('@user')).toBe(true);
  });

  it('returns user without precedence', () => {
    expect(owners.for('LICENSE.md')).toEqual(['@focused']);
  });

  it('returns user with precedence', () => {
    expect(owners.for('README.md')).toEqual(['@overriden']);
  });
});
