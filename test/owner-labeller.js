const expect = require('expect');
const OwnerLabeller = require('../lib/owner-labeller');

describe('OwnerLabeller', () => {
  const BASE_SHA = '1234567890abcdef1234567890abcdef12345678';
  const HEAD_SHA = '234567890abcdef1234567890abcdef123456789';
  const ISSUE_NUMBER = 42;

  let event;
  let github;
  let labeller;

  beforeEach(() => {
    event = {
      payload: {
        pull_request: {
          user: {login: 'test'},
        },
        repository: {
          name: 'bar',
          owner: {
            login: 'foo',
          },
        },
      },
    };
  });

  describe('repo property', () => {
    beforeEach(() => {
      github = expect.createSpy();
      labeller = new OwnerLabeller(github, event);
    });

    it('extracts the right information', () => {
      expect(labeller.repo).toMatch({owner: 'foo', repo: 'bar'});
      expect(github).toNotHaveBeenCalled();
    });
  });

  describe('getOwners', () => {
    beforeEach(() => {
      github = {
        repos: {
          getContents: expect.createSpy().andReturn(Promise.resolve({
            data: {
              content: Buffer.from('@manny\n@moe\n@jack').toString('base64'),
            },
          })),
        },
      };

      labeller = new OwnerLabeller(github, event);
    });

    it('returns an ownersFile object', async () => {
      const ownersFile = await labeller.getOwners();

      expect(ownersFile).toExist();
      expect(ownersFile.for).toExist();
      expect(github.repos.getContents).toHaveBeenCalledWith({
        owner: 'foo',
        repo: 'bar',
        path: '.github/CODEOWNERS',
      });
    });
  });

  describe('addLabel', () => {
    beforeEach(() => {
      event = {
        payload: {
          pull_request: {
            base: {
              sha: BASE_SHA,
            },
            head: {
              sha: HEAD_SHA,
            },
            number: 17,
          },
          repository: {
            name: 'probot-codeowners-labellers',
            owner: {
              login: 'mdelapenya',
            },
          },
          number: ISSUE_NUMBER,
        },
      };

      github = {
        issue: expect.createSpy(),
        issues: {
          addLabels: expect.createSpy().andReturn(Promise.resolve()),
        },
        repos: {
          compareCommits: expect.createSpy().andReturn(Promise.resolve({
            data: {
              files: [
                {
                  filename: 'wibble',
                },
                {
                  filename: 'wobble',
                },
              ],
            },
          })),
          getContents: expect.createSpy().andReturn(Promise.resolve({
            data: {
              content: Buffer.from('* @manny\nwibble @elastic/apm-ui\n wobble @elastic/apm-ui').toString('base64'),
            },
          })),
        },
      };

      labeller = new OwnerLabeller(github, event);
    });

    it('returns successfully', async () => {
      await labeller.label();

      expect(github.issues.addLabels).toHaveBeenCalledWith({
        owner: 'mdelapenya',
        repo: 'probot-codeowners-labellers',
        issue_number: 17,
        labels: ['Team:apm'],
      });
    });
  });
});
