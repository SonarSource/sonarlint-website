#!/usr/bin/env bash

usage() {
    echo usage: $0 path/to/rule-extractor-with-deps-jar path/to/sonarjs-jar path/to/rules.json
    exit 1
}

type jq &>/dev/null || {
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
