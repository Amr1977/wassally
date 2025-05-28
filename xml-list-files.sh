#!/bin/bash
# xml-list-files.sh
# Usage: ./xml-list-files.sh [XML_FILE]
# If XML_FILE is not provided, the script defaults to "project_files.xml"

# Set the XML file to process (default to project_files.xml if none provided)
xml_file="${1:-project_files.xml}"

# Check if the XML file exists
if [ ! -f "$xml_file" ]; then
    echo "Error: XML file '$xml_file' not found."
    exit 1
fi

echo "Listing files contained in '$xml_file':"
echo "-------------------------------------------"

# Use grep and sed to extract the 'path' attribute from each <file> element.
# This command finds lines containing <file path=" and then extracts the file path value.
grep '<file path="' "$xml_file" | sed -E 's/.*<file path="([^"]+)".*/\1/'