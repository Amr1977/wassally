#!/bin/bash
output_file="project_files.xml"

echo '<?xml version="1.0" encoding="UTF-8"?>' > "$output_file"
echo '<project>' >> "$output_file"

# Use find to capture important files:
#
# - Include source code in src/ (all .js and .mjs files)
# - Include tests in tests/ (all .js files)
# - Include configuration and docs (package.json, jest.config.js, .gitignore, README.md, etc.)
# - Also include shell scripts (*.sh)
#
# Adjust the file types as needed.
files=$(find . -type f \( \
    -name "*.js" -o \
    -name "*.mjs" -o \
    -name "*.json" -o \
    -name "*.yml" -o \
    -name "*.yaml" -o \
    -name "*.sh" -o \
    -name "*.md" \
\) \
-not -path "./node_modules/*" \
-not -path "./reports/*" \
-not -path "./src/controllers/*" \
-not -path ".src/modules/logger/logs/*" \
-not -path "./functions/node_modules/*" )

while IFS= read -r file; do
    full_path=$(realpath "$file")
    echo "Processing: $full_path"
    echo "  <file path=\"$full_path\">" >> "$output_file"
    echo "    <![CDATA[" >> "$output_file"
    cat "$file" >> "$output_file"
    echo "    ]]>" >> "$output_file"
    echo "  </file>" >> "$output_file"
done <<< "$files"

echo '</project>' >> "$output_file"

echo "XML file created: $output_file"
