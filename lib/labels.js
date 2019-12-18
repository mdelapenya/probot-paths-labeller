const labels = {
  '@elastic/apm-ui': 'Team:apm',
  '@elastic/kibana-app-arch': 'Team:AppArch',
  '@elastic/logs-metrics-ui': 'Team:logs-metrics-ui',
};

module.exports = function(team) {
  return labels[team];
};
