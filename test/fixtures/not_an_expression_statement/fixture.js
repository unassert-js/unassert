function add(a, b) {
    assert(!isNaN(a), 'assertion message');
    if (assert(a)) {
        return null;
    }
    console.assert(a);
    if (!assert(b)) {
        return null;
    }
    return a + b;
}
