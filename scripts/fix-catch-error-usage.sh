#!/bin/bash

echo "🔧 Fixing catch blocks where error variable is actually used..."

# Find all files with catch (_error) but use error in the block
files=$(grep -l "catch (_error)" src/**/*.ts src/**/*.tsx 2>/dev/null)

for file in $files; do
  # Check if the file actually uses 'error' in the catch block
  if grep -A3 "catch (_error)" "$file" | grep -q "error[^:]"; then
    echo "Fixing $file..."
    # Replace _error back to error where it's actually used
    sed -i '' 's/catch (_error)/catch (error)/' "$file"
  fi
done

echo "✅ Fixed catch blocks!"