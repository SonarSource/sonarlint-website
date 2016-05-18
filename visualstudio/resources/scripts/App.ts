interface SonarLintSonarAnalyzerMapping {
    sonarLintVersion: string;
    sonarAnalyzerVersion: string;
}

var sonarLintSonarAnalyzerMappings: SonarLintSonarAnalyzerMapping[] = [
    { sonarLintVersion: '2.0.0', sonarAnalyzerVersion: '1.10.0' },
    { sonarLintVersion: '2.1.0', sonarAnalyzerVersion: '1.11.0' },
    { sonarLintVersion: '2.2.0', sonarAnalyzerVersion: '1.12.0' },
    { sonarLintVersion: '2.2.1', sonarAnalyzerVersion: '1.13.0' }
];

window.onload = () => {
    App.Controller = new Controllers.VisualStudioRulePageController('1.13.0');
}