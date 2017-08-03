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
    $fullAnalyzerVersion,

    [Parameter(Mandatory = $true, HelpMessage = "short lint version (e.g. 3.1 or 3.1.1")]
    [string]
    $lintVersion
)

#todo: for debugging
 #$releaseType = "final" #"RC1"
 #$analyzerPath = "C:\src\sonar-csharp\sonaranalyzer-dotnet"
 #$websitePath = "C:\src\sonarlint-website"
 #$fullAnalyzerVersion = "6.3.0.0" # from burgr
 #$lintVersion = "3.3"

$DebugPreference = 'Continue'
$ErrorActionPreference = 'Stop'

Import-Module "$PSScriptRoot\functions.psm1" -Force

$lintProjectUri = "https://api.github.com/repos/SonarSource/sonarlint-visualstudio"
$analyzerProjectUri = "https://api.github.com/repos/SonarSource/sonar-csharp"

## 1. Go to the SonarAnalyzer for .Net repository.
## 2. Make sure to build latest version
RebuildAnalyzer -analyzerPath $analyzerPath

## 3. Generates the rules.json folder
##    Go to the src\SonarAnalyzer.RuleDocGenerator.Web\bin\Release folder
##    Run SonarAnalyzer.RuleDocGenerator.Web.exe
##    Copy the version folder that is generated into the clipboard (see 6.a for what will happen with it)
$versionPath = "$websitePath\visualstudio\rules\$fullAnalyzerVersion"
GenerateJsonRulesTo -analyzerPath $analyzerPath -targetPath $versionPath

# 4. Pull latest version of sonarlint-website
# 5. Create a new branch named sonarlint-vs
#CreateCheckoutBranch

# 6. Open sonarlint.org.sln
#   a. Add the folder you copied on the previous step under the visualstudio/rules folder
#   b. Rename the folder you added to match the full version in Burgr (including the build number)

$appTsPath = "$websitePath\visualstudio\resources\scripts\App.ts"
$lastReleasedAnalyzerVersion = FindLastReleasedAnalyzerVersion -appTsPath $appTsPath
$lastReleasedLintVersion = FindLastReleasedLintVersion -appTsPath $appTsPath

UpdateAppTsMapping -appTsPath $appTsPath `
                   -releaseType $releaseType `
                   -analyzerVersion $fullAnalyzerVersion `
                   -lintVersion $lintVersion `
                   -lastReleasedAnalyzerVersion $lastReleasedAnalyzerVersion

if ($releaseType -eq "final")
{
    $lastVersionPath = "$websitePath\visualstudio\rules\$lastReleasedAnalyzerVersion"
    UpdateGoToLatestInLastVersion -lastVersionPath $lastVersionPath
}

$releaseNotesTable = GenerateDescriptionTable `
                            -analyzerVersion $fullAnalyzerVersion `
                            -lintVersion $lintVersion `
                            -releaseType $releaseType `
                            -lintProjectUri $lintProjectUri `
                            -analyzerProjectUri $analyzerProjectUri `
                            -lastReleasedLintVersion $lastReleasedLintVersion

$templatePath = "$PSScriptRoot\index.html.template"

WriteReleaseNotes -templatePath $templatePath `
                  -analyzerVersionPath $versionPath `
                  -lookupTable $releaseNotesTable

RebuildWebsite -websitePath $websitePath

if ($releaseType -eq "final")
{
    UpdateNews -websitePath $websitePath -lookupTable $releaseNotesTable
}

#todo:uncomment CommitChanges -lintVersion $lintVersion
