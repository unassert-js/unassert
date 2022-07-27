'use strict';

const htassert = require('http-assert');
const { ok, equal: eq, deepEqual: deq } = require('node:assert');

try {
    htassert(username == 'foo', 401, 'authentication failed');
} catch (err) {
    eq(err.status, 401);
    deq(err.message, 'authentication failed');
    ok(err.expose);
}
