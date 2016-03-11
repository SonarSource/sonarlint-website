module VisualStudio {

    export class UrlParameters extends Helpers.UrlParameters {

        sonarLintVersion: string;

        protected loadFromObject(parsedHash: any) {
            super.loadFromObject(parsedHash);

            if (parsedHash.sonarlintversion) {
                this.sonarLintVersion = parsedHash.sonarlintversion;
                this.version = UrlParameters.getSonarAnalyzerVersion(this.sonarLintVersion);
            }
            else
            {
                var sonarLintVersion = UrlParameters.getSonarLintVersion(this.version);
                if (sonarLintVersion) {
                    this.sonarLintVersion = sonarLintVersion;
                }
            }
        }

        protected getVersionStringForHash() {
            if (this.sonarLintVersion) {
                return 'sonarLintVersion=' + this.sonarLintVersion;
            }
            return super.getVersionStringForHash();
        }

        public getHash(): string {
            return this.getVersionStringForHash() + this.getContentStringForHash();
        }


        private static getSonarLintVersion(sonarAnalyzerVersion: string): string {
            for (var i = 0; i < sonarLintSonarAnalyzerMappings.length; i++) {
                if (sonarLintSonarAnalyzerMappings[i].sonarAnalyzerVersion == sonarAnalyzerVersion) {
                    return sonarLintSonarAnalyzerMappings[i].sonarLintVersion;
                }
            }
            return null;
        }

        private static getSonarAnalyzerVersion(sonarLintVersion: string): string {
            for (var i = 0; i < sonarLintSonarAnalyzerMappings.length; i++) {
                if (sonarLintSonarAnalyzerMappings[i].sonarLintVersion == sonarLintVersion) {
                    return sonarLintSonarAnalyzerMappings[i].sonarAnalyzerVersion;
                }
            }
            return null;
        }
    }

    export class ContentRenderer extends Helpers.ContentRenderer { }
}

module Controllers {

    export class VisualStudioRulePageController extends RulePageControllerBase {
        constructor(defaultVersion: string, numberOfTagsToDisplay: number = 10) {
            super('VisualStudio', defaultVersion, numberOfTagsToDisplay, VisualStudio.UrlParameters, VisualStudio.ContentRenderer);
        }
    }
}