// A function to calculate the factorial of a number iteratively
function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// A function to calculate combinations (n choose r)
function combinations(n, r) {
  if (r < 0 || r > n) {
    return 0; // By definition
  }
  if (r === 0 || r === n) {
    return 1; // By definition
  }
  // Use the formula n! / (r! * (n-r)!)
  return factorial(n) / (factorial(r) * factorial(n - r));
}

// Example Usage:
const n = 6;
const r = 2;
let nineC6 = combinations(9, 6);
console.log("9 choose 6: " + nineC6);
let numberOfWays = nineC6 * 2*3*2*2*5*12;
console.log(numberOfWays);
let probability = numberOfWays / factorial(12);
console.log(probability);