const PathLabeller = require('./lib/path-labeller');

module.exports = (app) => {
  const label = async function(context) {
    const pathLabeller = new PathLabeller(context.github, context);

    return pathLabeller.label(app);
  };

  const events = [
    'pull_request.opened',
    'pull_request.synchronize',
  ];
  app.log.info('probot-paths-labeller loaded');

  app.on(events, label);
};
