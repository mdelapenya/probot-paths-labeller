const OwnerLabeller = require('./lib/owner-labeller');

module.exports = (app) => {
  const label = async function(context) {
    const ownerLabeller = new OwnerLabeller(context.github, context);

    return ownerLabeller.label(app);
  };

  const events = [
    'pull_request.opened',
    'pull_request.synchronize',
  ];
  app.log.info('probot-codeowner-labeller loaded');

  app.on(events, label);
};
