let a,b,c,d;
let total = 0;
let totalchecks = 0;
for (a = 99; a >= 1; a = a - 1) {
    for (b = 99; b >= 1; b = b - 1) {
        for (c = 99; c >= 1; c = c - 1) {
            for (d = 99; d >= 1; d = d - 1) {
                if (a != b && a != c && a != d && b != c && b != d && c != d && a>b)
                {

                    let currTotal = ((Math.sqrt(a) + Math.sqrt(b)) * (Math.sqrt(c) - Math.sqrt(d))).toFixed(10);
                    let currTotalInt = 0;
                    //check if currTotal is an integer
                    if (Number.isInteger(parseFloat(currTotal))) {
                        currTotalInt = Math.floor(parseFloat(currTotal));
                    }
                    if (currTotalInt > total) {
                        total = currTotalInt;
                        console.log("a: " + a + " b: " + b + " c: " + c + " d: " + d + " Total: " + total);
                    }
                }
            }
        }
    }
}
//let xcurrTotal = ((Math.sqrt(72) + Math.sqrt(50)) * (Math.sqrt(98) - Math.sqrt(2))).toFixed(10);
//console.log("Check Total: " + xcurrTotal);
//if (Number.isInteger(parseFloat(xcurrTotal))) {
//console.log("Check Total is integer");
//}
//else {
//    console.log("Check Total is NOT integer");
//}
