const codeowners = require('./codeowners');
const labels = require('./labels');

module.exports = class OwnerLabeller {
  /**
   * Constructor for the OwnerLabeller
   * @param {*} github the Github object
   * @param {*} event the payload
   */
  constructor(github, event) {
    this.github = github;
    this.event = event;
  }

  /**
   * Retrives a Codeowners file from file in the repository
   */
  async getOwners() {
    const options = Object.assign({path: '.github/CODEOWNERS'}, this.repo);
    const data = await this.github.repos.getContents(options);

    return codeowners(Buffer.from(data.data.content, 'base64').toString());
  }

  /**
   * Labels current pull request based on the codeowners
   *
   * @param {*} app Probot application. We need it to get access to its logger
   */
  async label(app) {
    const compare = await this.github.repos.compareCommits(Object.assign({
      base: this.event.payload.pull_request.base.sha,
      head: this.event.payload.pull_request.head.sha,
    }, this.repo));

    const paths = compare.data.files.map((file) => file.filename);
    const owners = await this.getOwners();

    const labelsToAdd = new Set();
    paths.forEach((p) => {
      const label = labels(owners.for(p));
      if (label) {
        labelsToAdd.add(label);
      }
    });

    const arr = Array.from(labelsToAdd);
    app.log.info(`Labels added to the issue: ${arr}`);

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
