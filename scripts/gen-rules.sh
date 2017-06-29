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
    echo usage: $0 path/to/rule-extractor-with-deps-jar path/to/rules/dir path/to/analyzer1-jar ...
    exit 1
}

test $# -gt 2 || usage

rule_extractor=$1; shift
rules_dir=$1; shift

test -d "$rules_dir" || usage "$rules_dir is not a directory"

version=$(basename "$rules_dir")
rules=$rules_dir/rules.json

java -jar $rule_extractor $version "$@" > "$rules"
