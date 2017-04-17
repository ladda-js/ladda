import { analyzeEntityRelationships } from './helper';

describe('subscriber helper', () => {
  describe('analyzeEntityRelationships', () => {
    it('returns an object to determine parents, views an invalidations per entity', () => {
      const config = {
        user: {
          api: {}
        },
        mediumUser: {
          api: {},
          viewOf: 'user',
          invalidates: ['activity']
        },
        miniUser: {
          api: {},
          viewOf: 'mediumUser'
        },
        activity: {
          api: {}
        }
      };

      const expected = {
        user: {
          views: ['mediumUser', 'miniUser'],
          parents: [],
          invalidatedBy: []
        },
        mediumUser: {
          views: ['miniUser'],
          parents: ['user'],
          invalidatedBy: []
        },
        miniUser: {
          views: [],
          parents: ['mediumUser', 'user'],
          invalidatedBy: []
        },
        activity: {
          views: [],
          parents: [],
          invalidatedBy: ['user', 'mediumUser', 'miniUser']
        }
      };

      const actual = analyzeEntityRelationships(config);

      expect(actual).to.deep.equal(expected);
    });
  });
});
