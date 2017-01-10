var sonarLintSonarAnalyzerMappings = [
    { sonarLintVersion: '2.0.0', sonarAnalyzerVersion: '1.10.0' },
    { sonarLintVersion: '2.1.0', sonarAnalyzerVersion: '1.11.0' },
    { sonarLintVersion: '2.2.0', sonarAnalyzerVersion: '1.12.0' },
    { sonarLintVersion: '2.2.1', sonarAnalyzerVersion: '1.13.0' },
    { sonarLintVersion: '2.3.0', sonarAnalyzerVersion: '1.14.0' },
    { sonarLintVersion: '2.4.0', sonarAnalyzerVersion: '1.15.0' },
    { sonarLintVersion: '2.5.0', sonarAnalyzerVersion: '1.16.0' },
    { sonarLintVersion: '2.6.0', sonarAnalyzerVersion: '1.17.0' },
    { sonarLintVersion: '2.7.0-RC1', sonarAnalyzerVersion: '1.18.0.0' },
    { sonarLintVersion: '2.7.0', sonarAnalyzerVersion: '1.18.0.910' },
    { sonarLintVersion: 'SA-1.19.0-RC1', sonarAnalyzerVersion: '1.19.0.1021' },
    { sonarLintVersion: 'SA-1.19.0', sonarAnalyzerVersion: '1.19.0.1077' },
    { sonarLintVersion: '2.8.0', sonarAnalyzerVersion: '1.20.0.1206' },
    { sonarLintVersion: '2.8.1-RC1', sonarAnalyzerVersion: '1.20.1.1222' },
    { sonarLintVersion: '2.8.1', sonarAnalyzerVersion: '1.20.1.1275' },
    { sonarLintVersion: '2.9.0-RC1', sonarAnalyzerVersion: '1.21.0.1529' }
];
window.onload = function () {
    App.Controller = new Controllers.VisualStudioRulePageController('1.20.1.1275');
};
//# sourceMappingURL=App.js.map