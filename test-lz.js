const LZString = require('./lz-string.js');
const str = ' hB3/PZ!g"2Xd2~M.2KP]G$)Ohx{nNeg$#Zyj|2G3MI!3Oym';
console.log('decompress:', LZString.decompress(str));
console.log('decompressFromBase64:', LZString.decompressFromBase64(str));
console.log('decompressFromUTF16:', LZString.decompressFromUTF16(str));
console.log('decompressFromEncodedURIComponent:', LZString.decompressFromEncodedURIComponent(str));
