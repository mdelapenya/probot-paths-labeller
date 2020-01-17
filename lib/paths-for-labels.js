const minimatch = require('minimatch');
const yaml = require('js-yaml');

module.exports = function(contents) {
  const globData = new Map();

  const pathsForLabels = yaml.safeLoad(Buffer.from(contents).toString());

  for (const index in pathsForLabels) {
    if (!pathsForLabels.hasOwnProperty(index)) {
      continue;
    }

    const pathsForLabel = pathsForLabels[index];

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

        globLabels.push(label);

        globData[glob] = {
          labels: globLabels,
        };
      });
    });
  }

  return {
    for(path) {
      const results = processGlobs(path, globData);

      // plain all labels into one single array
      const labels = [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const resultLabels = result.labels;

        if (isExcluded(resultLabels)) {
          return [];
        }

        resultLabels.forEach((resultLabel) => {
          labels.push(resultLabel);
        });
      }

      return labels;
    },
  };
};

/**
 * Returns true if the labels array is empty or if it contains the empty label
 *
 * @param {*} labels labels for a specific path
 * @return {*} if the path must be excluded
 */
function isExcluded(labels) {
  if (labels && labels.length == 0) {
    return true;
  }

  return labels.includes('');
}

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

  return result;
}
