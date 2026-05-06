#!/bin/bash
set -e

INPUT_FILE="pipeline/data/normalized_records.parquet"
OUTPUT_DIR="pipeline/data"
BRANCH_NAME="gh-action-run-temp"
WORKFLOW_NAME="cpp_matcher.yml"

echo "Checking if gh CLI is installed and authenticated..."
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) not found! Please install it from https://cli.github.com/ and 'gh auth login'"
    exit 1
fi

echo "Ensuring '$INPUT_FILE' exists..."
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: $INPUT_FILE not found."
    exit 1
fi

echo "Creating temporary branch: $BRANCH_NAME"
git checkout -B "$BRANCH_NAME"

echo "Forcing the data file to be tracked temporarily..."
# Force add it just in case it is in .gitignore
git add -f "$INPUT_FILE"

echo "Committing data..."
git commit -m "Temp execute cpp matcher data"

echo "Pushing temporary branch to origin..."
git push origin "$BRANCH_NAME" --force

echo "Triggering GitHub Actions workflow..."
# Trigger the workflow targeting our temporary branch
gh workflow run "$WORKFLOW_NAME" --ref "$BRANCH_NAME"

# Wait a second for github to register the run 
sleep 3

# Fetch the run ID
RUN_ID=$(gh run list --workflow="$WORKFLOW_NAME" --branch="$BRANCH_NAME" --limit 1 --json databaseId -q ".[0].databaseId")

if [ -z "$RUN_ID" ]; then
    echo "Failed to retrieve the Workflow Run ID."
    exit 1
fi

echo "Workflow Triggered! Run ID: $RUN_ID"
echo "Watching for completion (This will stream the logs)..."
gh run watch "$RUN_ID"

echo "Downloading Results..."
# Download the artifact back into pipeline/data/ 
gh run download "$RUN_ID" -n candidate-sets-result -D "$OUTPUT_DIR"

echo "Success! Output downloaded to $OUTPUT_DIR/candidate_sets.parquet"

echo "Cleaning up..."
# Switch back to previous branch
git checkout -
# Delete local temporary branch
git branch -D "$BRANCH_NAME"
# Delete remote temporary branch
git push origin --delete "$BRANCH_NAME"

echo "Done."
