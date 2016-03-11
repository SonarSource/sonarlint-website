class Template {
    static RuleMenuItem: HandlebarsTemplateDelegate = <any>'<li><a  class="rule-link" href="#version={{currentVersion}}&ruleId={{rule.key}}" title="{{rule.key}}: {{rule.title}}">{{rule.title}}</a></li>';
    static RuleMenuHeaderVersion: HandlebarsTemplateDelegate = <any>(
        '<a id="version-home" class="rule-link" href="#version={{controller.displayedVersion.version}}">go to version home</a>' +
        '<h2>List of rules</h2>' +
        '<span id="rule-version-cont">' +
            '<a id="language-selector" class="rule-link" href="#version={{controller.displayedVersion.version}}{{next-language nextLanguage}}" title="Toggle rule language">{{language-text language}}</a>' +
        '</span>');
    static RuleMenuHeaderVersionError: HandlebarsTemplateDelegate = <any>'<span id="rule-version-cont"><a href="#">Go to latest version</span></a>';
    static RulePageContent: HandlebarsTemplateDelegate = <any>(
        '<div class="rule-details-container tabs">' +
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
    static RuleErrorPageContent: HandlebarsTemplateDelegate = <any>(
        '<div id="error">' +
            '<h1 id="rule-title">There was an error while processing your request</h1>' +
            '<span id="rule-id" class="id">{{message}}</span>' +
        '</div>');
    static RuleFilterElement: HandlebarsTemplateDelegate = <any>'<li><input type="checkbox" checked="checked" id="{{tag}}" /><label for="{{tag}}">{{tag}}</label></li>';

    static VersionInfo: HandlebarsTemplateDelegate = <any>(
        '<p>Version summary:</p>' +
        '<ul>' +
        '{{#each details}}' +
            '<li><a class="rule-link" href="#version={{../controller.displayedVersion.version}}&language={{@key}}">{{this}} rules for {{@key}}</a></li>' +
        '{{/each}}' +
        '</ul>');


    private static init() {
        Handlebars.registerHelper('language-text', function (lang) {
            return lang == null ? 'All' : lang;
        });
        Handlebars.registerHelper('next-language', function (lang) {
            return lang == null ? '' : '&language=' + lang;
        });
        Handlebars.registerHelper('rule-tags-visibility', function (tags) {
            if (!tags || tags == "" || (Array.isArray(tags) && (<Array<string>>tags).length == 0)) {
                return 'display: none;'
            }
            return '';
        });
        Handlebars.registerHelper('rule-severity-visibility', function (severity) {
            if (!severity) {
                return 'display: none;'
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
        Template.VersionInfo = Handlebars.compile(Template.VersionInfo);
    }

    static eval(template: HandlebarsTemplateDelegate, context: any): string {
        return template(context);
    }

    private static hack_static_run = Template.init();
}