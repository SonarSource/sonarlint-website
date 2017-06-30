#!/usr/bin/env bash
#
# Generate rules.json from specified analyzers
#
# Simply run this script without any arguments to get the usage message
# that describes the required arguments.
#
# Requirements:
# - Java
# - Rule Extractor jar with dependencies: clone and build sonarlint-core
# - Analyzer jars
#

usage() {
    test "$@" && echo error: $*
    echo usage: $0 version path/to/rules.json path/to/rule-extractor-with-deps-jar path/to/analyzer1-jar ...
    exit 1
}

test $# -gt 3 || usage

version=$1; shift
rules_json=$1; shift
rule_extractor=$1; shift

java -jar "$rule_extractor" "$version" "$@" > "$rules_json"
