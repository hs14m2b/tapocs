function containsDuplicate(arr) {
    let seen = {};
    for (let i = 0; i < arr.length; i++) {
        if (seen[arr[i]]) {
            return true;
        }
        seen[arr[i]] = true;
    }
    return false;
}

let numbers = [1,2,3,4,5,6,7,8,9,10];
let i,j,k,l,m;
let hcfs = [];
let totalCombinations = 0;

for (i = 0; i < numbers.length; i = i + 1) {
    //assign first number.
    let personOne = [numbers[i]];
    for (j = 0; j < numbers.length; j = j + 1) {
        if (!personOne.includes(numbers[j])) 
        {
            personOne.push(numbers[j]);
        } else {
            //console.log("Duplicate found at j: " + numbers[j]);
            continue;
        }
        for (k = 0; k < numbers.length; k = k + 1) {
            if (!personOne.includes(numbers[k])) 
            {
                personOne.push(numbers[k]);
            } else {
                //console.log("Duplicate found at k: " + numbers[k]);
                continue;
            }
            for (l = 0; l < numbers.length; l = l + 1) {
                if (!personOne.includes(numbers[l])) 
                {
                    personOne.push(numbers[l]);
                } else {
                    //console.log("Duplicate found at l: " + numbers[l]);
                    continue;
                }
                for (m = 0; m < numbers.length; m = m + 1) {
                    if (!personOne.includes(numbers[m])) 
                    {
                        totalCombinations = totalCombinations + 1;
                        personOne.push(numbers[m]);
                    } else {
                        //console.log("Duplicate found at m: " + numbers[m]);
                        continue;
                    }
                    //personOne has 5 unique numbers.
                    //assign rest to personTwo
                    let personTwo = [];
                    for (let n = 0; n < numbers.length; n = n + 1) {
                        if (!personOne.includes(numbers[n])) {
                            personTwo.push(numbers[n]);
                        }
                    }
                    //calcluate products
                    let productOne = 1;
                    for (let p = 0; p < personOne.length; p = p + 1) {
                        productOne = productOne * personOne[p];
                    }
                    let productTwo = 1;
                    for (let q = 0; q < personTwo.length; q = q + 1) {
                        productTwo = productTwo * personTwo[q];
                    }
                    //find highest common factor
                    let a = productOne;
                    let b = productTwo;
                    while (b != 0) {
                        let temp = b;
                        b = a % b;
                        a = temp;
                    }
                    let hcf = a;
                    if (hcf > 1) {
                        //console.log("Person One: " + personOne + " Product: " + productOne);
                        //console.log("Person Two: " + personTwo + " Product: " + productTwo);
                        //console.log("HCF: " + hcf);
                        hcfs.push(hcf);
                    }
                    personOne.pop();
                }
                personOne.pop();
            }
            personOne.pop();
        }
        personOne.pop();
    }
    personOne.pop();
}
//remove duplicates from hcfs
let uniqueHcfs = [...new Set(hcfs)];
console.log("Unique HCFs: " + uniqueHcfs);
let totalHcf = 0;
for (let r = 0; r < uniqueHcfs.length; r = r + 1) {
    totalHcf = totalHcf + uniqueHcfs[r];
}
console.log("Total of Unique HCFs: " + totalHcf);
console.log("Total Combinations Checked: " + totalCombinations);