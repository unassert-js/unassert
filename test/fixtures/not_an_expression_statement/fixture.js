function add(a, b) {
    isTrue(!isNaN(a), 'message');
    if (isTrue(a)) {
        return null;
    }
    console.assert(a);
    if (!isTrue(b)) {
        return null;
    }
    return a + b;
}
