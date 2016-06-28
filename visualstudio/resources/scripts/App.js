var sonarLintSonarAnalyzerMappings = [
    { sonarLintVersion: '2.0.0', sonarAnalyzerVersion: '1.10.0' },
    { sonarLintVersion: '2.1.0', sonarAnalyzerVersion: '1.11.0' },
    { sonarLintVersion: '2.2.0', sonarAnalyzerVersion: '1.12.0' },
    { sonarLintVersion: '2.2.1', sonarAnalyzerVersion: '1.13.0' },
    { sonarLintVersion: '2.3.0', sonarAnalyzerVersion: '1.14.0' },
    { sonarLintVersion: '2.4.0', sonarAnalyzerVersion: '1.15.0' }
];
window.onload = function () {
    App.Controller = new Controllers.VisualStudioRulePageController('1.15.0');
};
//# sourceMappingURL=App.js.map