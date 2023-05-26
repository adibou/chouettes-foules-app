
const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");
const image  = document.getElementById("source");
const mask  = document.getElementById("mask");

let cameraOffset = { x: 0, y: 0 }
let cameraZoom = 0.5
let MAX_ZOOM = 2
let MIN_ZOOM = 0.2
let SCROLL_SENSITIVITY = 0.0002
let imageLoaded = false;
let initialPinchDistance = null
let lastZoom = cameraZoom;
let isDragging = false
let dragStart = { x: 0, y: 0 }

window.addEventListener("DOMContentLoaded", (e) => {   
    draw();
 });


 image.addEventListener("load", (e) => { 
    canvas.offscreenCanvas = document.createElement("canvas");
    canvas.offscreenCanvas.width = image.width;
    canvas.offscreenCanvas.height = image.height;
    canvas.offscreenCanvas.getContext("2d").drawImage(image, 0, 0); 
    cameraOffset ={ x: -image.width*lastZoom/2 , y: -image.height*lastZoom/2}

    canvas.maskCanvas = document.createElement("canvas");
    canvas.maskCanvas.width = mask.width;
    canvas.maskCanvas.height = mask.height;
    canvas.maskCanvas.getContext("2d").drawImage(mask, 0, 0);

    canvas.o = document.createElement("canvas");
    canvas.o.width = mask.width;
    canvas.o.height = mask.height;
    imageLoaded = true; 
});

let currentColor = null;
let activeColor = {r: 0, g: 125, b: 0, a: 125};


canvas.addEventListener("click", function (evt) {
    var rect = canvas.getBoundingClientRect();
    const base    = { x: evt.clientX - rect.left, y: evt.clientY - rect.top};
    const screen  = {x : window.innerWidth / 2, y : window.innerHeight / 2};
    const x = (base.x /cameraZoom) + screen.x -cameraOffset.x - (screen.x/cameraZoom);
    const y = (base.y /cameraZoom) + screen.y -cameraOffset.y- (screen.y/cameraZoom);;
    const [r, g, b, a] = canvas.maskCanvas.getContext("2d").getImageData(x, y, 1, 1).data; 
    currentColor = a === 0 ? null : {r, g, b, a};
    drawOverlay();
}, false);



function draw() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    ctx.translate( window.innerWidth / 2, window.innerHeight / 2 )
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate( -window.innerWidth / 2 + cameraOffset.x, -window.innerHeight / 2 + cameraOffset.y )
    ctx.clearRect(0,0, window.innerWidth, window.innerHeight)
    if(imageLoaded) {
        ctx.drawImage(canvas.offscreenCanvas, 0, 0);
        if(currentColor !== null) { ctx.drawImage(canvas.o, 0, 0); }
    }
    requestAnimationFrame(draw);
}


function drawOverlay() {
    if(currentColor === null) { return; }
    var imageData = canvas.maskCanvas.getContext("2d").getImageData(0, 0, canvas.maskCanvas.width, canvas.maskCanvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        if(data[i] === currentColor.r && data[i+1] === currentColor.g && data[i+2] === currentColor.b && data[i+3] === currentColor.a ) {
            data[i] = activeColor.r;
            data[i+1] = activeColor.g;
            data[i+2] = activeColor.b;
            data[i+3] = activeColor.a;
        } else {
            data[i+3] = 0;
        }
    }
    canvas.o.getContext("2d").putImageData(imageData, 0, 0); 
}




function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    const base    = { x: evt.clientX - rect.left, y: evt.clientY - rect.top};
    console.log(ctx.getImageData(base.x, base.y, 1, 1).data);
    const screen  = {x : window.innerWidth / 2, y : window.innerHeight / 2};
    const x = (base.x /cameraZoom) + screen.x -cameraOffset.x - (screen.x/cameraZoom);
    const y = (base.y /cameraZoom) + screen.y -cameraOffset.y- (screen.y/cameraZoom);;
    return { x ,y };
}

function getEventLocation(e)
{
    if (e.touches && e.touches.length == 1)
    {
        return { x:e.touches[0].clientX, y: e.touches[0].clientY }
    }
    else if (e.clientX && e.clientY)
    {
        return { x: e.clientX, y: e.clientY }        
    }
}

function onPointerDown(e)
{
    isDragging = true
    dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
    dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
}

function onPointerUp(e)
{
    isDragging = false
    initialPinchDistance = null
    lastZoom = cameraZoom
}

function onPointerMove(e)
{
    if (isDragging)
    {
        cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
        cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
    }
}

function handleTouch(e, singleTouchHandler)
{
    if ( e.touches.length == 1 )
    {
        singleTouchHandler(e)
    }
    else if (e.type == "touchmove" && e.touches.length == 2)
    {
        isDragging = false
        handlePinch(e)
    }
}

function handlePinch(e)
{
    e.preventDefault()
    
    let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
    
    // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
    let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2
    
    if (initialPinchDistance == null)
    {
        initialPinchDistance = currentDistance
    }
    else
    {
        adjustZoom( null, currentDistance/initialPinchDistance )
    }
}

function adjustZoom(zoomAmount, zoomFactor)
{
    if (!isDragging)
    {
        if (zoomAmount)
        {
            cameraZoom += zoomAmount
        }
        else if (zoomFactor)
        {
            cameraZoom = zoomFactor*lastZoom
        }
        
        cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
        cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
    }
}


canvas.addEventListener('mousedown', onPointerDown)
canvas.addEventListener('mouseup', onPointerUp)
canvas.addEventListener('mousemove', onPointerMove)
canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp))
canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY))