#!/bin/bash
output_file="project_files.xml"

echo '<?xml version="1.0" encoding="UTF-8"?>' > $output_file
echo '<project>' >> $output_file

# Define the files you want to include
files=("src/modules/auth/auth.js" "src/modules/logger/logger.js" "tests/authController.test.js" "jest.config.js" "tests/setupTests.js" "package.json" "reports/junit.xml")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  <file path=\"$file\">" >> $output_file
        echo "    <![CDATA[" >> $output_file
        cat "$file" >> $output_file
        echo "    ]]>" >> $output_file
        echo "  </file>" >> $output_file
    fi
done

echo '</project>' >> $output_file

echo "XML file created: $output_file"
