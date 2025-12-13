#!/bin/bash
# Deploy Firestore composite indexes using gcloud CLI
# This script bypasses the Firebase CLI rules validation issue
#
# Usage: ./scripts/deploy-firestore-indexes.sh [PROJECT_ID] [DATABASE_ID]

set -e

PROJECT_ID="${1:-idmc-gcfsm-dev}"
DATABASE_ID="${2:-idmc-2026}"

echo "📦 Deploying Firestore indexes..."
echo "   Project: $PROJECT_ID"
echo "   Database: $DATABASE_ID"
echo ""

# Function to create an index (ignores "already exists" errors)
create_index() {
    local collection="$1"
    shift
    local fields=("$@")

    echo "🔧 Creating index for collection: $collection"

    # Build field-config arguments
    local field_args=""
    for field in "${fields[@]}"; do
        field_args="$field_args --field-config=$field"
    done

    # Execute gcloud command
    if gcloud firestore indexes composite create \
        --project="$PROJECT_ID" \
        --database="$DATABASE_ID" \
        --collection-group="$collection" \
        --query-scope=COLLECTION \
        $field_args \
        --async 2>&1; then
        echo "   ✅ Index creation initiated"
    else
        # Capture output to check for "already exists"
        local output
        output=$(gcloud firestore indexes composite create \
            --project="$PROJECT_ID" \
            --database="$DATABASE_ID" \
            --collection-group="$collection" \
            --query-scope=COLLECTION \
            $field_args \
            --async 2>&1) || true

        if echo "$output" | grep -qi "already exists"; then
            echo "   ⏭️ Index already exists, skipping"
        else
            echo "   ⚠️ Warning: $output"
        fi
    fi
    echo ""
}

# Deploy indexes defined in firestore.indexes.json
# Index 1: speakers (status ASC, order ASC)
create_index "speakers" \
    "field-path=status,order=ascending" \
    "field-path=order,order=ascending"

# Index 2: speakers (featured ASC, status ASC, order ASC)
create_index "speakers" \
    "field-path=featured,order=ascending" \
    "field-path=status,order=ascending" \
    "field-path=order,order=ascending"

echo "✅ Firestore index deployment complete!"
echo "   Note: Indexes are created asynchronously. Check the Firebase console for status."
