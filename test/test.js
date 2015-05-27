'use strict';

var unassert = require('..');
var assert = require('assert');

describe('unassert', function () {
    it('removes assertions', function () {
        var ast = require('./fixtures/func/fixture.json');
        var actual = unassert(ast);
        var expected = require('./fixtures/func/expected.json');
        assert.deepEqual(actual, expected);
    });
});
