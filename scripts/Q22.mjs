
let currentAngle = 60;
let currentTotal = 0;

for (let angleA = 60; angleA <= 90; angleA = angleA + 0.001) {
    let angleARad = angleA * (Math.PI / 180);
    let cosA = Math.cos(angleARad);
    let sinA = Math.sin(angleARad);
    let sin2A = Math.sin(2 * angleARad);
    let sinA2 = Math.sin(angleARad / 2);

    let total = (angleA / 2) * ((sin2A / (Math.pow(1 + cosA, 2))) + (sinA / Math.pow(1 + sinA2, 2)));
    if (total > currentTotal) {
        currentTotal = total;
        currentAngle = angleA;
    }
    else {
        console.log("Max angle: " + currentAngle + " with total: " + currentTotal.toFixed(12));
        break;
    }
}