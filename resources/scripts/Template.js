var Template = (function () {
    function Template() {
    }
    Template.init = function () {
        Handlebars.registerHelper('language-text', function (lang) {
            return lang == null ? 'All' : lang;
        });
        Handlebars.registerHelper('next-language', function (lang) {
            return lang == null ? '' : '&language=' + lang;
        });
        Handlebars.registerHelper('rule-tags-visibility', function (tags) {
            if (!tags || tags == "" || (Array.isArray(tags) && tags.length == 0)) {
                return 'display: none;';
            }
            return '';
        });
        Handlebars.registerHelper('rule-severity-visibility', function (severity) {
            if (!severity) {
                return 'display: none;';
            }
            return '';
        });
        Handlebars.registerHelper('tab-activation', function (index, max, selectedIndex) {
            if (selectedIndex >= max) {
                if (index == 0) {
                    return 'checked';
                }
                return '';
            }
            if (selectedIndex == index) {
                return 'checked';
            }
            return '';
        });
        Handlebars.registerHelper('rule-tags-render', function (tags) {
            return tags.join(', ');
        });
        Template.RuleMenuItem = Handlebars.compile(Template.RuleMenuItem);
        Template.RuleMenuHeaderVersion = Handlebars.compile(Template.RuleMenuHeaderVersion);
        Template.RuleMenuHeaderVersionError = Handlebars.compile(Template.RuleMenuHeaderVersionError);
        Template.RulePageContent = Handlebars.compile(Template.RulePageContent);
        Template.RuleErrorPageContent = Handlebars.compile(Template.RuleErrorPageContent);
        Template.RuleFilterElement = Handlebars.compile(Template.RuleFilterElement);
    };
    Template.eval = function (template, context) {
        return template(context);
    };
    Template.RuleMenuItem = '<li><a  class="rule-link" href="#version={{currentVersion}}&ruleId={{rule.key}}" title="{{rule.key}}: {{rule.title}}">{{rule.title}}</a></li>';
    Template.RuleMenuHeaderVersion = ('<a id="version-home" href="{{{homeLink}}}">go to version home</a>' +
        '<h2>List of rules</h2>' +
        '<span id="rule-version-cont">' +
        '<a id="language-selector" class="rule-link" href="#version={{controller.displayedVersion.version}}{{next-language nextLanguage}}" title="Toggle rule language">{{language-text language}}</a>' +
        '</span>');
    Template.RuleMenuHeaderVersionError = '<span id="rule-version-cont"><a href="#">Go to latest version</span></a>';
    Template.RulePageContent = ('<div class="rule-details-container tabs">' +
        '{{#each implementations}}' +
        '<div class="rule-details tab">' +
        '<input type="radio" id="rule-detail-tab-{{../key}}-{{@index}}" name="rule-detail-tab-group-{{../key}}" {{{tab-activation @index ../implementations.length 0}}}/>' +
        '<label for="rule-detail-tab-{{../key}}-{{@index}}">{{language-text language}}</label>' +
        '<div class="tab-content">' +
        '<div class="rule-meta">' +
        '<h1 id="rule-title">{{title}}</h1>' +
        '<span id="rule-id" class="id">Rule ID: {{key}}</span>' +
        '<div class="rules-detail-properties">' +
        '<span class="tags" id="rule-tags" title="Tags" style="{{{rule-tags-visibility tags}}}">{{rule-tags-render tags}}</span>' +
        '<span class="severity rule-severity-{{severity}}" title="Severity" style="{{{rule-severity-visibility severity}}}">{{severity}}</span>' +
        '</div>' +
        '</div>' +
        '<div class="rule-description" id="rule-description">{{{description}}}</div>' +
        '</div>' +
        '</div>' +
        '{{/each}}' +
        '</div>');
    Template.RuleErrorPageContent = ('<div id="error">' +
        '<h1 id="rule-title">There was an error while processing your request</h1>' +
        '<span id="rule-id" class="id">{{message}}</span>' +
        '</div>');
    Template.RuleFilterElement = '<li><input type="checkbox" checked="checked" id="{{tag}}" /><label for="{{tag}}">{{tag}}</label></li>';
    Template.hack_static_run = Template.init();
    return Template;
})();
//# sourceMappingURL=Template.js.map