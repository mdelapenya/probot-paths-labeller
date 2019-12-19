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

    // split line by comment, which is the first ocurrence of the # char
    let commentsPosition = trimmedLine.indexOf('#');
    if (commentsPosition === -1) {
      commentsPosition = trimmedLine.length;
    }

    // process paths and owners
    const pathsAndOwners = trimmedLine.substring(0, commentsPosition);

    // split by any number of whitespaces
    const tokens = pathsAndOwners.split(/(\s+)/);
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
        return !globs || globs.split(' ').find((glob) => {
          if (glob.startsWith('/')) {
            // remove trailing slash, as Elastic's CODEOWNERS is not using it
            glob = glob.substr(1);
          }
          if (glob.endsWith('/')) {
            // add glob to the path
            glob += '**';
          }

          return minimatch(path, glob);
        });
      }).map((owner) => globOwners[owner]);

      // last element takes precedence
      return result[result.length - 1];
    },
  };
};
