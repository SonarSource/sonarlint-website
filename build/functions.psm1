Add-Type -AssemblyName System.Web

$ErrorActionPreference = 'Stop'

function Trace ($msg)
{
    Write-Host $msg -foreground "magenta"
}

function FindDaemonVersion($fileText)
{
    Trace "FindDaemonVersion"

    $versionRegex = [regex]'daemonVersion\s*=\s*\"(?<version>[0-9\.]+)"\s*;'

    $versionGroup = $versionRegex.Match($fileText).Groups["version"]
    if (!$versionGroup.Success)
    {
        throw "FindDaemonVersion: failed to find the version"
    }

    return $versionGroup.Value
}

function GetUrlContent($url)
{
    Trace "GetUrlContent '$url'"
    
    $response = Invoke-WebRequest -Uri $url -Method "GET" -UseBasicParsing
    if ($response.StatusCode -ne 200)
    {
        $code = $response.StatusCode
        throw "unexpected http code: $code"
    }

    return $response.Content
}

function DownloadFile($url, $targetPath)
{
    Trace "DownloadFile '$url' '$targetPath'"
    
    (New-Object System.Net.WebClient).DownloadFile($url, $targetPath)
}

function GenerateCppJsRulesDescription($targetFolder, $ruleExtractor)
{
    Trace "GenerateCppJsRulesDescription '$targetFolder' '$ruleExtractor'"
    
    $daemonText = GetUrlContent `
        -url "https://raw.githubusercontent.com/SonarSource/sonarlint-visualstudio/master/src/Integration.Vsix/SonarLintDaemon/SonarLintDaemon.cs"
    $daemonVersion = FindDaemonVersion -fileText $daemonText

    $pomXmlText = GetUrlContent `
        -url "https://raw.githubusercontent.com/SonarSource/sonarlint-core/$daemonVersion/daemon/pom.xml"
    $pomXml = [xml]$pomXmlText
    $sonarJsVersion  = $pomXml["project"]["properties"]["sonar.javascript.version"].'#text'
    $sonarCppVersion = $pomXml["project"]["properties"]["sonar.cfamily.version"].'#text'
        
    DownloadFile `
        -url "https://sonarsource.bintray.com/Distribution/sonar-javascript-plugin/sonar-javascript-plugin-$sonarJsVersion.jar" `
        "$targetFolder\jsplugin.jar"

    DownloadFile `
        -url "https://sonarsource.bintray.com/CommercialDistribution/sonar-cfamily-plugin/sonar-cfamily-plugin-$sonarCppVersion.jar" `
        "$targetFolder\cplugin.jar"

    java -jar $ruleExtractor dummyversion-js "$targetFolder\jsplugin.jar" > "$targetFolder\jsplugin.rule.json"
    java -jar $ruleExtractor dummyversion-c  "$targetFolder\cplugin.jar"  > "$targetFolder\cplugin.rule.json"
}


function EscapeSlashes($text)
{
    Trace "EscapeSlashes"
    
    return $text.Replace('\\', '-----@-----')
}

function UnescapeSlashes($text)
{
    Trace "UnescapeSlashes"
    
    return $text.Replace('-----@-----', '\\')
}

function ParseJsonFromFile($path)
{
    Trace "ParseJsonFromFile"
    
    $text = (Get-Content -Path $path) -Join "`n"
    $text = EscapeSlashes -text $text
    $json = ConvertFrom-Json -InputObject $text
    return $json
}
function ToEscapedJson($psObject)
{
    Trace "ToEscapedJson"
    
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

function MergeRules($mainFilePath, $fileToMergePath, $targetFilePath)
{
    Trace "MergeRules '$mainFilePath', '$fileToMergePath', '$targetFilePath'"

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

    $directory = [System.IO.Path]::GetDirectoryName($targetFilePath)
    New-Item -ItemType Directory -Force -Path $directory
    Set-Content $targetFilePath -Value $escapedJson
}

function ReplaceAll($lookupTable, $string)
{
    $result = $string
    $lookupTable.GetEnumerator() | ForEach-Object `
    {
        $result = $result.Replace($_.Key, $_.Value)
    }
    return $result
}

function CreateDescriptionFor($arr, $format)
{
    $desc = ""
    if ($arr.Count -gt 0)
    {
        $s =""
        if ($arr.Count -gt 1)
        {
            $s += "s"
        }

        $desc = [string]::Format($format, $arr.Count, $s)
    }
    return $desc
}

function RebuildAnalyzer($analyzerPath)
{
    Trace "rebuilding analyzer"
    
    # todo: vs commandline is required
    $sln = "$analyzerPath\SonarAnalyzer.sln"
    nuget restore $sln
    msbuild $sln /t:rebuild /p:Configuration=Release
    # todo: check for errors
}

function RebuildWebsite($websitePath)
{
    Trace "rebuilding website"
    
    $sln = "$websitePath\sonarlint.org.sln"
    msbuild $sln /t:rebuild
}

function FindLastReleasedAnalyzerVersion($appTsPath)
{
    Trace "FindLastReleasedAnalyzerVersion '$appTsPath'"
    
    $appTsContent = Get-Content $appTsPath -Raw

    $lastReleasedAnalyzerVersionRegex = [regex]"VisualStudioRulePageController\('(?<version>.+)'\);"

    $versionGroup = $lastReleasedAnalyzerVersionRegex.Match($appTsContent).Groups["version"]
    if (!$versionGroup.Success)
    {
        throw "could not find the version - no regex match"
    }
    return $versionGroup.Value
}

function FindLastReleasedSonarlintVersion($appTsPath)
{
    Trace "FindLastReleasedSonarlintVersion '$appTsPath'"
    
    $lastReleasedAnalyzerVersion = FindLastReleasedAnalyzerVersion -appTsPath $appTsPath
    $appTsContent = Get-Content $appTsPath -Raw

    $escapedAnalyzerVersion = $lastReleasedAnalyzerVersion.Replace(".", "\.")

    $lastReleasedSonarlintVersionRegex = [regex]"sonarLintVersion.*?'(?<ver>.+)'.*?sonarAnalyzerVersion:.*?'$escapedAnalyzerVersion'.*?}\s*"
    $match = $lastReleasedSonarlintVersionRegex.Match($appTsContent)

    if (!$match.Success)
    {
        throw "could not find the version - no regex match"
    }
    $versionGroup = $match.Groups["ver"]

    return $versionGroup.Value
}

function UpdateAppTsMapping($appTsPath, $releaseType, $analyzerVersion, $sonarlintVersion, $lastReleasedAnalyzerVersion)
{
    Trace "UpdateAppTsMapping '$appTsPath', '$releaseType', '$analyzerVersion', '$sonarlintVersion', '$lastReleasedAnalyzerVersion'"
    
    $appTsContent = Get-Content $appTsPath -Raw

    $sonarlintVersionString = ToVersion3 -version $sonarlintVersion
    if ($releaseType -ne "final")
    {
        $sonarlintVersionString += "-" + $releaseType
    }

    $newline = ",`r`n    { sonarLintVersion: '$sonarlintVersionString', sonarAnalyzerVersion: '$analyzerVersion' }"

    $lastLineInMap = [regex]"'\s*}\s*`n"
    $lastLineMatch = $lastLineInMap.Match($appTsContent)
    if (!$lastLineMatch.Success)
    {
        throw "could not find last version mapping"
    }

    $idx = $lastLineMatch.Index + $lastLineMatch.Length - 2 # for newline
    $updatedContent = $appTsContent.Insert($idx, $newline)

    if ($releaseType -eq "final")
    {
        $lastReleasedAnalyzerVersionRegex = [regex]"VisualStudioRulePageController\('.+'\);"

        $match = $lastReleasedAnalyzerVersionRegex.Match($appTsContent)
        if (!$match.Success)
        {
            throw "could not find redirection version"
        }

        $newVersionString = "VisualStudioRulePageController('$analyzerVersion');";
        $updatedContent = $updatedContent -replace $lastReleasedAnalyzerVersionRegex, $newVersionString
    }

    Set-Content -Path $appTsPath -Value $updatedContent
}

function UpdateGoToLatestInLastVersion($lastVersionPath)
{
    Trace "UpdateGoToLatestInLastVersion '$lastVersionPath'"
    
    $indexHtmlPath = "$lastVersionPath\index.html"
    $previousIndexContent = Get-Content $indexHtmlPath -Raw

    $previousIndexContentUpdated = $previousIndexContent.Replace(`
              '<!--<li class="release-goto-latest"><a href="#">Go to latest version</a></li>-->', `
                  '<li class="release-goto-latest"><a href="#">Go to latest version</a></li>')

    Set-Content -Path $indexHtmlPath -Value $previousIndexContentUpdated
}

function GenerateJsonRulesTo($analyzerPath, $targetPath, $ruleExtractorPath)
{
    Trace "GenerateJsonRulesTo '$analyzerPath', '$targetPath' '$ruleExtractorPath'"
    
    $tmpFolder = $env:temp + "\" + [string][System.Guid]::NewGuid()
    Trace "   Create temp folder '$tmpFolder'"
    
    New-Item -ItemType Directory -Path $tmpFolder -Force

    GenerateCsharpRulesTo -analyzerPath $analyzerPath -targetPath $tmpFolder

    GenerateCppJsRulesDescription -targetFolder $tmpFolder -ruleExtractor $ruleExtractorPath

    MergeRules -mainFilePath "$tmpFolder\rules.json" `
               -fileToMergePath "$tmpFolder\cplugin.rule.json" `
               -targetFilePath "$tmpFolder\step1.json"

    MergeRules -mainFilePath "$tmpFolder\step1.json" `
               -fileToMergePath "$tmpFolder\jsplugin.rule.json" `
               -targetFilePath "$targetPath\rules.json"

    Trace "   Remove temp folder 'tmpFolder'"
    Remove-Item $tmpFolder -Force -Recurse
}

function GenerateCsharpRulesTo($analyzerPath, $targetPath)
{
    Trace "GenerateCsharpRulesTo '$analyzerPath', '$targetPath'"
    
    ."$analyzerPath/src/SonarAnalyzer.RuleDocGenerator.Web/bin/Release/SonarAnalyzer.RuleDocGenerator.Web.exe" $targetPath
}

function ToVersion2($version)
{
    Trace "ToVersion2 '$version'"
    
    $parts = $version.Split('.', [System.StringSplitOptions]::RemoveEmptyEntries)

    $result = $parts[0] + "." + $parts[1]
    if ($parts.Length -gt 2 -and $parts[2] -ne 0)
    {
        $result += "." + $parts[2]
    }
    return $result
}

function ToVersion3($version)
{
    Trace "ToVersion3 '$version'"
    
    $parts = $version.Split('.', [System.StringSplitOptions]::RemoveEmptyEntries)
    $result = $parts[0] + "." + $parts[1]

    $last = "0"
    if ($parts.Length -gt 2)
    {
        $last = $parts[2]
    }

    $result += "." + $last
    return $result
}

function GetAnalyzerMilestone_GH($analyzerVersion)
{
    Trace "GetAnalyzerMilestone_GH '$analyzerVersion'"

    $allMilestones = Invoke-WebRequest -Uri "$analyzerProjectUri/milestones" -Method "GET" -UseBasicParsing
    $allMilestonesJson = ConvertFrom-Json $allMilestones.Content

    $version2 = ToVersion2 -version $analyzerVersion
    $milestone = $allMilestonesJson | Where-Object { $_.title -eq $version2 }

    $result = @{}
    $result["closedIssuesLink"] = $milestone.html_url + "?closed=1"
    $result["number"] = $milestone.number
    $number = $result["number"]
    $milestoneIssues = Invoke-WebRequest -Uri "$analyzerProjectUri/issues?milestone=$number&state=all" -Method "GET" -UseBasicParsing
    $milestoneIssuesjson = ConvertFrom-Json $milestoneIssues.Content

    $unclosedIssues = $milestoneIssuesjson | where-object { $_.state -ne "closed" }
    if ($unclosedIssues.Count -gt 0)
    {
        Write-Warning "found unclosed tickets in analyzer milestone"
    }

    $allIssueTitles =  $milestoneIssuesjson | Select-Object -ExpandProperty title

    $result["newRules"] = @()
    $result["fixes"] = @()
    $result["improvements"] = @()
    $result["others"] = @()
    $result["allIssues"] = @()

    $ruleRegexString = "^{0}\s+S\d+:"
    $newRuleRegex = [regex]([String]::Format($ruleRegexString, "Rule"))
    $fixRuleRegex = [regex]([String]::Format($ruleRegexString, "Fix"))
    $improvementRuleRegex = [regex]([String]::Format($ruleRegexString, "Update"))

    foreach ($issue in $allIssueTitles)
    {
        if ($newRuleRegex.Match($issue).Success)
        {
            $result.newRules += $issue
        } 
        elseif ($fixRuleRegex.Match($issue).Success)
        {
            $result.fixes += $issue
        } 
        elseif ($improvementRuleRegex.Match($issue).Success)
        {
            $result.improvement += $issue
        }
        else
        {
            $result.others += $issue
        }

        $result.allIssues += $issue
    }

    [Array]::Sort($result.newRules)
    [Array]::Sort($result.fixes)
    [Array]::Sort($result.improvements)
    [Array]::Sort($result.others)
    [Array]::Sort($result.allIssues)

    return $result
}

function GetLintMilestone_GH($sonarlintVersion, $releaseType, $lintProjectUri)
{
    Trace "GetLintMilestone_GH '$sonarlintVersion', '$releaseType', '$lintProjectUri'"

    $allMilestones = Invoke-WebRequest -Uri "$lintProjectUri/milestones" -Method "GET" -UseBasicParsing
    $allMilestonesJson = ConvertFrom-Json $allMilestones.Content

    $sonarlintVersionString = ToVersion2 -version $sonarlintVersion

    #todo: fail if not exactly 1
    #todo: only search title?
    $milestone = $allMilestonesJson | Where-Object { $_.title -eq $sonarlintVersionString }

    $result = @{}
    $result["closedIssuesLink"] = $milestone.html_url + "?closed=1"
    $result["number"] = $milestone.number
    $number = $result["number"]
    $milestoneIssues = Invoke-WebRequest -Uri "$lintProjectUri/issues?milestone=$number&state=all" -Method "GET" -UseBasicParsing
    $milestoneIssuesjson = ConvertFrom-Json $milestoneIssues.Content

    $unclosedIssues = $milestoneIssuesjson | where-object { $_.state -ne "closed" }
    if ($unclosedIssues.Count -gt 0)
    {
        Write-Warning "found unclosed tickets in lint milestone"
    }

    $result["allIssues"] = $milestoneIssuesjson | Select-Object -ExpandProperty title
    [Array]::Sort($result["allIssues"])
    
    return $result
}

function WriteReleaseNotes($templatePath, $analyzerVersionPath, $lookupTable)
{
    Trace "WriteReleaseNotes '$templatePath', '$analyzerVersionPath'"
    
    $templateRC = Get-Content -Path $templatePath -Raw
    $generatedNotes = ReplaceAll -lookupTable $lookupTable -string $templateRC.ToString()
    Set-Content -Path "$analyzerVersionPath\index.html" -Value $generatedNotes
}

function GenerateSummary($analyzerMilestone)
{
    Trace "GenerateSummary"
    
    $releaseDescription = ""
    $releaseDescription += CreateDescriptionFor -arr $analyzerMilestone["newRules"]     -Format " adds {0} new rule{1},"
    $releaseDescription += CreateDescriptionFor -arr $analyzerMilestone["fixes"]        -Format " fixes {0} rule{1},"
    $releaseDescription += CreateDescriptionFor -arr $analyzerMilestone["improvements"] -Format " improves {0} rule{1}"

    $releaseDescription = $releaseDescription.TrimEnd(",") + "."
    return $releaseDescription
}

function GenerateSection($title, $arr)
{
    if ($arr.count -eq 0)
    {
        return ""
    }

    $result = "                <p><strong>$title</strong></p>`r`n"
    $result += "                <ul>`r`n"

    foreach ($item in $arr)
    {
        $result += GenerateItem($item)
    }

    $result += "                </ul>`r`n"
    return $result
}

function GenerateItem($item)
{
    $escaped =  [System.Web.HttpUtility]::HtmlEncode($item)
    return "                    <li>$escaped</li>`r`n"
}

function GenerateSections($analyzerMilestone)
{
    Trace "GenerateSections"
    
    $sections = ""
    $sections += GenerateSection -title "New Rules" -arr $analyzerMilestone["newRules"]
    $sections += GenerateSection -title "Bug fixes" -arr $analyzerMilestone["fixes"]
    $sections += GenerateSection -title "Rule improvements" -arr $analyzerMilestone["improvements"]
    $sections += GenerateSection -title "Others" -arr $analyzerMilestone["others"]
    return $sections
}

function GenerateDescriptionTable($analyzerVersion, $sonarlintVersion, $releaseType, $sonarlintProjectUri, $analyzerProjectUri, $lastReleasedSonarlintVersion)
{
    Trace "GenerateDescriptionTable '$analyzerVersion', '$sonarlintVersion', '$releaseType', '$sonarlintProjectUri', '$analyzerProjectUri', '$lastReleasedSonarlintVersion'"
    
    $lintMilestone = GetLintMilestone_GH -sonarlintVersion $sonarlintVersion -lintProjectUri $sonarlintProjectUri -releaseType $releaseType
    $lintClosedMilestoneLink = $lintMilestone["closedIssuesLink"] # looks like "https://github.com/SonarSource/sonarlint-visualstudio/milestone/8?closed=1"

    $analyzerMilestone = GetAnalyzerMilestone_GH -analyzerVersion $analyzerVersion -analyzerProjectUri $analyzerProjectUri
    $analyzerClosedMilestoneLink = $analyzerMilestone["closedIssuesLink"]  # looks like "https://github.com/SonarSource/sonar-csharp/milestone/8?closed=1"

    $goToLastVersionTag = '<li class="release-goto-latest"><a href ="#">Go to latest version</a></li>'
    if ($releaseType -eq "final")
    {
        $goToLastVersionTag= "<!--$goToLastVersionTag-->"
    }

    $generatedSections = GenerateSections -analyzerMilestone $analyzerMilestone
    $generatedSummmary = GenerateSummary($analyzerMilestone)
    $releaseDate = Get-Date -Format "MMMM d, yyyy"
    $sonarlintVersion2 = ToVersion2 -version $sonarlintVersion
    $sonarlintVersion3 = ToVersion3 -version $sonarlintVersion

    $lookupTable = @{
        "(==LINT_MILESTONE_LINK==)"      = $lintClosedMilestoneLink
        "(==ANALYZER_MILESTONE_LINK==)"  = $analyzerClosedMilestoneLink
        "(==LINT_PREVIOUS_VERSION==)"    = $lastReleasedSonarlintVersion
        "(==GENERATED_SECTIONS==)"       = $generatedSections
        "(==GENERATED_SUMMARY==)"        = $generatedSummmary
        "(==GO_TO_LATEST_VERSION_TAG==)" = $goToLastVersionTag
        "(==DATE==)"                     = $releaseDate
        "(==LINT_VERSION==)"             = $sonarlintVersion2
        "(==LINT_VERSION_3==)"           = $sonarlintVersion3 
    }

    return $lookupTable
}

function UpdateNews($websitePath, $lookupTable)
{
    Trace "UpdateNews '$websitePath', TABLE: $lookupTable"
    
    $spacing = "                        "

    $newsTemplate = 
    "$spacing<li>`n" +
    "$spacing    <span class=`"bold`">(==DATE==)</span> - <a href=`"rules/index.html#sonarLintVersion=(==LINT_VERSION_3==)`" title=`"Go to version (==LINT_VERSION_3==)`">Version (==LINT_VERSION==)</a>`n" +
    "$spacing    (==GENERATED_SUMMARY==)`n" +
    "$spacing</li>`n"

    $newsText = ReplaceAll -lookupTable $lookupTable -string $newsTemplate

    $newsPagePath = "$websitePath\visualstudio\index.html"
    $newsPageContent = Get-Content $newsPagePath -Raw

    $sectionIdx = $newsPageContent.IndexOf('<section class="split" id="News">')
    if ($sectionIdx -eq -1)
    {
        throw "news section not found"
    }

    $ulIdx = $newsPageContent.IndexOf('<ul>', $sectionIdx)
    if ($ulIdx -eq -1)
    {
        throw "list in news section not found"
    }

    $pastUlIdx = $ulIdx + 6;
    $updatedNews = $newsPageContent.Insert($pastUlIdx, $newsText)

    Set-Content -Path $newsPagePath -Value $updatedNews
}


########################
# Github has a request rate limit. Use these functions with canned data for offline testing

function DEBUG_GetAnalyzerMilestone_GH($analyzerVersion)
{
    Trace "DEBUG_GetAnalyzerMilestone_GH '$analyzerVersion'"

    $result = @{}
    $result["newRules"] = @()
    $result["fixes"] = @()
    $result["improvements"] = @()
    $result["others"] = @()
    $result["allIssues"] = @()
    $result.number = 9

    $result.closedIssuesLink ="https://github.com/SonarSource/sonar-csharp/milestone/9?closed=1"
    $result.improvements = @( `
        'Update S100: Support custom dictionaries for adding names that will not raise issues', `
        'Update S1764: Detect same expression on Except() and Union() methods', `
        'Update S2234: Check for parameter types before reporting it as bug'
    )

    $result.fixes = @( `
        'Fix S110: "Class Name" infinite loop when class name contains non-Latin Characters', `
        'Fix S1481: do not report on variables used inside lambdas', `
        'Fix S2259: "Null pointer dereference" false positive in attached code', `
        'Fix S3346: Rule raises FP on peach' `
        )


    $result.newRules = @('Rule S101: A special case should be made for two-letter acronyms in which both letters are capitalized')

    $result.others = @( `
        'AD0001 ImplementIDisposableCorrectly ArgumentException', `
        'Automate website release process', `
        'Improve CFG to connect finally statements after break/continue/goto', `
        'Investigate performance issues with the analyzer', `
        'Move SonarAnalyzer to VS2017', `
        'POC for analyzer running on Linux', `
        'Rule S3985 Unused private classes should be removed', `
        'S1450 has false positive when methods call each other', `
        'S1751: Add exception for foreach loops', `
        'S3963 crashes' `
        )

    $result.allIssues = @( `
        'AD0001 ImplementIDisposableCorrectly ArgumentException', `
        'Automate website release process', `
        'Fix S110: "Class Name" infinite loop when class name contains non-Latin Characters', `
        'Fix S1481: do not report on variables used inside lambdas', `
        'Fix S2259: "Null pointer dereference" false positive in attached code', `
        'Fix S3346: Rule raises FP on peach', `
        'Improve CFG to connect finally statements after break/continue/goto', `
        'Investigate performance issues with the analyzer', `
        'Move SonarAnalyzer to VS2017', `
        'POC for analyzer running on Linux', `
        'Rule S101: A special case should be made for two-letter acronyms in which both letters are capitalized', `
        'Rule S3985 Unused private classes should be removed', `
        'S1450 has false positive when methods call each other', `
        'S1751: Add exception for foreach loops', `
        'S3963 crashes', `
        'Update S100: Support custom dictionaries for adding names that will not raise issues', `
        'Update S1764: Detect same expression on Except() and Union() methods', `
        'Update S2234: Check for parameter types before reporting it as bug'
        )
    return $result
}

function DEBUG_GetLintMilestone_GH($sonarlintVersion, $releaseType, $lintProjectUri)
{
    Trace "DEBUG_GetLintMilestone_GH '$sonarlintVersion', 'releaseType', '$lintProjectUri'"
        
    $lintMilestone = @{}
    $lintMilestone.number = 9
    $lintMilestone.closedIssuesLink = "https://github.com/SonarSource/sonarlint-visualstudio/milestone/8?closed=1"
    $lintMilestone.allIssues = @("Embed SonarC#/SonarVB v6.2", "Update SonarLint short description")

    return $lintMilestone
}
