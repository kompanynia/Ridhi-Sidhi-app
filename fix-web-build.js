const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const htmlPath = path.join(distPath, 'index.html');

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Fix script tags to be modules
  html = html.replace(
    /<script src="(.*?)" defer><\/script>/g,
    '<script type="module" src="$1"></script>'
  );
  
  // Add import.meta polyfill
  const polyfill = `
    <script>
      // Polyfill for import.meta
      window.global = window;
      if (!window.process) {
        window.process = { env: {} };
      }
    </script>
  `;
  
  html = html.replace('</head>', polyfill + '</head>');
  
  fs.writeFileSync(htmlPath, html);
  console.log('Fixed HTML for module support');
}
