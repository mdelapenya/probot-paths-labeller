const minimatch = require('minimatch');

const EMAIL_FORMAT = /^\S+@\S+$/;
const PROBOT_NAME = 'probot-codeowners-labeller';

module.exports = function(contents) {
  const globData = new Map();

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

    let lineLabels = [];

    // process labels for our probot
    const commentsMetada = trimmedLine.substring(commentsPosition);
    const probotIndex = commentsMetada.indexOf(`@@${PROBOT_NAME}:`);
    if (probotIndex >= 0) {
      // our probots exist!
      const probotLine = commentsMetada.substring(probotIndex);
      // we do not support whitespace in the probot metadata, so it separates from others' metadata
      const probotTokens = probotLine.split(/(\s+)/);
      // discard all but the first one, which is our probot's metadata
      const probotCodeownerLabeller = probotTokens[0];
      // get metadada value
      const probotMetadataSeparatorIndex = probotCodeownerLabeller.indexOf(':');
      const probotMetadata = probotCodeownerLabeller.substring(probotMetadataSeparatorIndex + 1);
      const probotLabels = probotMetadata.split(',');
      probotLabels.forEach((probotLabel => {
        // remove double quotes for each label
        lineLabels.push(probotLabel.replace(/"/gi, ''));
      }));
    }

    lineGlobs.forEach((glob) => {
      globData[glob] = {
        labels: lineLabels,
        owners: lineOwners,
      };
    });
  });

  return {
    ownersFor(path) {
      const result = processGlobs(path, globData);

      return result.owners;
    },
    labelsFor(path) {
      const result = processGlobs(path, globData);

      return result.labels;
    },
  };
};

function processGlobs(path, data) {
  // keys must preserve chronological order!!
  // https://www.stefanjudis.com/today-i-learned/property-order-is-predictable-in-javascript-objects-since-es2015/
  const keys = Object.keys(data);

  const result = keys.filter((globs) => {
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
  }).map((g) => data[g]);

   // last element takes precedence
  return result[result.length - 1];
}