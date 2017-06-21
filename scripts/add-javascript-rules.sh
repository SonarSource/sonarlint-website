#!/usr/bin/env bash
#
# Add JavaScript rules to an existing rules.json file
#
# Simply run this script without any arguments to get the usage message
# that describes the required arguments.
#
# Requirements:
# - Java
# - jq utility on PATH
# - Rule Extractor jar with dependencies: clone and build sonarlint-core
# - SonarJS jar from which to extract rules
#

usage() {
    echo usage: $0 path/to/rule-extractor-with-deps-jar path/to/sonarjs-jar path/to/rules.json
    exit 1
}

{ type jq &>/dev/null || type jq.exe &> /dev/null; } || {
    echo Fatal: cannot find jq on PATH, please install it
    exit 1
}

test $# = 3 || usage

rule_extractor=$1
sonarjs=$2
rules=$3

trap 'rm -fr "$workdir"; exit' 0 1 2 3 15
workdir=$(mktemp -d)

cp -v $rules $workdir/rules.json
java -jar $rule_extractor 1.2.3 $sonarjs > $workdir/js-rules.json
jq -s '{version: .[0].version, rules: (.[0].rules + .[1].rules)}' $workdir/rules.json $workdir/js-rules.json > $rules
