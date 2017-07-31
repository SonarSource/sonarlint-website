param
(
    [Parameter(Mandatory = $true, HelpMessage = "full path to json rules file")]
    [ValidateScript({Test-Path $_})]
    [string]
    $mainFilePath,

    [Parameter(Mandatory = $true, HelpMessage = "full path to json rules file to be merged")]
    [ValidateScript({Test-Path $_})]
    [string]
    $filesToMergePath,

    [Parameter(Mandatory = $true, HelpMessage = "path to the result - merged file")]
    [string]
    $targetFilePath
)

function DecodeUtfCharacters($text)
{
    $charRegex = [regex]'\\u[a-zA-Z0-9]{4}'
    $matches = $charRegex.Matches($text)

    if (!$matches)
    {
        return $text
    }

    $utfToReplace = $matches | Select-Object -ExpandProperty Value -Unique

    $result = $text
    foreach ($u in $utfToReplace)
    {
        $repl = [regex]::Unescape($u)
        $result = $result.Replace($u, $repl)
    }

    $result
}


$mainFileText = (Get-Content -Path $mainFilePath -Encoding UTF8) -Join "`n"
$mainFileJson = ConvertFrom-Json -InputObject $mainFileText

$fileToMergeText = (Get-Content -Path $fileToMergePath -Encoding UTF8) -Join "`n"
$fileToMergeJson = ConvertFrom-Json -InputObject $fileToMergeText

$result = $mainFileJson

foreach ($ruleToMerge in $fileToMergeJson.rules)
{
     $existingRule = $result.rules | where-object { $_.key -eq $ruleToMerge.key }

     if ($existingRule)
     {
         $existingRule.implementations += $ruleToMerge.implementations
     }
     else
     {
         $result.rules += $ruleToMerge
     }
}

$resultJson = ConvertTo-Json -Depth 5 $result
$unsescapedResultJson = DecodeUtfCharacters -text $resultJson

Set-Content $targetFilePath -Value $unsescapedResultJson -Encoding UTF8
    