
let currentAngle = 0;

let minVal = Math.PI / 2;
let maxVal = Math.PI;
let curVal = (minVal + maxVal)/2;
//for (let x = 0; x <= 2 * Math.PI; x = x + (Math.PI / 100)) {
for (let x = 0; x <50; x = x + 1) {
    let cosCur = Math.cos(curVal);
    let sinCur = Math.sin(curVal);
    let cosMin = Math.cos(minVal);
    let sinMin = Math.sin(minVal);
    let cosMax = Math.cos(maxVal);
    let sinMax = Math.sin(maxVal);

    let total = (curVal ) * sinCur - (cosCur * cosCur);
    let totalMin = (minVal ) * sinMin - (cosMin * cosMin);
    let totalMax = (maxVal ) * sinMax - (cosMax * cosMax);
    console.log("Angle: " + (curVal).toFixed(8) + " Total: " + total.toFixed(12));
    console.log("Min Angle: " + (minVal).toFixed(8) + " Total: " + totalMin.toFixed(12));
    console.log("Max Angle: " + (maxVal).toFixed(8) + " Total: " + totalMax.toFixed(12));
    if ( (total > 0 && totalMin < 0) || (total < 0 && totalMin > 0) ) {
        maxVal = curVal;
    } else {
        minVal = curVal;
    }
    curVal = (minVal + maxVal)/2;
}

//let xx = 0.760807065;
let xx = curVal;//2.81703961;
let cosXX = Math.cos(xx);
let sinXX = Math.sin(xx);
let r = -xx / cosXX;
console.log("r: " + r.toFixed(12));

//checking r
let checkx = xx + r * cosXX;
let checky = cosXX + r * sinXX
console.log("Check x: " + checkx.toFixed(12) + " Check y: " + checky.toFixed(12));
