async function main() {
  const code = await (await fetch('https://assets.embedindia.st/js/bundle-jw.js')).text();
  const paths = code.match(/["'`]\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+[^"'`]*["'`]/g);
  if (paths) {
    const unique = [...new Set(paths)].filter(p => !p.includes('text/') && !p.includes('application/'));
    console.log('Paths found:', unique);
  }
}
main();
