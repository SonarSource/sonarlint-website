window.onhashchange = function () {
    App.Controller.hashChanged();
};

var container = document.getElementById("sidebar-container");
container.onscroll = function (ev) {
    container.scrollLeft = 0;
};

(<any>location).parseHash = function () {
    var hash = (this.hash || '').replace(/^#/, '').split('&'),
        parsed = {};

    for (var i = 0, el; i < hash.length; i++) {
        el = hash[i].split('=')
        parsed[el[0]] = el[1];
    }
    return parsed;
};

class App {
    static Controller: Controllers.RuleController;
}

window.onload = () => {
    App.Controller = new Controllers.RuleController();
}