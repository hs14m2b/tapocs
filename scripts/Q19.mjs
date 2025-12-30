// Generate primes using Sieve of Eratosthenes
function generatePrimes(max) {
    const sieve = Array(max + 1).fill(true);
    sieve[0] = sieve[1] = false;
    
    for (let i = 2; i * i <= max; i++) {
        if (sieve[i]) {
            for (let j = i * i; j <= max; j += i) {
                sieve[j] = false;
            }
        }
    }
    
    return sieve.map((isPrime, num) => isPrime ? num : null).filter(n => n !== null);
}

// Generate even numbers
const generateEvens = (max) => Array.from({ length: max / 2 }, (_, i) => (i + 1) * 2);

const primes = generatePrimes(98);
const evens = generateEvens(98);

console.log(`Primes count: ${primes.length}`);
console.log(`Evens count: ${evens.length}`);

let totalMatch = 0;

// Solve algebraically: P + (n-1)E = 1000E - (n-1)P
// P + nE - E = 1000E - nP + P
//  nE - E = 1000E - nP
// n(E + P) = 1000E + E
// n = (1001E) / (E + P)

for (const prime of primes) {
    for (const even of evens) {
        // Calculate n directly from the equation
        const numerator = 1001 * even;
        const denominator = even + prime;
        
        //check that n is an integer within bounds
        if (numerator > 0 && numerator % denominator === 0) {
            const n = numerator / denominator;
            
            if (n >= 1 && n <= 1000) {
                const sum = prime + (n - 1) * even;
                console.log(`Found matching sums at prime: ${prime} even: ${even} n: ${n} Sum: ${sum}`);
                totalMatch++;
            }
        }
    }
}

console.log(`Total Matches: ${totalMatch}`);
console.log(`Total combinations checked: ${primes.length * evens.length}`);