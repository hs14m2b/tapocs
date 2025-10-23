#!/bin/bash

echo $SHELL

TIMESTAMP=$(date +%s)
echo $TIMESTAMP

cd ..

# set up test libraries
cd tests/spec
npm install
cd ../../lambdas
npm install
# run the tests
npx jasmine --config="../tests/spec/support/jasmine.json"
jasRetVal=$?
if [ $jasRetVal -ne 0 ]; then
    echo "Jasmine has determined there is a test failure"
    cd ..
    rm -fR build

    echo "build failed"
    exit $jasRetVal
else
    echo "Jasmine has determined the tests are fine"
fi
