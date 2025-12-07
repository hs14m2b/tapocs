
function fctrs(x,y) {
    let i = 0;
    let z = x;
    while (z % y === 0) {
        z = z / y;
        i = i + 1;
    }
    return i;
}

let target = 999999999;
let total = 0;
for (let n = 1; n <= target; n = n + 1) {
    let a = fctrs(n, 2);
    let b = fctrs(n, 3);
    let c = fctrs(n, 5);
    let d = fctrs(n, 7);
    if (n == (Math.pow(2, a) * Math.pow(3, b) * Math.pow(5, c) * Math.pow(7, d))) {
        total = total + (1/(n));
    }
}
console.log(total);