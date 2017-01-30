const codeowners = require('./codeowners');

const labels = {
  '@elastic/apm-ui': 'Team:apm',
};

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
    const data = await this.github.repos.getContent(options);

    return codeowners(Buffer.from(data.data.content, 'base64').toString());
  }

  /**
   * Labels current pull request based on the codeowners
   */
  async label() {
    const compare = await this.github.repos.compareCommits(Object.assign({
      base: this.event.payload.pull_request.base.sha,
      head: this.event.payload.pull_request.head.sha,
    }, this.repo));

    const paths = compare.data.files.map((file) => file.filename);
    const owners = await this.getOwners();

    const labelsToAdd = [];
    paths.forEach((p) => {
      const label = labels[owners.for(p)];
      labelsToAdd.push(label);
    });

    return this.github.issues.addLabels(this.github.issue({
      labelsToAdd: labelsToAdd,
    }));
  }

  /**
   * Retrieves the repository object from the event payload
   */
  get repo() {
    return {
      owner: this.event.payload.repository.owner.login,
      repo: this.event.payload.repository.name,
    };
  }
};
