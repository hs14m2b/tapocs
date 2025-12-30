//list all prime numbers between 2 and 98 in an array
let primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
let evens = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98];
console.log(primes.length);
console.log(evens.length);
let totalMatch = 0;
//for each combination of prime and even
for (let i = 0; i < primes.length; i = i + 1) {
    for (let j = 0; j < evens.length; j = j + 1) {
        let prime = primes[i];
        let even = evens[j];
        // P artithmetic series sum formula: P + (n-1)E
        // E arithmetic series = 1000E - (n-1)P
        for (let n = 1; n <= 1000; n = n + 1) {
            let Pval = prime + (n - 1) * even;
            let Eval = 1000 * even - (n - 1) * prime;
            if (Pval === Eval) {
                console.log("Found matching sums at prime: " + prime + " even: " + even + " n: " + n + " Sum: " + Pval);
                totalMatch = totalMatch + 1;
                //no need to continue inner loop
                break;
            }
            if (Pval > Eval) {
                //no need to continue inner loop
                break;
            }
            if (n === 1000) {
                console.log("exhausted series without overlap - increase max for n");
            }
        }
    }
}
console.log("Total Matches: " + totalMatch);
console.log("Total combinations checked: " + (primes.length * evens.length));