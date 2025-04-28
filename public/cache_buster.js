const fs = require('fs');
const path = require('path');

// Function to get all HTML files from a directory recursively
function getAllHtmlFiles(dir) {
  let htmlFiles = [];
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      htmlFiles = htmlFiles.concat(getAllHtmlFiles(filePath));
    } else if (path.extname(file) === '.html') {
      htmlFiles.push(filePath);
    }
  });

  return htmlFiles;
}

// Function to update query strings for cache busting
function updateQueryStrings(filePath) {
  try {
    // Read the HTML file
    const htmlContent = fs.readFileSync(filePath, 'utf8');

    // Regular expressions for CSS and JS file references
    const cssRegex = /<link.*href="(.+?\.css)"/g;
    const jsRegex = /<script.*src="(.+?\.js)"/g;

    // Current timestamp for cache busting
    const timestamp = Date.now();

    // Replace function for CSS and JS
    const updatedHtml = htmlContent
      .replace(cssRegex, (match, url) => match.replace(url, `${url.split('?')[0]}?v=${timestamp}`))
      .replace(jsRegex, (match, url) => match.replace(url, `${url.split('?')[0]}?v=${timestamp}`));

    // Write the updated HTML back to the file
    fs.writeFileSync(filePath, updatedHtml, 'utf8');
    console.log(`Updated query strings in ${filePath}`);
  } catch (err) {
    console.error('Error updating query strings in:', filePath, err);
  }
}

// Directory containing your HTML files
const rootDir = path.join(__dirname); // Change this to your project root directory

// Find all HTML files in the directory
const htmlFiles = getAllHtmlFiles(rootDir);

// Update query strings for each file
htmlFiles.forEach(updateQueryStrings);

console.log('Cache busting applied to all HTML files!');