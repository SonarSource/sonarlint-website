var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var VisualStudio;
(function (VisualStudio) {
    var UrlParameters = (function (_super) {
        __extends(UrlParameters, _super);
        function UrlParameters() {
            _super.apply(this, arguments);
        }
        UrlParameters.prototype.loadFromObject = function (parsedHash) {
            _super.prototype.loadFromObject.call(this, parsedHash);
            if (parsedHash.sonarlintversion) {
                this.sonarLintVersion = parsedHash.sonarlintversion;
                this.version = UrlParameters.getSonarAnalyzerVersion(this.sonarLintVersion);
                if (!this.version) {
                    this.version = this.sonarLintVersion;
                }
            }
            else {
                var sonarLintVersion = UrlParameters.getSonarLintVersion(this.version);
                if (sonarLintVersion) {
                    this.sonarLintVersion = sonarLintVersion;
                }
            }
        };
        UrlParameters.prototype.getVersionStringForHash = function () {
            if (this.sonarLintVersion) {
                return 'sonarLintVersion=' + this.sonarLintVersion;
            }
            return _super.prototype.getVersionStringForHash.call(this);
        };
        UrlParameters.prototype.getHash = function () {
            return this.getVersionStringForHash() + this.getContentStringForHash();
        };
        UrlParameters.getSonarLintVersion = function (sonarAnalyzerVersion) {
            for (var i = 0; i < sonarLintSonarAnalyzerMappings.length; i++) {
                if (sonarLintSonarAnalyzerMappings[i].sonarAnalyzerVersion == sonarAnalyzerVersion) {
                    return sonarLintSonarAnalyzerMappings[i].sonarLintVersion;
                }
            }
            return null;
        };
        UrlParameters.getSonarAnalyzerVersion = function (sonarLintVersion) {
            for (var i = 0; i < sonarLintSonarAnalyzerMappings.length; i++) {
                if (sonarLintSonarAnalyzerMappings[i].sonarLintVersion == sonarLintVersion) {
                    return sonarLintSonarAnalyzerMappings[i].sonarAnalyzerVersion;
                }
            }
            return null;
        };
        return UrlParameters;
    })(Helpers.UrlParameters);
    VisualStudio.UrlParameters = UrlParameters;
    var ContentRenderer = (function (_super) {
        __extends(ContentRenderer, _super);
        function ContentRenderer() {
            _super.apply(this, arguments);
        }
        return ContentRenderer;
    })(Helpers.ContentRenderer);
    VisualStudio.ContentRenderer = ContentRenderer;
})(VisualStudio || (VisualStudio = {}));
var Controllers;
(function (Controllers) {
    var VisualStudioRulePageController = (function (_super) {
        __extends(VisualStudioRulePageController, _super);
        function VisualStudioRulePageController(defaultVersion, numberOfTagsToDisplay) {
            if (numberOfTagsToDisplay === void 0) { numberOfTagsToDisplay = 10; }
            _super.call(this, 'VisualStudio', defaultVersion, numberOfTagsToDisplay, VisualStudio.UrlParameters, VisualStudio.ContentRenderer);
        }
        return VisualStudioRulePageController;
    })(Controllers.RulePageControllerBase);
    Controllers.VisualStudioRulePageController = VisualStudioRulePageController;
})(Controllers || (Controllers = {}));
