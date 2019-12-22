const expect = require('expect');
const OwnerLabeller = require('../lib/owner-labeller');

describe('OwnerLabeller', () => {
  const BASE_SHA = '1234567890abcdef1234567890abcdef12345678';
  const HEAD_SHA = '234567890abcdef1234567890abcdef123456789';
  const ISSUE_NUMBER = 42;

  const config = `---
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
- "*.txt":
  - "label-only"
- "*.doc":
  - "label-6"
  - "label-7"
- "*.md": []
- "LICENSE": []
- "README.md":
  - "label-precedence"`;

  let app;
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

  describe('Repo', () => {
    beforeEach(() => {
      github = expect.createSpy();
      labeller = new OwnerLabeller(github, event);
    });

    it('extracts the right information', () => {
      expect(labeller.repo).toMatch({owner: 'foo', name: 'bar'});
      expect(github).toNotHaveBeenCalled();
    });
  });

  describe('getLabels', () => {
    beforeEach(() => {
      github = {
        repos: {
          getContents: expect.createSpy().andReturn(Promise.resolve({
            data: {
              content: Buffer.from(config).toString('base64'),
            },
          })),
        },
      };

      labeller = new OwnerLabeller(github, event);
    });

    it('returns an labelsFile object from the codeowners-labeller.yml file', async () => {
      const labelsFile = await labeller.getLabels();

      expect(labelsFile).toExist();
      expect(labelsFile.for).toExist();
      expect(github.repos.getContents).toHaveBeenCalledWith({
        owner: 'foo',
        repo: 'bar',
        path: '.github/codeowners-labeller.yml',
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

      app = {
        log: {
          info: expect.createSpy(),
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
              content: Buffer.from(config).toString('base64'),
            },
          })),
        },
      };

      labeller = new OwnerLabeller(github, event);
    });

    it('adds labels properly, including an INFO log', async () => {
      const expectedLabels = ['label1', 'label2'];

      await labeller.label(app);

      expect(app.log.info).
          toHaveBeenCalledWith(`Labels added to the issue: ${expectedLabels}`);
      expect(github.issues.addLabels).toHaveBeenCalledWith({
        owner: 'mdelapenya',
        repo: 'probot-codeowners-labellers',
        issue_number: 17,
        labels: expectedLabels,
      });
    });
  });
});
