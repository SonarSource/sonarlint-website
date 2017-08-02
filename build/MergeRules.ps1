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

function EscapeSlashes($text)
{
    return $text.Replace('\\', '-----@-----')

}

function UnescapeSlashes($text)
{
    return $text.Replace('-----@-----', '\\')
}

function ParseJsonFromFile($path)
{
    $text = (Get-Content -Path $path) -Join "`n"
    $text = EscapeSlashes -text $text
    $json = ConvertFrom-Json -InputObject $text
    return $json
}

function ToEscapedJson($psObject)
{
    $json = ConvertTo-Json -Depth 5 $psObject

    $charRegex = [regex]'\\u[a-zA-Z0-9]{4}'
    $matches = $charRegex.Matches($json)

    $result = $json
    
    if ($matches)
    {
        $utfToReplace = $matches | Select-Object -ExpandProperty Value -Unique

        foreach ($u in $utfToReplace)
        {
            $result = $result.Replace($u, [regex]::Unescape($u))
        }
    }

    $unescaped = UnescapeSlashes -text $result
    return $unescaped
}

$mainRules = ParseJsonFromFile -path $mainFilePath
$rulesToMerge = ParseJsonFromFile -path $fileToMergePath

$mergedRules = $mainRules

foreach ($ruleToMerge in $rulesToMerge.rules)
{
     $existingRule = $mergedRules.rules | Where-Object { $_.key -eq $ruleToMerge.key }

     if ($existingRule)
     {
         $existingRule.implementations += $ruleToMerge.implementations
     }
     else
     {
         $mergedRules.rules += $ruleToMerge
     }
}

$escapedJson = ToEscapedJson -psObject $mergedRules
Set-Content $targetFilePath -Value $escapedJson
