var Controllers;
(function (Controllers) {
    var RuleController = (function () {
        function RuleController() {
            var hash = this.getHash(location.hash || '');
            this.openRequestedPage(hash);
            this.handleSidebarResizing();
            this.handleFilterToggle();
        }
        RuleController.prototype.handleFilterToggle = function () {
            var _this = this;
            $('#rule-menu-filter ul').on('change', 'input', function (event) {
                var item = $(event.currentTarget);
                var checked = item.prop('checked');
                var newHash = _this.getHash(location.hash || '');
                newHash.tags = _this.getFilterSettings();
                location.hash = _this.changeHash(newHash);
            });
        };
        RuleController.prototype.getFilterSettings = function () {
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
        RuleController.prototype.handleSidebarResizing = function () {
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
        RuleController.prototype.openRequestedPage = function (hash) {
            var _this = this;
            if (!hash.version) {
                this.handleVersionError();
                return;
            }
            var requestedVersion = hash.version;
            if (!(new RegExp(/^([a-zA-Z0-9-\.]+)$/)).test(requestedVersion)) {
                this.handleVersionError();
                return;
            }
            //display page:
            this.getContentsForVersion(requestedVersion, function () {
                _this.renderMenu(hash);
                if (!hash.ruleId) {
                    _this.renderMainPage(hash);
                    _this.fixRuleLinks(hash);
                    document.title = 'SonarLint for Visual Studio - Version ' + hash.version;
                }
                else {
                    _this.renderRulePage(hash);
                    _this.fixRuleLinks(hash);
                    document.title = 'SonarLint for Visual Studio - Rule ' + hash.ruleId;
                }
            });
        };
        RuleController.prototype.renderMenu = function (hash) {
            var menu = $("#rule-menu");
            var currentVersion = menu.attr("data-version");
            if (currentVersion == this.currentVersion) {
                this.applyFilters(hash);
                return;
            }
            menu.empty();
            for (var i = 0; i < this.currentRules.length; i++) {
                var li = $(Template.eval(Template.RuleMenuItem, {
                    currentVersion: this.currentVersion,
                    rule: this.currentRules[i]
                }));
                li.data('rule', this.currentRules[i]);
                menu.append(li);
            }
            menu.attr("data-version", this.currentVersion);
            $("#rule-menu-header").html(Template.eval(Template.RuleMenuHeaderVersion, this));
            this.renderFilters(hash);
        };
        RuleController.prototype.renderMainPage = function (hash) {
            this.renderMainContent(this.currentDefaultContent, hash);
        };
        RuleController.prototype.renderRulePage = function (hash) {
            for (var i = 0; i < this.currentRules.length; i++) {
                if (this.currentRules[i].Key == hash.ruleId) {
                    this.renderMainContent(Template.eval(Template.RulePageContent, this.currentRules[i]), hash);
                    return;
                }
            }
            this.handleRuleIdError(false);
        };
        RuleController.prototype.renderMainContent = function (content, hash) {
            var doc = document.documentElement;
            var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
            document.getElementById("content").innerHTML = content;
            this.fixRuleLinks(hash);
            window.scrollTo(left, 0);
        };
        RuleController.prototype.renderFilters = function (hash) {
            var filterList = $('#rule-menu-filter > ul');
            filterList.empty();
            for (var i = 0; i < 10; i++) {
                var filter = Template.eval(Template.RuleFilterElement, { tag: this.currentAllTags[i].Tag });
                filterList.append($(filter));
            }
            var others = Template.eval(Template.RuleFilterElement, { tag: 'others' });
            filterList.append($(others));
            this.applyFilters(hash);
        };
        RuleController.prototype.applyFilters = function (hash) {
            $('#rule-menu-filter input').each(function (index, elem) {
                var input = $(elem);
                input.prop('checked', $.inArray(input.attr('id'), hash.tags) != -1);
            });
            var tagsToFilterFor = this.getTagsToFilterFromHash(hash);
            var tagsWithOwnCheckbox = $('#rule-menu-filter input').map(function (index, element) { return $(element).attr('id'); }).toArray();
            tagsWithOwnCheckbox.splice(tagsWithOwnCheckbox.indexOf('others'), 1);
            var filterForOthers = hash.tags.indexOf('others') != -1;
            if (filterForOthers) {
                tagsToFilterFor.splice(tagsToFilterFor.indexOf('others'), 1);
                var others = $.map(this.currentAllTags, function (element, index) { return element.Tag; }).diff(tagsWithOwnCheckbox);
                tagsToFilterFor = tagsToFilterFor.concat(others);
            }
            $('#rule-menu li').each(function (index, elem) {
                var li = $(elem);
                var liTags = li.data('rule').Tags;
                var commonTags = liTags.intersect(tagsToFilterFor);
                var hasNoTags = liTags.length == 0;
                var showLiWithNoTags = hasNoTags && filterForOthers;
                var showEverything = tagsToFilterFor.length == 0;
                li.toggle(commonTags.length > 0 || showLiWithNoTags || showEverything);
            });
            $('#rule-menu li:visible').filter(':odd').css({ 'background-color': 'rgb(243, 243, 243)' });
            $('#rule-menu li:visible').filter(':even').css({ 'background-color': 'white' });
        };
        RuleController.prototype.splitWithTrim = function (text, splitter) {
            return $.map(text.split(splitter), function (elem, index) { return elem.trim(); });
        };
        RuleController.prototype.getTagsToFilterFromHash = function (hash) {
            var tagsToFilter = hash.tags.slice(0);
            for (var i = tagsToFilter.length - 1; i >= 0; i--) {
                if (tagsToFilter[i] === '') {
                    tagsToFilter.splice(i, 1);
                }
            }
            return tagsToFilter;
        };
        RuleController.prototype.handleRuleIdError = function (hasMenuIssueToo) {
            if (hasMenuIssueToo) {
                document.getElementById("content").innerHTML = Template.eval(Template.RuleErrorPageContent, { message: 'Couldn\'t find version' });
            }
            else {
                document.getElementById("content").innerHTML = Template.eval(Template.RuleErrorPageContent, { message: 'Couldn\'t find rule' });
            }
        };
        RuleController.prototype.handleVersionError = function () {
            this.handleRuleIdError(true);
            var menu = $('#rule-menu');
            menu.html('');
            menu.attr('data-version', '');
            $('#rule-menu-header').html(Template.eval(Template.RuleMenuHeaderVersionError, null));
            $('#rule-menu-filter').html('');
        };
        RuleController.prototype.fixRuleLinks = function (hash) {
            var _this = this;
            $('.rule-link').each(function (index, elem) {
                var link = $(elem);
                var currentHref = link.attr('href');
                var newHash = _this.getHash(currentHref);
                newHash.tags = hash.tags;
                link.attr('href', '#' + _this.changeHash(newHash));
            });
        };
        RuleController.prototype.getHash = function (input) {
            var hash = {
                version: RuleController.defaultVersion,
                ruleId: null,
                tags: null
            };
            var parsedHash = RuleController.parseHash(input);
            if (parsedHash.version) {
                hash.version = parsedHash.version;
            }
            if (parsedHash.ruleId) {
                hash.ruleId = parsedHash.ruleId;
            }
            var tags = '';
            if (parsedHash.tags) {
                tags = parsedHash.tags;
            }
            hash.tags = this.splitWithTrim(tags, ',');
            var emptyIndex = hash.tags.indexOf('');
            if (emptyIndex >= 0) {
                hash.tags.splice(emptyIndex);
            }
            return hash;
        };
        RuleController.parseHash = function (input) {
            var hash = input.replace(/^#/, '').split('&'), parsed = {};
            for (var i = 0, el; i < hash.length; i++) {
                el = hash[i].split('=');
                parsed[el[0]] = el[1];
            }
            return parsed;
        };
        RuleController.prototype.changeHash = function (hash) {
            var newHash = 'version=' + hash.version;
            if (hash.ruleId) {
                newHash += '&ruleId=' + hash.ruleId;
            }
            if (hash.tags) {
                var tags = '';
                for (var i = 0; i < hash.tags.length; i++) {
                    tags += ',' + hash.tags[i];
                }
                if (tags.length > 1) {
                    tags = tags.substr(1);
                }
                newHash += '&tags=' + tags;
            }
            return newHash;
        };
        RuleController.prototype.hashChanged = function () {
            var hash = this.getHash(location.hash || '');
            this.openRequestedPage(hash);
        };
        RuleController.prototype.getContentsForVersion = function (version, callback) {
            if (this.currentVersion != version) {
                var numberOfCompletedRequests = 0;
                var self = this;
                //load file
                this.getFile('../rules/' + version + '/rules.json', function (jsonString) {
                    self.currentVersion = version;
                    self.currentRules = JSON.parse(jsonString);
                    self.currentAllTags = [];
                    for (var i = 0; i < self.currentRules.length; i++) {
                        var tags = self.currentRules[i].Tags;
                        if (!Array.isArray(tags)) {
                            //handle the different versions of the input files.
                            self.currentRules[i].Tags = self.splitWithTrim(tags, ',');
                        }
                        var ruleTags = self.currentRules[i].Tags;
                        for (var tagIndex = 0; tagIndex < ruleTags.length; tagIndex++) {
                            var tag = ruleTags[tagIndex].trim();
                            var found = false;
                            for (var j = 0; j < self.currentAllTags.length; j++) {
                                if (self.currentAllTags[j].Tag == tag) {
                                    self.currentAllTags[j].Count++;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found && tag != '') {
                                self.currentAllTags.push({
                                    Count: 1,
                                    Tag: tag
                                });
                            }
                        }
                    }
                    self.currentAllTags.sort(function (a, b) {
                        if (a.Count > b.Count) {
                            return -1;
                        }
                        if (a.Count < b.Count) {
                            return 1;
                        }
                        return 0;
                    });
                    numberOfCompletedRequests++;
                    if (numberOfCompletedRequests == 2) {
                        callback();
                    }
                });
                this.getFile('../rules/' + version + '/index.html', function (data) {
                    self.currentDefaultContent = data;
                    numberOfCompletedRequests++;
                    if (numberOfCompletedRequests == 2) {
                        callback();
                    }
                });
                return;
            }
            callback();
        };
        RuleController.prototype.getFile = function (path, callback) {
            var self = this;
            this.loadFile(path, function (data) {
                callback(data);
            });
        };
        RuleController.prototype.loadFile = function (path, callback) {
            var self = this;
            var xobj = new XMLHttpRequest();
            xobj.open('GET', path, true);
            xobj.onload = function () {
                if (this.status == 200) {
                    callback(xobj.responseText);
                }
                else {
                    self.handleVersionError();
                }
            };
            xobj.send(null);
        };
        RuleController.defaultVersion = '1.3.0';
        return RuleController;
    })();
    Controllers.RuleController = RuleController;
})(Controllers || (Controllers = {}));
//# sourceMappingURL=RuleController.js.map