# Probot: CODEOWNERS labeller

> a GitHub App built with [Probot](https://github.com/probot/probot) that adds labels in Pull Requests based on contents of the CODEOWNERS.

## Usage

1. **[Install the app](https://github.com/apps/elastic-codeowners-labeller)**.
2. Create a `CODEOWNERS` file in your repository, under the `.github` directory.
3. Wait for new Pull Requests to be opened or synchronised.

## Important considerations
The labels are based on Elastic criteria, so please update your [`labels.js`](./lib/labels.js) file in consequence.
