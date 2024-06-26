#!/bin/bash

echo $SHELL

ENVIRONMENTLIST=( internal-qa internal-qa-sandbox sandbox dev int ref )
#ENVIRONMENTLIST=( internal-dev-sandbox internal-dev )

for i in "${ENVIRONMENTLIST[@]}"
do
	. ./buildmhd.sh $i
done
