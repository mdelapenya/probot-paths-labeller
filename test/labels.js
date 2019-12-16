const expect = require('expect');
const elasticLabels = require('../lib/labels');

describe('Labels', () => {
  it('returns an existing label', () => {
    expect(elasticLabels('@elastic/apm-ui')).toEqual(['Team:apm']);
  });

  it('returns undefined for a non existing label', () => {
    expect(elasticLabels('@elastic/observabilty-robots')).toEqual(undefined);
  });
});
