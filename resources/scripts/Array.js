Array.prototype.intersect = function (b) {
    return this.filter(function (e) {
        if (b.indexOf(e) !== -1) {
            return true;
        }
    });
};
Array.prototype.union = function (b) {
    var x = this.concat(b);
    return x.filter(function (elem, index) {
        return x.indexOf(elem) === index;
    });
};
Array.prototype.diff = function (b) {
    return this.filter(function (i) {
        return b.indexOf(i) < 0;
    });
};
//# sourceMappingURL=Array.js.map