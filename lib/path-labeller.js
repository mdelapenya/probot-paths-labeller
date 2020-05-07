const pathsForLabels = require('./paths-for-labels');

module.exports = class PathLabeller {
  /**
   * Constructor for the PathLabeller
   * @param {*} github the Github object
   * @param {*} event the payload
   */
  constructor(github, event) {
    this.github = github;
    this.event = event;
  }

  /**
   * Retrives a PathsLabeller file from file in the repository
   */
  async getLabels(app) {
    const options = Object.assign({
      path: '.github/paths-labeller.yml',
      owner: this.repo.owner,
      repo: this.repo.name,
      ref: this.event.payload.pull_request.base.ref,
    });
    let data;
    try {
      data = await this.github.repos.getContents(options);
    }
    catch (err) {
      app.log.warn(`(${err}) while reading the path-labeller.yml file in the repository. Using an empty one as fallback`);
      data = {
        data: {
          content: ''
        }
      };
    }

    return pathsForLabels(Buffer.from(data.data.content, 'base64').toString());
  }

  /**
   * Labels current pull request based on the descriptor file
   *
   * @param {*} app Probot application. We need it to get access to its logger
   */
  async label(app) {
    const compare = await this.github.repos.compareCommits(Object.assign({
      base: this.event.payload.pull_request.base.sha,
      head: this.event.payload.pull_request.head.sha,
      owner: this.repo.owner,
      repo: this.repo.name,
    }));

    const paths = compare.data.files.map((file) => file.filename);
    const labels = await this.getLabels(app);

    const labelsToAdd = new Set();
    paths.forEach((p) => {
      const pathLabels = labels.for(p);
      if (pathLabels) {
        pathLabels.forEach((label) => {
          labelsToAdd.add(label);
        });
      }
    });

    const arr = Array.from(labelsToAdd);
    if (arr && arr.length > 0) {
      app.log.info(`Labels added to the issue: ${arr}`);
    } else {
      app.log.info('No labels will be added to the issue');
    }

    return this.github.issues.addLabels({
      owner: this.repo.owner,
      repo: this.repo.name,
      issue_number: this.event.payload.pull_request.number,
      labels: arr,
    });
  }

  /**
   * Retrieves the repository object from the event payload
   */
  get repo() {
    return {
      owner: this.event.payload.repository.owner.login,
      name: this.event.payload.repository.name,
    };
  }
};
