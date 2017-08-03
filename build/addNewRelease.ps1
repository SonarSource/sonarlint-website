<#
.SYNOPSIS
This script adds new release to sonarlint website.

.DESCRIPTION
This script adds new release to sonarlint website.
It automates the process outlined at https://xtranet.sonarsource.com/display/LANG/SonarLint+website+release+process

Prerequisites / assumptions:
- git branch (usually named "sonarlint-vs") is created, clean and checked out
- script is run from powershell within Developer Command prompt for VS
- java is installed and added to %path%

.EXAMPLE
Typical usage:

./addNewRelase.ps1 -releaseType "RC1" `
                   -analyzerPath "C:\src\sonar-csharp\sonaranalyzer-dotnet" `
                   -websitePath "C:\src\sonarlint-website" `
                   -analyzerFullVersion "6.1.0.2345" `
                   -sonarlintVersion "3.2" `
                   -ruleExtractorPath "c:\src\sonarlint-rule-extractor-2.18-SNAPSHOT-jar-with-dependencies.jar"

NOTE:
- sonarlintVersion MUST match milestone title on github
- arguments need to be quoted and have full path ""
#>
param
(
    [Parameter(Mandatory = $true, HelpMessage = "release: RC1/RC2/RC3/RC4/final", Position = 0)]
    [ValidateSet("RC1", "RC2", "RC3", "RC4", "final")]
    [string]
    $releaseType,
    
    [Parameter(Mandatory = $true, HelpMessage = "path to root folder of analyzer, e.g. C:\src\sonar-csharp\sonaranalyzer-dotnet")]
    [ValidateScript({Test-Path $_})]
    [string]
    $analyzerPath,

    [Parameter(Mandatory = $true, HelpMessage = "path to root folder of website e.g. C:\src\sonarlint-website")]
    [ValidateScript({Test-Path $_})]
    [string]
    $websitePath,

    [Parameter(Mandatory = $true, HelpMessage = "4 digit analyzer version to release (from burgr, e.g. 6.1.0.2354)")]
    [string]
    $analyzerFullVersion,

    [Parameter(Mandatory = $true, HelpMessage = "short sonarlint version (e.g. 3.1 or 3.1.1)")]
    [string]
    $sonarlintVersion,

    [Parameter(Mandatory = $true, HelpMessage = "path to rule extractor (e.g. c:\src\sonarlint-rule-extractor-2.18-SNAPSHOT-jar-with-dependencies.jar)")]
    [string]
    $ruleExtractorPath
)

$DebugPreference = 'Continue'
$ErrorActionPreference = 'Stop'

Import-Module "$PSScriptRoot\functions.psm1" -Force

$sonarlintProjectUri = "https://api.github.com/repos/SonarSource/sonarlint-visualstudio"
$analyzerProjectUri = "https://api.github.com/repos/SonarSource/sonar-csharp"

RebuildAnalyzer -analyzerPath $analyzerPath

$versionPath = "$websitePath\visualstudio\rules\$analyzerFullVersion"
GenerateJsonRulesTo -analyzerPath $analyzerPath -targetPath $versionPath -ruleExtractorPath $ruleExtractorPath

$appTsPath = "$websitePath\visualstudio\resources\scripts\App.ts"
$lastReleasedAnalyzerVersion = FindLastReleasedAnalyzerVersion -appTsPath $appTsPath
$lastReleasedSonarlintVersion = FindLastReleasedSonarlintVersion -appTsPath $appTsPath

UpdateAppTsMapping -appTsPath $appTsPath `
                   -releaseType $releaseType `
                   -analyzerVersion $analyzerFullVersion `
                   -sonarlintVersion $sonarlintVersion `
                   -lastReleasedAnalyzerVersion $lastReleasedAnalyzerVersion

if ($releaseType -eq "final")
{
    $lastVersionPath = "$websitePath\visualstudio\rules\$lastReleasedAnalyzerVersion"
    UpdateGoToLatestInLastVersion -lastVersionPath $lastVersionPath
}

$releaseNotesTable = GenerateDescriptionTable `
                            -analyzerVersion $analyzerFullVersion `
                            -sonarlintVersion $sonarlintVersion `
                            -releaseType $releaseType `
                            -sonarlintProjectUri $sonarlintProjectUri `
                            -analyzerProjectUri $analyzerProjectUri `
                            -lastReleasedSonarlintVersion $lastReleasedSonarlintVersion

$templatePath = "$PSScriptRoot\index.html.template"

WriteReleaseNotes -templatePath $templatePath `
                  -analyzerVersionPath $versionPath `
                  -lookupTable $releaseNotesTable

RebuildWebsite -websitePath $websitePath

if ($releaseType -eq "final")
{
    UpdateNews -websitePath $websitePath -lookupTable $releaseNotesTable
}
