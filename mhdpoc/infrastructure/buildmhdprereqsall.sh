#!/bin/bash

echo $SHELL

ENVIRONMENTLIST=( internal-dev-sandbox internal-dev internal-qa internal-qa-sandbox sandbox dev int ref )
#ENVIRONMENTLIST=( internal-dev-sandbox internal-dev )
#ENVIRONMENTLIST=( int )

for i in "${ENVIRONMENTLIST[@]}"
do
	. ./buildmhdprereqs.sh $i
done
