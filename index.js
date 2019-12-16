const OwnerLabeller = require('./lib/owner-labeller');

module.exports = (app) => {
  const label = async function(context) {
    const ownerLabeller = new OwnerLabeller(context.github, context);

    return ownerLabeller.label();
  };

  app.on('pull_request.opened', label);
  app.on('pull_request.synchronize', label);
};
