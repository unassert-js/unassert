function add(a, b) {
    if (assert(a)) {
        return null;
    }
    if (!assert(b)) {
        return null;
    }
    return a + b;
}
