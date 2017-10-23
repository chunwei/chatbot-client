const asyncMap = require('slide').asyncMap
let o = { a: 1, b: 2, c: 3 };
console.log(Object.keys(o))

asyncMap(Object.keys(o), function (b, cb) { console.log(b) }, () => { console.log('cb') });
