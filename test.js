async function test() {
    const res = await fetch('https://streamfree.top/');
    const html = await res.text();
    const match = html.match(/href="\/live\/([^"]+)"/);
    console.log('Sample match:', match ? match[1] : 'none');
}
test();
