param
(
    [Parameter(Mandatory = $true, HelpMessage = "target path to store the rules description")]
    [ValidateScript({Test-Path $_})]
    [string]
    $targetFolder,

    [Parameter(Mandatory = $true, HelpMessage = "path to rule extractor (from sonarlint-core). For example 'c:\src\sonarlint-rule-extractor-2.18-SNAPSHOT-jar-with-dependencies.jar' ")]
    [ValidateScript({Test-Path $_})]
    [string]
    $ruleExtractor
)

function FindDaemonVersion($fileText)
{
    $versionRegex = [regex]'daemonVersion\s*=\s*\"(?<version>[0-9\.]+)"\s*;'

    $versionGroup = $versionRegex.Match($fileText).Groups["version"]
    if (!$versionGroup.Success)
    {
        Write-Error "todo"
    }
    $version = $versionGroup.Value
    $version
}

function GetFileContent($url)
{
    $response = Invoke-WebRequest -Uri $url -Method "GET" -UseBasicParsing
    if ($response.StatusCode -ne 200)
    {
        $code = $response.StatusCode
        Write-Error "unexpected http code: $code"
    }

    return $response.Content
}

function DownloadFile($url, $targetPath)
{
    (New-Object System.Net.WebClient).DownloadFile($url, $targetPath)

    # $text = GetFileContent -url $url
    # Set-Content -Path $targetPath -Value $text
}


$ruleExtractor = "C:\src\sonarlint-core\rule-extractor\target\sonarlint-rule-extractor-2.18-SNAPSHOT-jar-with-dependencies.jar"


$daemonText = GetFileContent -url "https://raw.githubusercontent.com/SonarSource/sonarlint-visualstudio/master/src/Integration.Vsix/SonarLintDaemon/SonarLintDaemon.cs"
$daemonVersion = FindDaemonVersion -fileText $daemonText

$pomXmlText = GetFileContent -url "https://raw.githubusercontent.com/SonarSource/sonarlint-core/$daemonVersion/daemon/pom.xml"
$pomXml = [xml]$pomXmlText
$sonarJsVersion  = $pomXml["project"]["properties"]["sonar.javascript.version"].'#text'
$sonarCppVersion = $pomXml["project"]["properties"]["sonar.cfamily.version"].'#text'
    
$targetFolder = $PSScriptRoot

DownloadFile -url "https://sonarsource.bintray.com/Distribution/sonar-javascript-plugin/sonar-javascript-plugin-$sonarJsVersion.jar" "$targetFolder\jsplugin.jar"
DownloadFile -url "https://sonarsource.bintray.com/CommercialDistribution/sonar-cfamily-plugin/sonar-cfamily-plugin-$sonarCppVersion.jar" "$targetFolder\cplugin.jar"

java -jar $ruleExtractor dummyversion-js "$targetFolder\jsplugin.jar" > "jsplugin.rule.json"
java -jar $ruleExtractor dummyversion-c "$targetFolder\cplugin.jar" > "cplugin.rule.json"
