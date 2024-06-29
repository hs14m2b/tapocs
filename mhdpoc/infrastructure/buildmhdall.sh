#!/bin/bash

echo $SHELL

#ENVIRONMENTLIST=( internal-dev-sandbox internal-dev internal-qa internal-qa-sandbox sandbox dev int ref )
#ENVIRONMENTLIST=( internal-dev-sandbox internal-dev )
#ENVIRONMENTLIST=( int )
ENVIRONMENTLIST=( sandbox )

for i in "${ENVIRONMENTLIST[@]}"
do
	. ./buildmhd.sh $i
done
