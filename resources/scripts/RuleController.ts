module Rule {

    export interface ImplementationMeta {
        key: string;
        title: string;
        description: string;
        language: string;
        severity: string;
        tags: string[];
    }

    export interface Meta {
        key: string;
        title: string;
        tags: string[];
        implementations: ImplementationMeta[];
    }

    export interface TagFrequency {
        tag: string;
        count: number;
    }
}

module Helpers {

    export class UrlParameters {
        public version: string;
        public ruleId: string;
        public tags: string[];
        public language: string;


        public load(input: string) {
            var parsedHash = UrlParameters.parseHash(input);
            this.loadFromObject(parsedHash);
        }
        protected loadFromObject(parsedHash: any) {
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
                tags = <string>parsedHash.tags;
            }
            this.tags = UrlParameters.splitWithTrim(tags, ',');
            var emptyIndex = this.tags.indexOf('');
            if (emptyIndex >= 0) {
                this.tags.splice(emptyIndex);
            }
        }
        private static splitWithTrim(text: string, splitter: string): string[] {
            return $.map(text.split(splitter), (elem, index) => { return elem.trim(); });
        }
        static parseHash(inputHash: string): any {
            var hash = inputHash.replace(/^#/, '').split('&'),
                parsed = {};

            for (var i = 0, el; i < hash.length; i++) {
                el = hash[i].split('=')
                parsed[el[0].toLowerCase()] = el[1];
            }
            return parsed;
        }
        public getTagsToFilterFor(): string[] {
            var tagsToFilter = this.tags.slice(0);

            for (var i = tagsToFilter.length - 1; i >= 0; i--) {
                if (tagsToFilter[i] === '') {
                    tagsToFilter.splice(i, 1);
                }
            }
            return tagsToFilter;
        }

        protected getVersionStringForHash() {
            return 'version=' + this.version;
        }
        protected getContentStringForHash() {
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
        }

        public getHash(): string {
            return this.getVersionStringForHash() + this.getContentStringForHash();
        }
    }

    export class FileLoader {
        public static loadFile(path: string, successCallback: Function, errorCallback: Function) {
            var xobj = new XMLHttpRequest();
            xobj.open('GET', path, true);
            xobj.onload = function () {
                if (this.status != 200) {
                    errorCallback();
                }
                successCallback(xobj.responseText);
            };
            xobj.send(null);
        }
    }

    export class ContentRenderer {
        sonarlintVersionDescription: SonarLint.VersionDescription;
        urlParameters: Helpers.UrlParameters;
        numberOfTagsToDisplay: number;
        pageController: Controllers.RulePageControllerBase;

        constructor(urlParameters: Helpers.UrlParameters, pageController: Controllers.RulePageControllerBase) {
            this.urlParameters = urlParameters;
            this.pageController = pageController;

            this.numberOfTagsToDisplay = pageController.numberOfTagsToDisplay;
            this.sonarlintVersionDescription = pageController.displayedVersion;
        }

        public renderMainPage() {
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
        }
        public renderRulePage() {
            for (var i = 0; i < this.sonarlintVersionDescription.rules.length; i++) {
                if (this.sonarlintVersionDescription.rules[i].key.toLowerCase() == this.urlParameters.ruleId.toLowerCase()) {

                    var rule = this.sonarlintVersionDescription.rules[i];

                    //sort implementations
                    rule.implementations.sort((a, b) => {
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
                        var ruleLanguages = rule.implementations.map(i=> i.language.toLowerCase());
                        var index = ruleLanguages.indexOf(lang);
                        if (index != -1) {
                            $($('div.rule-details-container.tabs input[type=radio]')[index]).prop("checked", true);
                        }
                    }

                    return;
                }
            }
            this.displayRuleIdError(false);
        }
        public highlightRule(ruleId: string) {
            $('#rule-menu li:visible').each((index, elem) => {
                var li = $(elem);
                var rule = <Rule.Meta><any>li.data('rule');
                if (rule.key.toLowerCase() == ruleId.toLowerCase()) {
                    li.css({ 'background-color': '#C9E6FF' });
                }
            });
        }

        public renderMainContent(content: string) {
            var doc = document.documentElement;
            var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);

            document.getElementById("content").innerHTML = content;
            this.pageController.fixRuleLinks(this.urlParameters);

            window.scrollTo(left, 0);
        }
        public renderMenu() {
            var menu = $("#rule-menu");
            var currentVersion = menu.attr("data-version");
            var languages = this.sonarlintVersionDescription.getSupportedLanguages();
            var loweredLanguages = languages.map(l=> l.toLowerCase());
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
        }

        private renderMenuItems(menu: JQuery) {
            menu.empty();

            for (var i = 0; i < this.sonarlintVersionDescription.rules.length; i++) {
                var li = $(Template.eval(Template.RuleMenuItem, {
                    currentVersion: this.sonarlintVersionDescription.version,
                    rule: this.sonarlintVersionDescription.rules[i]
                }));
                li.data('rule', this.sonarlintVersionDescription.rules[i]);
                menu.append(li);
            }
        }

        public renderFilters() {
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
        }

        public displayRuleIdError(hasMenuIssueToo: boolean) {
            if (hasMenuIssueToo) {
                document.getElementById("content").innerHTML = Template.eval(Template.RuleErrorPageContent, { message: 'Couldn\'t find version' });
            }
            else {
                document.getElementById("content").innerHTML = Template.eval(Template.RuleErrorPageContent, { message: 'Couldn\'t find rule' });
            }
        }
        public displayVersionError() {
            this.displayRuleIdError(true);

            var menu = $('#rule-menu');
            menu.html('');
            menu.attr('data-version', '');
            $('#rule-menu-header').html(Template.eval(Template.RuleMenuHeaderVersionError, null));
            $('#rule-menu-filter').html('');
        }
    }
}

module SonarLint {

    export class VersionDescription {
        public version: string;
        public rules: Rule.Meta[];
        public defaultContent: string;
        supportedLanguages: string[] = null;
        public tagFrequencies: Rule.TagFrequency[] = null;

        getSupportedLanguages(): string[] {
            if (this.supportedLanguages == null) {
                var languages: string[] = [];
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
        }
        getTagFrequencies(): Rule.TagFrequency[] {
            if (this.tagFrequencies == null) {
                var tagFrequencies: Rule.TagFrequency[] = [];

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

                tagFrequencies.sort((a, b) => {
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
        }
    }

}

module Controllers {

    export abstract class RulePageControllerBase {
        defaultVersion: string = null;
        public displayedVersion: SonarLint.VersionDescription = null;
        toolName: string;
        public numberOfTagsToDisplay: number;

        urlParameterType: any;
        contentRendererType: any;

        constructor(toolName: string, defaultVersion: string, numberOfTagsToDisplay: number,
            urlParameterType: any, contentRendererType: any) {

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
        private subscribeToFilterToggle() {
            $('#rule-menu-filter ul').on('change', 'input', (event) => {
                var item = $(event.currentTarget);
                var checked = item.prop('checked');
                var newQueryParameters = this.getQueryParameters(location.hash || '');
                newQueryParameters.tags = this.getFilterSettings();
                location.hash = newQueryParameters.getHash();
            });
        }

        private getFilterSettings(): string[] {
            var turnedOnFilters = [];
            var inputs = $('#rule-menu-filter ul input');
            inputs.each((index, elem) => {
                var item = $(elem);
                var checked = item.prop('checked');
                if (checked) {
                    turnedOnFilters.push(item.attr('id'));
                }
            });

            return turnedOnFilters;
        }

        private subscribeToSidebarResizing() {
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
                })
            });
            $(document).mouseup(function (e) {
                $(document).unbind('mousemove');
            });
        }

        public hashChanged() {
            var queryParameters = this.getQueryParameters(location.hash || '');
            this.openRequestedPage(queryParameters);
        }

        private getQueryParameters(input: string): Helpers.UrlParameters {
            var hash: Helpers.UrlParameters = new this.urlParameterType();
            hash.version = this.defaultVersion;
            hash.load(input);
            return hash;
        }
        public openRequestedPage(urlParameters: Helpers.UrlParameters) {

            var errorHandlingRenderer: Helpers.ContentRenderer = new this.contentRendererType(
                urlParameters,
                this);


            if (!urlParameters.version) {
                errorHandlingRenderer.displayVersionError();
                return;
            }

            var requestedVersion = urlParameters.version;

            if (!(new RegExp(<any>/^([a-zA-Z0-9-\.]+)$/)).test(requestedVersion)) {
                errorHandlingRenderer.displayVersionError();
                return;
            }

            this.getContentsForVersion(requestedVersion, () => {

                var languages = this.displayedVersion.getSupportedLanguages().map(l=> l.toLowerCase());
                if (!urlParameters.language ||
                    languages.indexOf(urlParameters.language.toLowerCase()) == -1) {
                    urlParameters.language = null;
                }

                var renderer: Helpers.ContentRenderer = new this.contentRendererType(
                    urlParameters,
                    this);

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
            }, () => errorHandlingRenderer.displayVersionError());
        }


        public fixRuleLinks(urlParameters: Helpers.UrlParameters) {
            $('.rule-link').each((index, elem) => {
                var link = $(elem);
                var currentHref = link.attr('href');
                var newUrlParameters = this.getQueryParameters(currentHref);

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
        }


        public applyFilters(urlParameters: Helpers.UrlParameters) {

            var inputTagsLowered = urlParameters.tags.map(t=> t.toLowerCase());

            $('#rule-menu-filter input').each((index, elem) => {
                var input = $(elem);
                input.prop('checked', $.inArray(input.attr('id'), inputTagsLowered) != -1);
            });

            var tagsToFilterFor = urlParameters.getTagsToFilterFor().map(t=> t.toLowerCase());
            var tagsWithOwnCheckbox = <string[]>$('#rule-menu-filter input').map((index, element) => { return $(element).attr('id'); }).toArray();
            tagsWithOwnCheckbox.splice(tagsWithOwnCheckbox.indexOf('others'), 1);

            var filterForOthers = inputTagsLowered.indexOf('others') != -1;
            var tagFrequencies = this.displayedVersion.getTagFrequencies();
            if (filterForOthers) {
                tagsToFilterFor.splice(tagsToFilterFor.indexOf('others'), 1);
                var others = $.map(tagFrequencies, (element, index) => { return element.tag }).diff(tagsWithOwnCheckbox);
                tagsToFilterFor = tagsToFilterFor.concat(others);
            }

            $('#rule-menu li').each((index, elem) => {
                var li = $(elem);
                var rule = <Rule.Meta><any>li.data('rule');
                var liTags = [];

                var languageMatches = false;
                for (var tagIndex = 0; tagIndex < rule.tags.length; tagIndex++) {
                    liTags.push(rule.tags[tagIndex].toLowerCase());
                }

                if (urlParameters.language == null) {
                    languageMatches = true;
                } else {
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
        }

        private getContentsForVersion(version: string, successCallback: Function, errorCallback: Function) {
            if (this.displayedVersion == null ||
                this.displayedVersion.version != version) {

                var numberOfCompletedRequests = 0;
                var self = this;

                this.displayedVersion = new SonarLint.VersionDescription();
                this.displayedVersion.version = version;

                //load file
                Helpers.FileLoader.loadFile('../rules/' + version + '/rules.json', (jsonString) => {

                    var ruleConfig = JSON.parse(jsonString);

                    this.displayedVersion.rules = ruleConfig.rules;

                    numberOfCompletedRequests++;
                    if (numberOfCompletedRequests == 2) {
                        successCallback();
                    }
                }, errorCallback);
                Helpers.FileLoader.loadFile('../rules/' + version + '/index.html', (data) => {

                    this.displayedVersion.defaultContent = data;

                    numberOfCompletedRequests++;
                    if (numberOfCompletedRequests == 2) {
                        successCallback();
                    }
                }, errorCallback);
                return;
            }

            successCallback();
        }
    }

    export class RulePageController extends RulePageControllerBase {
        constructor(toolName: string, defaultVersion: string, numberOfTagsToDisplay: number = 10) {
            super(toolName, defaultVersion, numberOfTagsToDisplay, Helpers.UrlParameters, Helpers.ContentRenderer);
        }
    }
}