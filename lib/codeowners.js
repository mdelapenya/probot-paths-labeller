const minimatch = require('minimatch');

const EMAIL_FORMAT = /^\S+@\S+$/;

module.exports = function(contents) {
  const globOwners = new Map();

  contents.split('\n').forEach((line) => {
    const trimmedLine = line.trim();

    // discard comments
    if (trimmedLine.startsWith('#')) {
      return;
    }

    const lineGlobs = [];
    const lineOwners = [];

    // split by any number of whitespaces
    const tokens = trimmedLine.split(/(\s+)/);
    tokens.forEach((token) => {
      const isEmail = EMAIL_FORMAT.exec(token);
      if (isEmail) {
        // email
        lineOwners.push(token);
      } else if (token.startsWith('@')) {
        // github user or team
        lineOwners.push(token);
      } else if (token !== null && token.trim() !== '') {
        // glob pattern
        lineGlobs.push(token);
      }
    });

    lineGlobs.forEach((glob) => {
      globOwners[glob] = lineOwners;
    });
  });

  // keys must preserve chronological order!!
  // https://www.stefanjudis.com/today-i-learned/property-order-is-predictable-in-javascript-objects-since-es2015/
  const globKeys = Object.keys(globOwners);

  return {
    for(path) {
      const result = globKeys.filter((globs) => {
        return !globs || globs.split(' ').find((glob) => minimatch(path, glob));
      }).map((owner) => globOwners[owner]);

      // last element takes precedence
      return result[result.length - 1];
    },
  };
};
