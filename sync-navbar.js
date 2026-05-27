const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');

// 1. Read index.html as the source of truth
const indexSource = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');

// Helper to extract a tag block cleanly
function extractTagBlock(html, startPattern, endPattern) {
  const startIndex = html.indexOf(startPattern);
  if (startIndex === -1) return null;
  const endIndex = html.indexOf(endPattern, startIndex + startPattern.length);
  if (endIndex === -1) return null;
  return html.substring(startIndex, endIndex + endPattern.length);
}

// Extract components from index.html
// Let's use comment boundaries or start/end tags
const announcementBlock = extractTagBlock(indexSource, '<!-- ANNOUNCEMENT -->', '</div>') 
  || extractTagBlock(indexSource, '<div class="announcement"', '</div>');

const headerBlock = extractTagBlock(indexSource, '<!-- HEADER -->', '</header>')
  || extractTagBlock(indexSource, '<header>', '</header>');

const mobileMenuBlock = extractTagBlock(indexSource, '<div class="mobile-menu" id="mobileMenu">', '</div>');

if (!headerBlock || !mobileMenuBlock) {
  console.error("Error: Could not extract header or mobile menu from index.html!");
  process.exit(1);
}

console.log("Successfully extracted source components from index.html:");
console.log("- Announcement block found:", !!announcementBlock);
console.log("- Header block length:", headerBlock.length);
console.log("- Mobile menu block length:", mobileMenuBlock.length);

const targetFiles = [
  'about.html',
  'birthday.html',
  'contact.html',
  'favourites.html',
  'login.html',
  'privacy-policy.html',
  'products.html',
  'refund-policy.html',
  'terms-of-service.html',
  'track.html'
];

targetFiles.forEach(fileName => {
  const filePath = path.join(PUBLIC_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File ${fileName} does not exist. Skipping.`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  console.log(`\nProcessing ${fileName}...`);

  // --- 1. REPLACE/REMOVE ANNOUNCEMENT BAR ---
  // Look for any existing announcement block
  const existingAnnouncement = extractTagBlock(content, '<!-- ANNOUNCEMENT -->', '</div>')
    || extractTagBlock(content, '<div class="announcement"', '</div>');

  if (existingAnnouncement) {
    content = content.replace(existingAnnouncement, announcementBlock);
    console.log(`  - Replaced existing announcement bar`);
  } else {
    // If not found, insert it right before the header (which we will place next)
    // We will do this during the header replacement
    console.log(`  - No existing announcement bar found`);
  }

  // --- 2. REPLACE/REMOVE HEADER ---
  // In birthday.html, the header is `<nav class="navbar">...</nav>`. Let's handle it.
  const existingNavbar = extractTagBlock(content, '<!-- NAVBAR', '</nav>')
    || extractTagBlock(content, '<nav class="navbar">', '</nav>');
  
  const existingHeader = extractTagBlock(content, '<!-- HEADER -->', '</header>')
    || extractTagBlock(content, '<header>', '</header>');

  if (existingNavbar) {
    content = content.replace(existingNavbar, headerBlock);
    console.log(`  - Replaced existing <nav class="navbar"> with <header>`);
  } else if (existingHeader) {
    content = content.replace(existingHeader, headerBlock);
    console.log(`  - Replaced existing <header>`);
  } else {
    console.warn(`  - WARNING: Could not find header/navbar block in ${fileName}!`);
  }

  // If announcement was not present, make sure it is prepended right before <header>
  if (!existingAnnouncement && announcementBlock) {
    content = content.replace(headerBlock, `${announcementBlock}\n\n${headerBlock}`);
    console.log(`  - Prepended announcement bar before <header>`);
  }

  // --- 3. REPLACE/REMOVE MOBILE MENU ---
  // Pages might have multiple duplicate mobile menus (like products.html). We will find and remove all of them,
  // and insert exactly one right after the header block.
  
  // First, remove any mobile-menu div blocks completely from the file
  let mobileMenuRegex = /<div class="mobile-menu"[^>]*>([\s\S]*?)<\/div>/g;
  let matchesCount = 0;
  content = content.replace(mobileMenuRegex, (match) => {
    matchesCount++;
    return ''; // remove it
  });

  if (matchesCount > 0) {
    console.log(`  - Removed ${matchesCount} old mobile menu(s)`);
  }

  // Now insert the new mobile menu exactly right after the header block
  const headerIndex = content.indexOf(headerBlock);
  if (headerIndex !== -1) {
    const insertPosition = headerIndex + headerBlock.length;
    content = content.substring(0, insertPosition) + '\n  ' + mobileMenuBlock + content.substring(insertPosition);
    console.log(`  - Inserted new mobile menu right after <header>`);
  } else {
    console.warn(`  - WARNING: Could not find header block insertion point in ${fileName}!`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Finished processing ${fileName}.`);
});

console.log("\nNavbar synchronization completed successfully!");
