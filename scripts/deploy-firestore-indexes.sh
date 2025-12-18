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

# === SPEAKERS ===
# Index 1: speakers (status ASC, order ASC, __name__ ASC)
create_index "speakers" \
    "field-path=status,order=ascending" \
    "field-path=order,order=ascending" \
    "field-path=__name__,order=ascending"

# Index 2: speakers (featured ASC, status ASC, order ASC, __name__ ASC)
create_index "speakers" \
    "field-path=featured,order=ascending" \
    "field-path=status,order=ascending" \
    "field-path=order,order=ascending" \
    "field-path=__name__,order=ascending"

# === SESSIONS ===
# Index 3: sessions (status ASC, order ASC, __name__ ASC)
create_index "sessions" \
    "field-path=status,order=ascending" \
    "field-path=order,order=ascending" \
    "field-path=__name__,order=ascending"

# Index 4: sessions (sessionType ASC, status ASC, order ASC, __name__ ASC)
create_index "sessions" \
    "field-path=sessionType,order=ascending" \
    "field-path=status,order=ascending" \
    "field-path=order,order=ascending" \
    "field-path=__name__,order=ascending"

# Index 5: sessions (sessionType ASC, category ASC, status ASC, order ASC, __name__ ASC)
create_index "sessions" \
    "field-path=sessionType,order=ascending" \
    "field-path=category,order=ascending" \
    "field-path=status,order=ascending" \
    "field-path=order,order=ascending" \
    "field-path=__name__,order=ascending"

# Index 6: sessions (sessionType ASC, timeSlot ASC, status ASC, order ASC, __name__ ASC)
create_index "sessions" \
    "field-path=sessionType,order=ascending" \
    "field-path=timeSlot,order=ascending" \
    "field-path=status,order=ascending" \
    "field-path=order,order=ascending" \
    "field-path=__name__,order=ascending"

# === FAQ ===
# Index 7: faq (status ASC, category ASC, order ASC, __name__ ASC)
create_index "faq" \
    "field-path=status,order=ascending" \
    "field-path=category,order=ascending" \
    "field-path=order,order=ascending" \
    "field-path=__name__,order=ascending"

# Index 8: faq (category ASC, status ASC, order ASC, __name__ ASC)
create_index "faq" \
    "field-path=category,order=ascending" \
    "field-path=status,order=ascending" \
    "field-path=order,order=ascending" \
    "field-path=__name__,order=ascending"

# === REGISTRATIONS ===
# Index 9: registrations (status ASC, createdAt DESC, __name__ DESC)
create_index "registrations" \
    "field-path=status,order=ascending" \
    "field-path=createdAt,order=descending" \
    "field-path=__name__,order=descending"

# Index 10: registrations (invoice.requested ASC, status ASC, payment.verifiedAt DESC, __name__ DESC)
create_index "registrations" \
    "field-path=invoice.requested,order=ascending" \
    "field-path=status,order=ascending" \
    "field-path=payment.verifiedAt,order=descending" \
    "field-path=__name__,order=descending"

# Index 11: registrations (payment.bankAccountId ASC, createdAt DESC, __name__ DESC)
create_index "registrations" \
    "field-path=payment.bankAccountId,order=ascending" \
    "field-path=createdAt,order=descending" \
    "field-path=__name__,order=descending"

# === BANK ACCOUNTS ===
# Index 12: bankAccounts (isActive ASC, displayOrder ASC, __name__ ASC)
create_index "bankAccounts" \
    "field-path=isActive,order=ascending" \
    "field-path=displayOrder,order=ascending" \
    "field-path=__name__,order=ascending"

echo "✅ Firestore index deployment complete!"
echo "   Note: Indexes are created asynchronously. Check the Firebase console for status."
