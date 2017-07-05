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
    { sonarLintVersion: '2.7.0-RC1', sonarAnalyzerVersion: '1.18.0.0' },
    { sonarLintVersion: '2.7.0', sonarAnalyzerVersion: '1.18.0.910' },
    { sonarLintVersion: 'SA-1.19.0-RC1', sonarAnalyzerVersion: '1.19.0.1021' },
    { sonarLintVersion: 'SA-1.19.0', sonarAnalyzerVersion: '1.19.0.1077' },
    { sonarLintVersion: '2.8.0', sonarAnalyzerVersion: '1.20.0.1206' },
    { sonarLintVersion: '2.8.1-RC1', sonarAnalyzerVersion: '1.20.1.1222' },
    { sonarLintVersion: '2.8.1', sonarAnalyzerVersion: '1.20.1.1275' },
    { sonarLintVersion: '2.9.0-RC1', sonarAnalyzerVersion: '1.21.0.1529' },
    { sonarLintVersion: '2.9.0', sonarAnalyzerVersion: '1.21.0.1541' },
    { sonarLintVersion: '2.10.0-RC1', sonarAnalyzerVersion: '1.22.0.1615' },
    { sonarLintVersion: '2.10.0-RC2', sonarAnalyzerVersion: '1.22.0.1631' },
    { sonarLintVersion: '2.10.0', sonarAnalyzerVersion: '1.22.0.1631' },
    { sonarLintVersion: '2.11.0', sonarAnalyzerVersion: '1.23.0.1857' },
    { sonarLintVersion: '2.12.0-RC1', sonarAnalyzerVersion: '5.9.0.992' },
    { sonarLintVersion: '2.12.0', sonarAnalyzerVersion: '5.9.0.1001' },
    { sonarLintVersion: '2.13.0-RC1', sonarAnalyzerVersion: '5.10.0.1343' },
    { sonarLintVersion: '2.13.0', sonarAnalyzerVersion: '5.10.1.1411' },
    { sonarLintVersion: '3.0.0-RC1', sonarAnalyzerVersion: '5.11.0.1721' },
    { sonarLintVersion: '3.0.0', sonarAnalyzerVersion: '5.11.0.1756' },
    { sonarLintVersion: '3.1.0-RC1', sonarAnalyzerVersion: '6.0.0.2021' },
    { sonarLintVersion: '3.1.0', sonarAnalyzerVersion: '6.0.0.2033' },
    { sonarLintVersion: '3.2.0-RC1', sonarAnalyzerVersion: '6.1.0.2272' },
    { sonarLintVersion: '3.2.0', sonarAnalyzerVersion: '6.1.0.2359' }
];

window.onload = () => {
    App.Controller = new Controllers.VisualStudioRulePageController('6.1.0.2359');
}