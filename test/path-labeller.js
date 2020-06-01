const expect = require('expect');
const PathLabeller = require('../lib/path-labeller');

describe('PathLabeller', () => {
  const BASE_SHA = '1234567890abcdef1234567890abcdef12345678';
  const HEAD_SHA = '234567890abcdef1234567890abcdef123456789';
  const ISSUE_NUMBER = 42;

  const config = `---
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
  - "*.doc"
- "label7":
  - "*.doc"
- "label-precedence":
  - "README.md"`;

  let app;
  let event;
  let github;
  let labeller;

  beforeEach(() => {
    app = {
      log: {
        info: expect.createSpy(),
        warn: expect.createSpy(),
      },
    };

    event = {
      payload: {
        pull_request: {
          user: {login: 'test'},
          base: {
            ref: 'master',
          },
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
      labeller = new PathLabeller(github, event);
    });

    it('extracts the right information', () => {
      expect(labeller.repo).toMatch({owner: 'foo', name: 'bar'});
      expect(github).toNotHaveBeenCalled();
    });
  });

  describe('getLabels', () => {
    beforeEach(() => {
      event.payload.pull_request.base.ref = 'master';
    });

    it('returns a fallback object when paths-labeller.yml is not present', async () => {
      github = {
        repos: {
          getContents: expect.createSpy().andThrow(new Error('HttpError: Not Found')),
        },
      };

      event.payload.pull_request.base.ref = '7.x';
      labeller = new PathLabeller(github, event);

      const labelsFile = await labeller.getLabels(app);

      expect(app.log.warn).
          toHaveBeenCalledWith('(Error: HttpError: Not Found) while reading the path-labeller.yml file in the repository. Using an empty one as fallback');
      expect(labelsFile).toExist();
      expect(labelsFile.for).toExist();
      expect(github.repos.getContents).toHaveBeenCalledWith({
        owner: 'foo',
        repo: 'bar',
        path: '.github/paths-labeller.yml',
        ref: '7.x',
      });
    });

    it('returns an labelsFile object from the paths-labeller.yml file', async () => {
      github = {
        repos: {
          getContents: expect.createSpy().andReturn(Promise.resolve({
            data: {
              content: Buffer.from(config).toString('base64'),
            },
          })),
        },
      };

      labeller = new PathLabeller(github, event);

      const labelsFile = await labeller.getLabels(app);

      expect(labelsFile).toExist();
      expect(labelsFile.for).toExist();
      expect(github.repos.getContents).toHaveBeenCalledWith({
        owner: 'foo',
        repo: 'bar',
        path: '.github/paths-labeller.yml',
        ref: 'master',
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
            draft: false,
            head: {
              sha: HEAD_SHA,
            },
            number: 17,
          },
          repository: {
            name: 'probot-paths-labellers',
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
              content: Buffer.from(config).toString('base64'),
            },
          })),
        },
      };

      labeller = new PathLabeller(github, event);
    });

    it('adds labels properly, including an INFO log', async () => {
      const expectedLabels = ['label1', 'label2'];

      await labeller.label(app);

      expect(app.log.info).
          toHaveBeenCalledWith(`Labels added to the issue: ${expectedLabels}`);
      expect(github.issues.addLabels).toHaveBeenCalledWith({
        owner: 'mdelapenya',
        repo: 'probot-paths-labellers',
        issue_number: 17,
        labels: expectedLabels,
      });
    });

    it('adds zero labels, including an INFO log', async () => {
      const expectedLabels = [];

      github.repos = {
        compareCommits: expect.createSpy().andReturn(Promise.resolve({
          data: {
            files: [
              {
                filename: 'LICENSE',
              },
            ],
          },
        })),
      };

      await labeller.label(app);

      expect(app.log.info).
          toHaveBeenCalledWith('No labels will be added to the issue');
      expect(github.issues.addLabels).toHaveBeenCalledWith({
        owner: 'mdelapenya',
        repo: 'probot-paths-labellers',
        issue_number: 17,
        labels: expectedLabels,
      });
    });

    it('adds zero labels on draft pull requests', async () => {
      const expectedLabels = [];

      event.payload.pull_request.draft = true;

      github.repos = {
        compareCommits: expect.createSpy().andReturn(Promise.resolve({
          data: {
            files: [
              {
                filename: 'LICENSE',
              },
            ],
          },
        })),
      };

      await labeller.label(app);

      expect(app.log.info).
          toHaveBeenCalledWith('The pull request is in draft state: no labels will be added');
      expect(github.issues.addLabels).toHaveBeenCalledWith({
        owner: 'mdelapenya',
        repo: 'probot-paths-labellers',
        issue_number: 17,
        labels: expectedLabels,
      });
    });
  });
});
