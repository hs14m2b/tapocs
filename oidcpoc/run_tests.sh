#!/bin/bash

# OIDC POC Test Runner
# Simplified test runner using jasmine like barspoc

echo "OIDC POC Test Runner"
echo "==================="

# Get the directory of this script
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Navigate to the lambdas directory to ensure imports work
cd "$PROJECT_ROOT/lambdas" || {
    echo "❌ Error: Could not navigate to lambdas directory"
    exit 1
}

echo "📁 Working from lambdas directory: $(pwd)"

# Install Lambda dependencies
echo "📦 Installing Lambda dependencies..."
npm install --silent
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Lambda dependencies"
    exit 1
fi
echo "✅ Lambda dependencies installed"

# Install test dependencies
echo "📦 Installing test dependencies..."
cd ../tests/spec
npm install --silent
if [ $? -ne 0 ]; then
    echo "❌ Failed to install test dependencies"
    exit 1
fi
echo "✅ Test dependencies installed"

# Run tests using barspoc approach
echo "🧪 Running tests with Jasmine..."
echo "-------------------------"

cd ../../lambdas
npx jasmine --config="../tests/spec/support/jasmine.json"
TEST_RESULT=$?

echo ""
echo "-------------------------"

# Display results
if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Tests failed!"
fi

echo ""

# Exit with test result status
exit $TEST_RESULT