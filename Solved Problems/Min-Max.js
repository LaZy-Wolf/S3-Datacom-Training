'use strict';

process.stdin.resume();
process.stdin.setEncoding('utf-8');

let inputString = '';
let currentLine = 0;

process.stdin.on('data', function(inputStdin) {
    inputString += inputStdin;
});

process.stdin.on('end', function() {
    inputString = inputString.split('\n');

    main();
});

function readLine() {
    return inputString[currentLine++];
}

/*
 * Complete the 'miniMaxSum' function below.
 *
 * The function accepts INTEGER_ARRAY arr as parameter.
 */

function miniMaxSum(arr) {
    // Write your code here
    let total = 0;
    let smallest = arr[0];
    let largest = arr[0];

    for (const number of arr) {
        total += number;

        if (number < smallest) {
            smallest = number;
        }

        if (number > largest) {
            largest = number;
        }
    }

    const minSum = total - largest;
    const maxSum = total - smallest;

    console.log(minSum + ' ' + maxSum);
}

function main() {

    const arr = readLine().replace(/\s+$/g, '').split(' ').map(arrTemp => parseInt(arrTemp, 10));

    miniMaxSum(arr);
}
