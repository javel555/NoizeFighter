// import Random from 'random-seedable';
var Random = require('random-seedable');
var SimplexNoise = require('simplex-noise');

console.log("NoizeFighter");

//
// Const
//
let RESOLUTION = 8;
let DISPLAY_SIZE = 128;
let IMAGE_DATA_SIZE = RESOLUTION * RESOLUTION;
let SEED = Date.now();

let USE_PARIN = false;

//
// Initialize
//
// const Canvas = document.createElement('canvas');
// Canvas.width = DISPLAY_SIZE;
// Canvas.height = DISPLAY_SIZE;
// Canvas.style.border = 'solid #fff 3px';
// document.querySelector("#body").appendChild(Canvas);

// const CTX = Canvas.getContext('2d');
// CTX.imageSmoothingEnabled = false;

const Parin = new SimplexNoise();


//
// Generators
//
function random(row, col, i){
    const value = seedRandom(row, col, SEED + SEED * i);
    return value < 0.5 ? 0 : 1;
}

function parin(row, col, i){
    const freq = 0.08;
    const value = Parin.noise3D(row * freq, col * freq, SEED + SEED * i);
    return value < 0.5 ? 0 : 1;
}

function generate(row, col, i){
    if(USE_PARIN){
        return parin(row, col, i);
    }else{
        return random(row, col, i);
    }
}

//
// HitTest
//
function hitRect(col, row){
    const res = RESOLUTION - 1;
    return (0 < col && col < res && 0 < row && row < res) ? 1 : 0;
}
function hitCircle(col, row){
    const r = (RESOLUTION - 1) / 2;
    const x = col - r;
    const y = row - r;
    return (x*x+y*y < r*r) ? 1 : 0;
}
function hitTriangle(col, row){
    // see also: http://www.thothchildren.com/chapter/5b267a436298160664e80763
    const width = RESOLUTION - 1;
    const r = width / 2;
    const p0 = [1,1]
    const p1 = [width+1,r];
    const p2 = [1,width-1];
    const x = 0;
    const y = 1;

    const b1 = cross(col,row, p0[x],p0[y], p1[x],p1[y]) < 0;
    const b2 = cross(col,row, p1[x],p1[y], p2[x],p2[y]) < 0;
    const b3 = cross(col,row, p2[x],p2[y], p0[x],p0[y]) < 0;

    if((b1 == b2) && (b2 == b3)){
        return 1;
    }else{
        return 0;
    }

// const area = 0.5 * (-p1[y]*p2[x] + p0[y]*(-p1[x]+p2[x]) + p0[x]*(p1[y]-p2[y]) + p1[x]*p2[y]);
// const s = 1/(2*area) * (p0[y]*p2[x] - p0[x]*p2[y] + (p2[y]-p0[y])*col + (p0[x]-p2[x])*row);
// const t = 1/(2*area) * (p0[x]*p1[y] - p0[y]*p1[x] + (p0[y]-p1[y])*col + (p1[x]-p0[x])*row);
// if((0 < s < 1) && (0 < t < 1) && (0 < 1-s-t < 1)){
//     return 1;
// }else{
//     return 0;
// }
    /*
double Area = 0.5 *(-p1y*p2x + p0y*(-p1x + p2x) + p0x*(p1y - p2y) + p1x*p2y);
double s = 1/(2*Area)*(p0y*p2x - p0x*p2y + (p2y - p0y)*px + (p0x - p2x)*py);
double t = 1/(2*Area)*(p0x*p1y - p0y*p1x + (p0y - p1y)*px + (p1x - p0x)*py);
 
if((0 < s < 1) && (0 < t < 1)&&(0<1-s-t<1)){
    return 1; //Inside Triangle
}else{
    return 0;
}
    */
}

function hitTest(col, row, type){
    switch(type){
        case 0:
            return hitRect(col, row);
        case 1:
            return hitCircle(col, row);
        case 2:
            return hitTriangle(col, row);
    }
}

//
// Create Image
//
function createImage(vari, type){
    const parent = document.querySelector("#body");
    if(vari == 0) parent.appendChild(document.createElement("br"));

    const canvas = document.createElement("canvas");
    canvas.width = DISPLAY_SIZE;
    canvas.height = DISPLAY_SIZE;
    // canvas.style.border = 'solid #fff 3px';
    parent.appendChild(canvas);

    const _ctx = canvas.getContext("2d");
    _ctx.imageSmoothingEnabled = false;

    const myImage = [];
    const myAlpha = [];
    for(let i = 0; i < IMAGE_DATA_SIZE; i++){
        const col = Math.floor(i % RESOLUTION);
        const row = Math.floor(i / RESOLUTION);
        let color = generate(col, flip(row, RESOLUTION), vari+type);
        myImage.push(color);
        let alpha = hitTest(col, row, type);
        myAlpha.push(alpha);
    }
    // console.log(myImage);
    // console.log(myAlpha);

    const imageData = _ctx.createImageData(RESOLUTION, RESOLUTION);
    for(let i=0; i < imageData.data.length; i+= 4){
        const color = myImage[Math.floor(i / 4)] * 255;
        const alpha = myAlpha[Math.floor(i / 4)] * 255;
        // Modify pixel data
        imageData.data[i + 0] = color;
        imageData.data[i + 1] = color;
        imageData.data[i + 2] = color;
        imageData.data[i + 3] = alpha;
    }

    createImageBitmap(imageData)
    .then(sprite=>{
        _ctx.drawImage(sprite, 0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
    });
}

//
// Utility
//
function seedRandom(seedA, seedB=0, seedC=0){
    let seed = seedA * seedB * seedC * seedC;
    Random.seed = seed;
    return Random.float();
}

function flip(value, max){
    if(value < max / 2) return value;
    return max - value - 1;
}

function cross(p1x,p1y, p2x,p2y, p3x,p3y){
    return  (p1x-p3x) * (p2y-p3y) - (p2x-p3x) * (p1y-p3y);
}

//
// Event
//
function start(){
    RESOLUTION = 8;
    DISPLAY_SIZE = 128;
    IMAGE_DATA_SIZE = RESOLUTION * RESOLUTION;
    SEED = Date.now();

    document.querySelector("#body").innerHTML = "";

    let lineup = 8;

    for(let i=0; i < lineup; i++){
        createImage(i, 0);
    }
    for(let i=0; i < lineup; i++){
        createImage(i, 1);
    }
    for(let i=0; i < lineup; i++){
        createImage(i, 2);
    }    
}
window.start = start;
start();