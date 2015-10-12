window.onhashchange = function () {
    App.Controller.hashChanged();
};
var container = document.getElementById("sidebar-container");
container.onscroll = function (ev) {
    container.scrollLeft = 0;
};
location.parseHash = function () {
    var hash = (this.hash || '').replace(/^#/, '').split('&'), parsed = {};
    for (var i = 0, el; i < hash.length; i++) {
        el = hash[i].split('=');
        parsed[el[0]] = el[1];
    }
    return parsed;
};
var App = (function () {
    function App() {
    }
    return App;
})();
window.onload = function () {
    App.Controller = new Controllers.RuleController();
};
//# sourceMappingURL=App.js.map