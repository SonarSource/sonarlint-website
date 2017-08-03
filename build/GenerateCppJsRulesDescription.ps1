param
(
    [Parameter(Mandatory = $true,
     HelpMessage = "target path to store the rules description")]
    [ValidateScript({Test-Path $_})]
    [string]
    $targetFolder,

    [Parameter(Mandatory = $true,
        HelpMessage = "path to rule extractor (from sonarlint-core). " +
          "For example 'c:\src\sonarlint-rule-extractor-2.18-SNAPSHOT-jar-with-dependencies.jar' ")]
    [ValidateScript({Test-Path $_})]
    [string]
    $ruleExtractor
)

$ErrorActionPreference = "Stop"
Import-Module "$PSScriptRoot\functions.psm1" -Force

GenerateCppJsRulesDescription -targetFolder $targetFolder `
                              -ruleExtractor $ruleExtractor
