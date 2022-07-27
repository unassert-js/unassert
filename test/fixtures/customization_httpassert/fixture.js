'use strict';

var assert = require('http-assert');
var ok = require('node:assert');

try {
    assert(username == 'foo', 401, 'authentication failed');
} catch (err) {
    ok(err.status == 401);
    ok(err.message == 'authentication failed');
    ok(err.expose);
}
