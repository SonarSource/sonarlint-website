Add-Type -AssemblyName System.Web

function Trace ($msg)
{
    write-host $msg -foreground "magenta"
}

function ReplaceAll($lookupTable, $string)
{
    $result = $string
    $lookupTable.GetEnumerator() | ForEach-Object {

        $result = $result.Replace($_.Key, $_.Value)
    }
    $result
}

function CreateCheckoutBranch()
{
    Trace "creating and checking out branch 'sonarlint-vs'"

    git checkout gh-pages 2> $null
    git pull 2> $null
    git branch -d sonarlint-vs 2> $null
    git checkout -b sonarlint-vs 2> $null
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
    $desc
}

function RebuildAnalyzer($analyzerPath)
{
    Trace "rebuilding analyzer"
    
     # todo: need vs commandline
     $sln = "$analyzerPath\SonarAnalyzer.sln"
     nuget restore $sln
     msbuild $sln /t:rebuild /p:Configuration=Release
     # todo: check for errors
}

function RebuildWebsite($websitePath)
{
    Trace "rebuilding website"
    
     # todo: need vs commandline
     $sln = "$websitePath\sonarlint.org.sln"
     msbuild $sln /t:rebuild #/p:Configuration=Release
     # todo: check for errors
}

function FindLastReleasedAnalyzerVersion($appTsPath)
{
    Trace "FindLastReleasedAnalyzerVersion '$appTsPath'"
    
    $appTsContent = Get-Content $appTsPath -Raw

    $lastReleasedAnalyzerVersionRegex = [regex]"VisualStudioRulePageController\('(?<version>.+)'\);"

    $versionGroup = $lastReleasedAnalyzerVersionRegex.Match($appTsContent).Groups["version"]
    if (!$versionGroup.Success)
    {
        Write-Error "todo"
    }
    $lastReleasedAnalyzerVersion = $versionGroup.Value
    $lastReleasedAnalyzerVersion
}

function FindLastReleasedLintVersion($appTsPath)
{
    Trace "FindLastReleasedLintVersion '$appTsPath'"
    
    $lastReleasedAnalyzerVersion = FindLastReleasedAnalyzerVersion -appTsPath $appTsPath
    $appTsContent = Get-Content $appTsPath -Raw

    $escapedAnalyzerVersion = $lastReleasedAnalyzerVersion.Replace(".", "\.")

    $lastReleasedLintVersionRegex = [regex]"sonarLintVersion.*?'(?<ver>.+)'.*?sonarAnalyzerVersion:.*?'$escapedAnalyzerVersion'.*?}\s*"
    $match = $lastReleasedLintVersionRegex.Match($appTsContent)

    if (!$match.Success)
    {
        Write-Error "todo"
    }
    $versionGroup = $match.Groups["ver"]

    $lastReleasedLintVersion = $versionGroup.Value
    $lastReleasedLintVersion
}

function UpdateAppTsMapping($appTsPath, $releaseType, $analyzerVersion, $lintVersion, $lastReleasedAnalyzerVersion)
{
    Trace "UpdateAppTsMapping '$appTsPath', '$releaseType', '$analyzerVersion', '$lintVersion', '$lastReleasedAnalyzerVersion'"
    
    $appTsContent = Get-Content $appTsPath -Raw

    $lintVersionString = $lintVersion
    if ($releaseType -ne "final")
    {
        $lintVersionString += "-" + $releaseType
    }

    $newline = ",`r`n    { sonarLintVersion: '$lintVersionString', sonarAnalyzerVersion: '$analyzerVersion' }"

    $lastLineInMap = [regex]"'\s*}\s*`n"
    $lastLineMatch = $lastLineInMap.Match($appTsContent)
    if (!$lastLineMatch.Success)
    {
        Write-Error "todo"
    }

    $idx = $lastLineMatch.Index + $lastLineMatch.Length - 2 # for newline
    $updatedContent = $appTsContent.Insert($idx, $newline)

    if ($releaseType -eq "final")
    {
        $lastReleasedAnalyzerVersionRegex = [regex]"VisualStudioRulePageController\('.+'\);"

        $match = $lastReleasedAnalyzerVersionRegex.Match($appTsContent)
        if (!$match.Success)
        {
            Write-Error "todo"
        }

        #todo: check
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

    # todo: verify if updated
    Set-Content -Path $indexHtmlPath -Value $previousIndexContentUpdated
}

function GenerateJsonRulesTo($analyzerPath, $targetPath)
{
    Trace "GenerateJsonRulesTo '$analyzerPath', '$targetPath'"
    
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
    $result
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
    $result
}


function DEBUG_GetAnalyzerMilestone_GH($analyzerVersion)
{
    Trace "DEBUG GetAnalyzerMilestone_GH '$analyzerVersion'"

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


function GetAnalyzerMilestone_GH($analyzerVersion)
{
    Trace "GetAnalyzerMilestone_GH '$analyzerVersion'"

    $allMilestones = Invoke-WebRequest -Uri "$analyzerProjectUri/milestones" -Method "GET" -UseBasicParsing
    $allMilestonesJson = ConvertFrom-Json $allMilestones.Content

    #todo: fail if not exactly 1
    #todo: only search title?
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
        # todo: list 
        Write-Warning "unclosed tickets in analyzer milestone"
    }

    $allIssueTitles =  $milestoneIssuesjson | select -ExpandProperty title

    $result["newRules"] = @()
    $result["fixes"] = @()
    $result["improvements"] = @()
    $result["others"] = @()
    $result["allIssues"] = @()

    $ruleRegexString = "^{0}\s+S\d+:"
    $newRuleRegex = [regex]([String]::Format($ruleRegexString, "Rule"))
    $fixRuleRegex = [regex]([String]::Format($ruleRegexString, "Fix"))
    $improvementRuleRegex = [regex]([String]::Format($ruleRegexString, "Update")) #todo!

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

function DEBUG_GetLintMilestone_GH($lintVersion, $releaseType, $lintProjectUri)
{
    Trace "DEBUG_GetLintMilestone_GH '$lintVersion', 'releaseType', '$lintProjectUri'"
        
    $lintMilestone = @{}
    $lintMilestone.number = 9
    $lintMilestone.closedIssuesLink = "https://github.com/SonarSource/sonarlint-visualstudio/milestone/8?closed=1"
    $lintMilestone.allIssues = @("Embed SonarC#/SonarVB v6.2", "Update SonarLint short description")

    return $lintMilestone
}


function GetLintMilestone_GH($lintVersion, $releaseType, $lintProjectUri)
{
    Trace "GetLintMilestone_GH '$lintVersion', '$releaseType', '$lintProjectUri'"

    $allMilestones = Invoke-WebRequest -Uri "$lintProjectUri/milestones" -Method "GET" -UseBasicParsing
    $allMilestonesJson = ConvertFrom-Json $allMilestones.Content

    $lintVersionString = ToVersion2 -version $lintVersion

    if ($releaseType -ne "final")
    {
        $lintVersionString += "-" + $releaseType
    }

    #todo: fail if not exactly 1
    #todo: only search title?
    $milestone = $allMilestonesJson | Where-Object { $_.title -eq $lintVersionString }

    $result = @{}
    $result["closedIssuesLink"] = $milestone.html_url + "?closed=1"
    $result["number"] = $milestone.number
    $number = $result["number"]
    $milestoneIssues = Invoke-WebRequest -Uri "$lintProjectUri/issues?milestone=$number&state=all" -Method "GET" -UseBasicParsing
    $milestoneIssuesjson = ConvertFrom-Json $milestoneIssues.Content

    $unclosedIssues = $milestoneIssuesjson | where-object { $_.state -ne "closed" }
    if ($unclosedIssues.Count -gt 0)
    {
        # todo: list
        Write-Warning "unclosed tickets in lint milestone"
    }

    $result["allIssues"] = $milestoneIssuesjson | select -ExpandProperty title
    [Array]::Sort($result["allIssues"])
    
    $result
}

function WriteReleaseNotes($templatePath, $analyzerVersionPath, $lookupTable)
{
    Trace "WriteReleaseNotes '$templatePath', '$analyzerVersionPath'"
    
    #TODO: remove ..\
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

    $releaseDescription
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
    $result
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

    # [System.Web.HttpUtility]::HtmlEncode('something <somthing else>')

    $sections += GenerateSection -title "New Rules" -arr $analyzerMilestone["newRules"]
    $sections += GenerateSection -title "Bug fixes" -arr $analyzerMilestone["fixes"]
    $sections += GenerateSection -title "Rule improvements" -arr $analyzerMilestone["improvements"]
    $sections += GenerateSection -title "Others" -arr $analyzerMilestone["others"]

    $sections
}

function GenerateDescriptionTable($analyzerVersion, $lintVersion, $releaseType, $lintProjectUri, $analyzerProjectUri, $lastReleasedLintVersion)
{
    Trace "GenerateDescriptionTable '$analyzerVersion', '$lintVersion', '$releaseType', '$lintProjectUri', '$analyzerProjectUri', '$lastReleasedLintVersion'"
    
    $lintMilestone = DEBUG_GetLintMilestone_GH -lintVersion $lintVersion -lintProjectUri $lintProjectUri -releaseType $releaseType
    $lintClosedMilestoneLink = $lintMilestone["closedIssuesLink"] #"https://github.com/SonarSource/sonarlint-visualstudio/milestone/8?closed=1"

    $analyzerMilestone = DEBUG_GetAnalyzerMilestone_GH -analyzerVersion $analyzerVersion -analyzerProjectUri $analyzerProjectUri
    $analyzerClosedMilestoneLink = $analyzerMilestone["closedIssuesLink"]  #"https://github.com/SonarSource/sonar-csharp/milestone/8?closed=1"

    $goToLastVersionTag = '<li class="release-goto-latest"><a href ="#">Go to latest version</a></li>'
    if ($releaseType -eq "final")
    {
        $goToLastVersionTag= "<!--$goToLastVersionTag-->"
    }

    $generatedSections = GenerateSections -analyzerMilestone $analyzerMilestone
    $generatedSummmary = GenerateSummary($analyzerMilestone)
    $releaseDate = Get-Date -Format "MMMM d, yyyy"
    $lintVersion2 = ToVersion2 -version $lintVersion
    $lintVersion3 = ToVersion3 -version $lintVersion

    $lookupTable = @{
        "(==LINT_MILESTONE_LINK==)"      = $lintClosedMilestoneLink
        "(==ANALYZER_MILESTONE_LINK==)"  = $analyzerClosedMilestoneLink
        "(==LINT_PREVIOUS_VERSION==)"    = $lastReleasedLintVersion
        "(==GENERATED_SECTIONS==)"       = $generatedSections
        "(==GENERATED_SUMMARY==)"        = $generatedSummmary
        "(==GO_TO_LATEST_VERSION_TAG==)" = $goToLastVersionTag
        "(==DATE==)"                     = $releaseDate
        "(==LINT_VERSION==)"             = $lintVersion2
        "(==LINT_VERSION_3==)"           = $lintVersion3 
    }

    $lookupTable
}

function UpdateNews($websitePath, $lookupTable)
{
    Trace "UpdateNews '$websitePath', TABLE: $lookupTable"
    
    $spacing = "                        "

    # todo: make sure it's version3
    $newsTemplate = 
    "$spacing<li>`n" +
    "$spacing    <span class=`"bold`">(==DATE==)</span> - <a href=`"rules/index.html#sonarLintVersion=(==LINT_VERSION_3==)`" title=`"Go to version (==LINT_VERSION_3==)`">Version (==LINT_VERSION==)</a>`n" +
    "$spacing    (==GENERATED_SUMMARY==)`n" +
    "$spacing</li>`n"

    $newsText = ReplaceAll -lookupTable $lookupTable -string $newsTemplate

    $newsPagePath = "$websitePath\visualstudio\index.html"
    $newsPageContent = Get-Content $newsPagePath -Raw

    #todo: what if not found
    $sectionIdx = $newsPageContent.IndexOf('<section class="split" id="News">')
    $ulIdx = $newsPageContent.IndexOf('<ul>', $sectionIdx)

    $pastUlIdx = $ulIdx + 6;

    $updatedNews = $newsPageContent.Insert($pastUlIdx, $newsText)

    Set-Content -Path $newsPagePath -Value $updatedNews
}

function CommitChanges($lintVersion)
{
    Trace "CommitChanges"
    
    git add .
    git commit -m "Add SonarLint for VS $lintVersion"
}
