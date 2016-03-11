var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Helpers;
(function (Helpers) {
    var UrlParameters = (function () {
        function UrlParameters() {
        }
        UrlParameters.prototype.load = function (input) {
            var parsedHash = UrlParameters.parseHash(input);
            this.loadFromObject(parsedHash);
        };
        UrlParameters.prototype.loadFromObject = function (parsedHash) {
            if (parsedHash.version) {
                this.version = parsedHash.version;
            }
            if (parsedHash.ruleid) {
                this.ruleId = parsedHash.ruleid;
            }
            if (parsedHash.language) {
                this.language = parsedHash.language;
            }
            var tags = '';
            if (parsedHash.tags) {
                tags = parsedHash.tags;
            }
            this.tags = UrlParameters.splitWithTrim(tags, ',');
            var emptyIndex = this.tags.indexOf('');
            if (emptyIndex >= 0) {
                this.tags.splice(emptyIndex);
            }
        };
        UrlParameters.splitWithTrim = function (text, splitter) {
            return $.map(text.split(splitter), function (elem, index) { return elem.trim(); });
        };
        UrlParameters.parseHash = function (inputHash) {
            var hash = inputHash.replace(/^#/, '').split('&'), parsed = {};
            for (var i = 0, el; i < hash.length; i++) {
                el = hash[i].split('=');
                parsed[el[0].toLowerCase()] = el[1];
            }
            return parsed;
        };
        UrlParameters.prototype.getTagsToFilterFor = function () {
            var tagsToFilter = this.tags.slice(0);
            for (var i = tagsToFilter.length - 1; i >= 0; i--) {
                if (tagsToFilter[i] === '') {
                    tagsToFilter.splice(i, 1);
                }
            }
            return tagsToFilter;
        };
        UrlParameters.prototype.getVersionStringForHash = function () {
            return 'version=' + this.version;
        };
        UrlParameters.prototype.getContentStringForHash = function () {
            var newHash = '';
            if (this.ruleId) {
                newHash += '&ruleId=' + this.ruleId;
            }
            if (this.tags && this.tags.length && this.tags.length != 0) {
                var tags = '';
                for (var i = 0; i < this.tags.length; i++) {
                    tags += ',' + this.tags[i];
                }
                if (tags.length > 1) {
                    tags = tags.substr(1);
                }
                newHash += '&tags=' + tags;
            }
            if (this.language) {
                newHash += '&language=' + this.language;
            }
            return newHash;
        };
        UrlParameters.prototype.getHash = function () {
            return this.getVersionStringForHash() + this.getContentStringForHash();
        };
        return UrlParameters;
    })();
    Helpers.UrlParameters = UrlParameters;
    var FileLoader = (function () {
        function FileLoader() {
        }
        FileLoader.loadFile = function (path, successCallback, errorCallback) {
            var xobj = new XMLHttpRequest();
            xobj.open('GET', path, true);
            xobj.onload = function () {
                if (this.status != 200) {
                    errorCallback();
                }
                successCallback(xobj.responseText);
            };
            xobj.send(null);
        };
        return FileLoader;
    })();
    Helpers.FileLoader = FileLoader;
    var ContentRenderer = (function () {
        function ContentRenderer(urlParameters, pageController) {
            this.urlParameters = urlParameters;
            this.pageController = pageController;
            this.numberOfTagsToDisplay = pageController.numberOfTagsToDisplay;
            this.sonarlintVersionDescription = pageController.displayedVersion;
        }
        ContentRenderer.prototype.renderMainPage = function () {
            this.renderMainContent(this.sonarlintVersionDescription.defaultContent);
            //inject generic version information:
            var languages = this.pageController.displayedVersion.getSupportedLanguages();
            var counts = {};
            for (var i = 0; i < languages.length; i++) {
                counts[languages[i]] = 0;
            }
            for (var i = 0; i < this.pageController.displayedVersion.rules.length; i++) {
                for (var j = 0; j < this.pageController.displayedVersion.rules[i].implementations.length; j++) {
                    var implementation = this.pageController.displayedVersion.rules[i].implementations[j];
                    counts[implementation.language]++;
                }
            }
            var versionInfo = Template.eval(Template.VersionInfo, { controller: this.pageController, details: counts });
            document.getElementById("sonarlint-version-summary").innerHTML = versionInfo;
            this.pageController.fixRuleLinks(this.urlParameters);
        };
        ContentRenderer.prototype.renderRulePage = function () {
            for (var i = 0; i < this.sonarlintVersionDescription.rules.length; i++) {
                if (this.sonarlintVersionDescription.rules[i].key.toLowerCase() == this.urlParameters.ruleId.toLowerCase()) {
                    var rule = this.sonarlintVersionDescription.rules[i];
                    //sort implementations
                    rule.implementations.sort(function (a, b) {
                        if (a.language < b.language) {
                            return -1;
                        }
                        if (a.language > b.language) {
                            return 1;
                        }
                        return 0;
                    });
                    this.renderMainContent(Template.eval(Template.RulePageContent, rule));
                    if (this.urlParameters.language) {
                        var lang = this.urlParameters.language.toLowerCase();
                        var ruleLanguages = rule.implementations.map(function (i) { return i.language.toLowerCase(); });
                        var index = ruleLanguages.indexOf(lang);
                        if (index != -1) {
                            $($('div.rule-details-container.tabs input[type=radio]')[index]).prop("checked", true);
                        }
                    }
                    return;
                }
            }
            this.displayRuleIdError(false);
        };
        ContentRenderer.prototype.highlightRule = function (ruleId) {
            $('#rule-menu li:visible').each(function (index, elem) {
                var li = $(elem);
                var rule = li.data('rule');
                if (rule.key.toLowerCase() == ruleId.toLowerCase()) {
                    li.css({ 'background-color': '#C9E6FF' });
                }
            });
        };
        ContentRenderer.prototype.renderMainContent = function (content) {
            var doc = document.documentElement;
            var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
            document.getElementById("content").innerHTML = content;
            this.pageController.fixRuleLinks(this.urlParameters);
            window.scrollTo(left, 0);
        };
        ContentRenderer.prototype.renderMenu = function () {
            var menu = $("#rule-menu");
            var currentVersion = menu.attr("data-version");
            var languages = this.sonarlintVersionDescription.getSupportedLanguages();
            var loweredLanguages = languages.map(function (l) { return l.toLowerCase(); });
            var currentLanguage = this.urlParameters.language;
            var nextLanguage = null;
            if (currentLanguage == null) {
                nextLanguage = languages[0];
            }
            else {
                var currentindex = loweredLanguages.indexOf(currentLanguage.toLowerCase());
                currentLanguage = languages[currentindex];
                nextLanguage = currentindex == languages.length - 1 ? null : languages[currentindex + 1];
            }
            $("#rule-menu-header").html(Template.eval(Template.RuleMenuHeaderVersion, {
                controller: this.pageController,
                language: currentLanguage,
                nextLanguage: nextLanguage
            }));
            if (currentVersion == this.sonarlintVersionDescription.version) {
                this.pageController.applyFilters(this.urlParameters);
                return;
            }
            this.renderMenuItems(menu);
            menu.attr("data-version", this.sonarlintVersionDescription.version);
            this.renderFilters();
        };
        ContentRenderer.prototype.renderMenuItems = function (menu) {
            menu.empty();
            for (var i = 0; i < this.sonarlintVersionDescription.rules.length; i++) {
                var li = $(Template.eval(Template.RuleMenuItem, {
                    currentVersion: this.sonarlintVersionDescription.version,
                    rule: this.sonarlintVersionDescription.rules[i]
                }));
                li.data('rule', this.sonarlintVersionDescription.rules[i]);
                menu.append(li);
            }
        };
        ContentRenderer.prototype.renderFilters = function () {
            var filterList = $('#rule-menu-filter > ul');
            filterList.empty();
            var tagFrequencies = this.sonarlintVersionDescription.getTagFrequencies();
            for (var i = 0; i < this.numberOfTagsToDisplay && i < tagFrequencies.length; i++) {
                var filter = Template.eval(Template.RuleFilterElement, { tag: tagFrequencies[i].tag });
                filterList.append($(filter));
            }
            if (this.numberOfTagsToDisplay < tagFrequencies.length) {
                var others = Template.eval(Template.RuleFilterElement, { tag: 'others' });
                filterList.append($(others));
            }
            this.pageController.applyFilters(this.urlParameters);
        };
        ContentRenderer.prototype.displayRuleIdError = function (hasMenuIssueToo) {
            if (hasMenuIssueToo) {
                document.getElementById("content").innerHTML = Template.eval(Template.RuleErrorPageContent, { message: 'Couldn\'t find version' });
            }
            else {
                document.getElementById("content").innerHTML = Template.eval(Template.RuleErrorPageContent, { message: 'Couldn\'t find rule' });
            }
        };
        ContentRenderer.prototype.displayVersionError = function () {
            this.displayRuleIdError(true);
            var menu = $('#rule-menu');
            menu.html('');
            menu.attr('data-version', '');
            $('#rule-menu-header').html(Template.eval(Template.RuleMenuHeaderVersionError, null));
            $('#rule-menu-filter').html('');
        };
        return ContentRenderer;
    })();
    Helpers.ContentRenderer = ContentRenderer;
})(Helpers || (Helpers = {}));
var SonarLint;
(function (SonarLint) {
    var VersionDescription = (function () {
        function VersionDescription() {
            this.supportedLanguages = null;
            this.tagFrequencies = null;
        }
        VersionDescription.prototype.getSupportedLanguages = function () {
            if (this.supportedLanguages == null) {
                var languages = [];
                for (var i = 0; i < this.rules.length; i++) {
                    var currentRule = this.rules[i];
                    for (var j = 0; j < currentRule.implementations.length; j++) {
                        var language = currentRule.implementations[j].language;
                        if (languages.indexOf(language) == -1) {
                            languages.push(language);
                        }
                    }
                }
                languages.sort();
                this.supportedLanguages = languages;
            }
            return this.supportedLanguages;
        };
        VersionDescription.prototype.getTagFrequencies = function () {
            if (this.tagFrequencies == null) {
                var tagFrequencies = [];
                for (var i = 0; i < this.rules.length; i++) {
                    var currentRule = this.rules[i];
                    for (var tagIndex = 0; tagIndex < currentRule.tags.length; tagIndex++) {
                        var tag = currentRule.tags[tagIndex].trim();
                        if (tag == null || tag == '') {
                            continue;
                        }
                        var found = false;
                        for (var j = 0; j < tagFrequencies.length; j++) {
                            if (tagFrequencies[j].tag == tag) {
                                tagFrequencies[j].count++;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            tagFrequencies.push({
                                count: 1,
                                tag: tag
                            });
                        }
                    }
                }
                tagFrequencies.sort(function (a, b) {
                    if (a.count > b.count) {
                        return -1;
                    }
                    if (a.count < b.count) {
                        return 1;
                    }
                    return 0;
                });
                this.tagFrequencies = tagFrequencies;
            }
            return this.tagFrequencies;
        };
        return VersionDescription;
    })();
    SonarLint.VersionDescription = VersionDescription;
})(SonarLint || (SonarLint = {}));
var Controllers;
(function (Controllers) {
    var RulePageControllerBase = (function () {
        function RulePageControllerBase(toolName, defaultVersion, numberOfTagsToDisplay, urlParameterType, contentRendererType) {
            this.defaultVersion = null;
            this.displayedVersion = null;
            this.toolName = toolName;
            this.defaultVersion = defaultVersion;
            this.numberOfTagsToDisplay = numberOfTagsToDisplay;
            this.urlParameterType = urlParameterType;
            this.contentRendererType = contentRendererType;
            var queryParameters = this.getQueryParameters(location.hash || '');
            this.openRequestedPage(queryParameters);
            this.subscribeToSidebarResizing();
            this.subscribeToFilterToggle();
        }
        RulePageControllerBase.prototype.subscribeToFilterToggle = function () {
            var _this = this;
            $('#rule-menu-filter ul').on('change', 'input', function (event) {
                var item = $(event.currentTarget);
                var checked = item.prop('checked');
                var newQueryParameters = _this.getQueryParameters(location.hash || '');
                newQueryParameters.tags = _this.getFilterSettings();
                location.hash = newQueryParameters.getHash();
            });
        };
        RulePageControllerBase.prototype.getFilterSettings = function () {
            var turnedOnFilters = [];
            var inputs = $('#rule-menu-filter ul input');
            inputs.each(function (index, elem) {
                var item = $(elem);
                var checked = item.prop('checked');
                if (checked) {
                    turnedOnFilters.push(item.attr('id'));
                }
            });
            return turnedOnFilters;
        };
        RulePageControllerBase.prototype.subscribeToSidebarResizing = function () {
            var min = 150;
            var max = 750;
            var mainmin = 200;
            $('#sidebar-resizer').mousedown(function (e) {
                e.preventDefault();
                $(document).mousemove(function (e) {
                    e.preventDefault();
                    var x = e.pageX - $('#sidebar').offset().left;
                    if (x > min && x < max && e.pageX < ($(window).width() - mainmin)) {
                        $('#sidebar').css("width", x);
                        $('#content').css("margin-left", x);
                    }
                });
            });
            $(document).mouseup(function (e) {
                $(document).unbind('mousemove');
            });
        };
        RulePageControllerBase.prototype.hashChanged = function () {
            var queryParameters = this.getQueryParameters(location.hash || '');
            this.openRequestedPage(queryParameters);
        };
        RulePageControllerBase.prototype.getQueryParameters = function (input) {
            var hash = new this.urlParameterType();
            hash.version = this.defaultVersion;
            hash.load(input);
            return hash;
        };
        RulePageControllerBase.prototype.openRequestedPage = function (urlParameters) {
            var _this = this;
            var errorHandlingRenderer = new this.contentRendererType(urlParameters, this);
            if (!urlParameters.version) {
                errorHandlingRenderer.displayVersionError();
                return;
            }
            var requestedVersion = urlParameters.version;
            if (!(new RegExp(/^([a-zA-Z0-9-\.]+)$/)).test(requestedVersion)) {
                errorHandlingRenderer.displayVersionError();
                return;
            }
            this.getContentsForVersion(requestedVersion, function () {
                var languages = _this.displayedVersion.getSupportedLanguages().map(function (l) { return l.toLowerCase(); });
                if (!urlParameters.language ||
                    languages.indexOf(urlParameters.language.toLowerCase()) == -1) {
                    urlParameters.language = null;
                }
                var renderer = new _this.contentRendererType(urlParameters, _this);
                renderer.renderMenu();
                if (!urlParameters.ruleId) {
                    renderer.renderMainPage();
                    document.title = 'SonarLint for Visual Studio - Version ' + urlParameters.version;
                }
                else {
                    renderer.renderRulePage();
                    renderer.highlightRule(urlParameters.ruleId);
                    document.title = 'SonarLint for Visual Studio - Rule ' + urlParameters.ruleId;
                }
            }, function () { return errorHandlingRenderer.displayVersionError(); });
        };
        RulePageControllerBase.prototype.fixRuleLinks = function (urlParameters) {
            var _this = this;
            $('.rule-link').each(function (index, elem) {
                var link = $(elem);
                var currentHref = link.attr('href');
                var newUrlParameters = _this.getQueryParameters(currentHref);
                if (link.closest('div').attr('id') != 'sonarlint-version-summary') {
                    newUrlParameters.tags = urlParameters.tags;
                }
                else {
                    newUrlParameters.tags = null;
                }
                if (link.attr('id') != 'language-selector' &&
                    link.closest('div').attr('id') != 'sonarlint-version-summary') {
                    newUrlParameters.language = urlParameters.language;
                }
                else {
                    newUrlParameters.ruleId = urlParameters.ruleId;
                }
                link.attr('href', '#' + newUrlParameters.getHash());
            });
        };
        RulePageControllerBase.prototype.applyFilters = function (urlParameters) {
            var inputTagsLowered = urlParameters.tags.map(function (t) { return t.toLowerCase(); });
            $('#rule-menu-filter input').each(function (index, elem) {
                var input = $(elem);
                input.prop('checked', $.inArray(input.attr('id'), inputTagsLowered) != -1);
            });
            var tagsToFilterFor = urlParameters.getTagsToFilterFor().map(function (t) { return t.toLowerCase(); });
            var tagsWithOwnCheckbox = $('#rule-menu-filter input').map(function (index, element) { return $(element).attr('id'); }).toArray();
            tagsWithOwnCheckbox.splice(tagsWithOwnCheckbox.indexOf('others'), 1);
            var filterForOthers = inputTagsLowered.indexOf('others') != -1;
            var tagFrequencies = this.displayedVersion.getTagFrequencies();
            if (filterForOthers) {
                tagsToFilterFor.splice(tagsToFilterFor.indexOf('others'), 1);
                var others = $.map(tagFrequencies, function (element, index) { return element.tag; }).diff(tagsWithOwnCheckbox);
                tagsToFilterFor = tagsToFilterFor.concat(others);
            }
            $('#rule-menu li').each(function (index, elem) {
                var li = $(elem);
                var rule = li.data('rule');
                var liTags = [];
                var languageMatches = false;
                for (var tagIndex = 0; tagIndex < rule.tags.length; tagIndex++) {
                    liTags.push(rule.tags[tagIndex].toLowerCase());
                }
                if (urlParameters.language == null) {
                    languageMatches = true;
                }
                else {
                    for (var implementationIndex = 0; implementationIndex < rule.implementations.length; implementationIndex++) {
                        if (rule.implementations[implementationIndex].language.toLowerCase() == urlParameters.language.toLowerCase()) {
                            languageMatches = true;
                            break;
                        }
                    }
                }
                var commonTags = liTags.intersect(tagsToFilterFor);
                var hasNoTags = liTags.length == 0;
                var showLiWithNoTags = hasNoTags && filterForOthers;
                var showEverything = tagsToFilterFor.length == 0;
                li.toggle((commonTags.length > 0 || showLiWithNoTags || showEverything) && languageMatches);
            });
            $('#rule-menu li:visible').filter(':odd').css({ 'background-color': 'rgb(243, 243, 243)' });
            $('#rule-menu li:visible').filter(':even').css({ 'background-color': 'white' });
        };
        RulePageControllerBase.prototype.getContentsForVersion = function (version, successCallback, errorCallback) {
            var _this = this;
            if (this.displayedVersion == null ||
                this.displayedVersion.version != version) {
                var numberOfCompletedRequests = 0;
                var self = this;
                this.displayedVersion = new SonarLint.VersionDescription();
                this.displayedVersion.version = version;
                //load file
                Helpers.FileLoader.loadFile('../rules/' + version + '/rules.json', function (jsonString) {
                    var ruleConfig = JSON.parse(jsonString);
                    _this.displayedVersion.rules = ruleConfig.rules;
                    numberOfCompletedRequests++;
                    if (numberOfCompletedRequests == 2) {
                        successCallback();
                    }
                }, errorCallback);
                Helpers.FileLoader.loadFile('../rules/' + version + '/index.html', function (data) {
                    _this.displayedVersion.defaultContent = data;
                    numberOfCompletedRequests++;
                    if (numberOfCompletedRequests == 2) {
                        successCallback();
                    }
                }, errorCallback);
                return;
            }
            successCallback();
        };
        return RulePageControllerBase;
    })();
    Controllers.RulePageControllerBase = RulePageControllerBase;
    var RulePageController = (function (_super) {
        __extends(RulePageController, _super);
        function RulePageController(toolName, defaultVersion, numberOfTagsToDisplay) {
            if (numberOfTagsToDisplay === void 0) { numberOfTagsToDisplay = 10; }
            _super.call(this, toolName, defaultVersion, numberOfTagsToDisplay, Helpers.UrlParameters, Helpers.ContentRenderer);
        }
        return RulePageController;
    })(RulePageControllerBase);
    Controllers.RulePageController = RulePageController;
})(Controllers || (Controllers = {}));
