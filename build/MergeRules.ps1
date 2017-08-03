param
(
    [Parameter(Mandatory = $true,
        HelpMessage = "full path to json rules file")]
    [ValidateScript({Test-Path $_})]
    [string]
    $mainFilePath,

    [Parameter(Mandatory = $true,
        HelpMessage = "full path to json rules file to be merged")]
    [ValidateScript({Test-Path $_})]
    [string]
    $fileToMergePath,

    [Parameter(Mandatory = $true,
        HelpMessage = "path to the result - merged file")]
    [string]
    $targetFilePath
)

$ErrorActionPreference = "Stop"
Import-Module "$PSScriptRoot\functions.psm1" -Force

MergeRules -mainFilePath $mainFilePath `
           -fileToMergePath $fileToMergePath `
           -targetFilePath $targetFilePath
