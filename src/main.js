// import Random from 'random-seedable';
var Random = require('random-seedable');
var SimplexNoise = require('simplex-noise');

console.log("NoizeFighter");

//
// Const
//
const Parin = new SimplexNoise();
const USE_PARIN = false;


//
// Initialize
//
let RESOLUTION;
let DISPLAY_SIZE;
let IMAGE_DATA_SIZE;
let VERTICAL;
let SEED;


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
    return (0 <= col && col <= res && 0 <= row && row <= res) ? 1 : 0;
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
    const seed = Math.random();
    const parent = document.querySelector("#body");
    // if(vari == 0) parent.appendChild(document.createElement("br"));

    const canvas = document.createElement("canvas");
    canvas.width = DISPLAY_SIZE;
    canvas.height = DISPLAY_SIZE;
    // canvas.onclick = toggle;
    parent.appendChild(canvas);

    const _ctx = canvas.getContext("2d");
    _ctx.imageSmoothingEnabled = false;

    const myImage = [];
    const myAlpha = [];
    for(let i = 0; i < IMAGE_DATA_SIZE; i++){
        let col = Math.floor(i % RESOLUTION);
        let row = Math.floor(i / RESOLUTION);
        if(VERTICAL){ const t = col; col = row; row = t; }
        let color = generate(col, flip(row, RESOLUTION), seed);
        myImage.push(color);
        let alpha = hitTest(col, row, type);
        myAlpha.push(alpha);
    }
    // console.log(myImage);
    // console.log(myAlpha);

    const checked = new Array(IMAGE_DATA_SIZE);
    for(let col = 0; col < RESOLUTION; col++){
        for(let row = 0; row < RESOLUTION; row++){
            triming(checked, myImage, myAlpha, col, row);
        }
    }    

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

function triming(checked, myImage, myAlpha, col, row){
    // 0:消す 1:残す
    if(col < 0 || col > RESOLUTION) return 0;
    if(row < 0 || row > RESOLUTION) return 0;
    const idx = (row * RESOLUTION) + col;
    const alpha = myAlpha[idx];
    if(alpha == 0) return 0;
    const color = myImage[idx];
    if(color == 1) return 1;
    if(checked[idx] == true) return -1;
    checked[idx] = true;
    const u = triming(checked, myImage, myAlpha, col, row-1);
    if(u == 0) {myAlpha[idx] = 0; return 0; }
    const r = triming(checked, myImage, myAlpha, col+1, row);
    if(r == 0) {myAlpha[idx] = 0; return 0; }
    const l = triming(checked, myImage, myAlpha, col-1, row);
    if(l == 0) {myAlpha[idx] = 0; return 0; }
    const d = triming(checked, myImage, myAlpha, col, row+1);
    if(d == 0) {myAlpha[idx] = 0; return 0; }
    checked[idx] = false;
    return 1;
}

function getWindowHeight(){
    return Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    );
}

//
// Event
//
function start(){
    RESOLUTION = document.querySelector("#cell").value || 7;
    DISPLAY_SIZE = document.querySelector("#res").value;
    IMAGE_DATA_SIZE = RESOLUTION * RESOLUTION;
    VERTICAL = document.querySelector("#vertical").checked;
    console.log(VERTICAL);
    SEED = Date.now();

    // document.querySelector("#body").innerHTML = "";

    let lineup = 30;

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

window.addEventListener("scroll", ()=>{
    const scrollTop = Math.ceil(window.pageYOffset || document.documentElement.scrollTop);
    const pageMostBottom = getWindowHeight() - window.innerHeight;
    if (scrollTop >= pageMostBottom) {
        start();
    }
});

window.__reset = function(){
    window.scroll(0,0);
    const parent = document.querySelector("#body");
    parent.innerHTML = "";
    start();
}

// for canvas
function toggle(){
    // console.log(this.style.backgroundColor);
    if(this.style.backgroundColor == "lightsalmon"){
        this.style.backgroundColor="";
    }else{
        this.style.backgroundColor="lightsalmon";
    }
}

// for help
window.__toggleHelp = function(){
    const overlay = document.querySelector("#overlay");
    if(overlay.style.display == "none")
        overlay.style.display = "block";
    else
        overlay.style.display = "none";
}
