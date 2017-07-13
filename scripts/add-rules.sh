#!/usr/bin/env bash
#
# Add rules to an existing rules.json file
#
# Simply run this script without any arguments to get the usage message
# that describes the required arguments.
#
# Requirements:
# - Java
# - jq utility on PATH
# - Rule Extractor jar with dependencies: clone and build sonarlint-core
# - The jar files of additional analyzers
#

set -euf -o pipefail

usage() {
    echo usage: $0 path/to/rule-extractor-with-deps-jar path/to/rules.json path/to/analyzer.jar ...
    exit 1
}

{ type jq &>/dev/null || type jq.exe &> /dev/null; } || {
    echo Fatal: cannot find jq on PATH, please install it
    exit 1
}

test $# -ge 3 || usage

rule_extractor=$1; shift
rules=$1; shift

cleanup() {
    rm -fr "$workdir"
}

trap 'cleanup; exit 1' 1 2 3 15
trap 'cleanup; exit' 0

workdir=$(mktemp -d)

for analyzer; do
    echo "Appending rules from $analyzer ..."
    cp "$rules" "$workdir"/rules.json
    java -jar "$rule_extractor" dummyversion "$analyzer" > "$workdir"/extra.json
    jq -s '{version: .[0].version, rules: (.[0].rules + .[1].rules)}' "$workdir"/rules.json "$workdir"/extra.json > "$workdir"/rules.json.work
    mv "$workdir"/rules.json.work "$rules"
done
