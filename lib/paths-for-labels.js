const minimatch = require('minimatch');
const yaml = require('js-yaml');

module.exports = function(contents) {
  const globData = new Map();

  const pathsForLabels = yaml.safeLoad(Buffer.from(contents).toString());

  for (const label in pathsForLabels) {
    if (!pathsForLabels.hasOwnProperty(label)) {
      continue;
    }

    const pathsForLabel = pathsForLabels[label];

    const labels = Object.keys(pathsForLabel);
    labels.forEach((label) => {
      const globs = pathsForLabel[label];

      globs.forEach((glob) => {
        let globLabels = [];
        if (globData[glob]) {
          globLabels = globData[glob].labels;

          if (!globLabels) {
            globLabels = [];
          }
        }

        // do not add empty labels, as this is the marker for excluded paths
        if (label !== '') {
          globLabels.push(label);
        }

        globData[glob] = {
          labels: globLabels,
        };
      });
    });
  }

  return {
    for(path) {
      const result = processGlobs(path, globData);

      return result.labels;
    },
  };
};

/**
 * Selects the data for a specific path, that will be matched against a file
 * path pattern using 'minimatch'. The glob will be massaged (removing trailing
 * slashes and appending globs at the end) in specific cases for 'minimatch'.
 *
 * @param {*} path path to retrieve its data
 * @param {*} data existing data for globs
 * @return {*} an object containing owners and labels for a path
 */
function processGlobs(path, data) {
  // keys must preserve chronological order!!
  // https://www.stefanjudis.com/today-i-learned/property-order-is-predictable-in-javascript-objects-since-es2015/
  const keys = Object.keys(data);

  const result = keys.filter((globs) => {
    return !globs || globs.split(' ').find((glob) => {
      if (glob.startsWith('/')) {
        // remove trailing slash
        glob = glob.substr(1);
      }
      if (glob.endsWith('/')) {
        // add glob to the path
        glob += '**';
      }

      return minimatch(path, glob);
    });
  }).map((g) => data[g]);

  // fallback for non-present paths
  if (!result || result.length == 0) {
    return {
      labels: [],
    };
  }

  // last element takes precedence
  return result[result.length - 1];
}
