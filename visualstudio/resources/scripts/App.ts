interface SonarLintSonarAnalyzerMapping {
    sonarLintVersion: string;
    sonarAnalyzerVersion: string;
}

var sonarLintSonarAnalyzerMappings: SonarLintSonarAnalyzerMapping[] = [
    { sonarLintVersion: '2.0.0', sonarAnalyzerVersion: '1.10.0' },
    { sonarLintVersion: '2.1.0', sonarAnalyzerVersion: '1.11.0' },
    { sonarLintVersion: '2.2.0', sonarAnalyzerVersion: '1.12.0' },
    { sonarLintVersion: '2.2.1', sonarAnalyzerVersion: '1.13.0' },
    { sonarLintVersion: '2.3.0', sonarAnalyzerVersion: '1.14.0' },
    { sonarLintVersion: '2.4.0', sonarAnalyzerVersion: '1.15.0' },
    { sonarLintVersion: '2.5.0', sonarAnalyzerVersion: '1.16.0' },
    { sonarLintVersion: '2.6.0', sonarAnalyzerVersion: '1.17.0' },
    { sonarLintVersion: '2.7.0', sonarAnalyzerVersion: '1.18.0.0' }
];

window.onload = () => {
    App.Controller = new Controllers.VisualStudioRulePageController('1.17.0');
}