let canvas = document.getElementById("canvas");
let game_container = document.getElementById("map_container");
let ctx = canvas.getContext("2d");

const game_map = new Image();
game_map.src = "map.png";

const station_icon = new Image();
station_icon.src = "circle.png";

let scaling = 2.2
const FPS = 30;
const MAP_SPEED = 200 / FPS;

let center = {x: 800, y: 500};

const transit_lines = [];
const stations = [];
const commuters = [];

// Constants
const M_PER_PIXEL = 8;
const WALKING_PACE = 15
const TRAIN_SPEED = 1.2;
const STOP_TIME = 1;

const STARTING_BUDGET = 1000000;
const COST_STATION = 5000;
const COST_RAIL_M = 5;

let money = STARTING_BUDGET;

let mode = "view";
let location_viewing = false;
let transit_density_map = false;

// Drawing functions
function drawBackground() {
    ctx.drawImage(game_map, center.x, center.y, 1500 / scaling, 1000 / scaling, 0, 0, canvas.width, canvas.height);
}

function drawTransitLines() {
    transit_lines.forEach((line) => {
        drawTransitLine(line);
    });
}

function drawTransitLine(line) {
    if(line.stops.length > 1) {
        // Draw path to connect stations
        ctx.lineWidth = 10;
        ctx.strokeStyle = line.color;
        ctx.beginPath();

        const firstStopLocation = convertToCanvasCoordinates(line.stops[0].location);
        ctx.moveTo(firstStopLocation.x, firstStopLocation.y);

        for(let i = 1; i < line.stops.length; i++)
        {
            const location = convertToCanvasCoordinates(line.stops[i].location);
            ctx.lineTo(location.x, location.y);
        }
        ctx.stroke();
    }

    line.stops.forEach((stop) => {
        const canvas_location = convertToCanvasCoordinates(stop.location);
        ctx.beginPath();
        ctx.arc(canvas_location.x, canvas_location.y, 8, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function showCommuters() {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    commuters.forEach((commuter) => {
        const canvas_location = convertToCanvasCoordinates(commuter.location);
        ctx.beginPath();
        ctx.arc(canvas_location.x, canvas_location.y, 5, 0, 2 * Math.PI);
        ctx.stroke();
    });
}

// Helper functions
function convertToCanvasCoordinates(location) {
    x = (location.x - center.x) * scaling;
    y = (location.y - center.y) * scaling;
    return new Point(x, y);
}

function convertToGameCoordinates(location) {
    return new Point(center.x + location.x / scaling, center.y + location.y / scaling);
}

// Transit construction functions
function addStop(location) {
    // If location is not further than 100 meters from previous station, don't add stop
    if(selected_line.stops.length != 0 && 
        location.isWithin(100 / M_PER_PIXEL, selected_line.stops[selected_line.stops.length - 1].location)) return;

    for(var i = 0; i < stations.length; i++) {
        if(location.isWithin(100 / M_PER_PIXEL, stations[i].location)) {
            selected_line.addStop(stations[i]);
            return;
        }
    }

    const station = new Station("station", location);
    stations.push(station);

    selected_line.addStop(station);
}

// Costing functions
function calculateLineCost(line) {
    // Calculates only cost of railway
    let cost = 0;

    if(line.stops.length < 2) {
        return cost;
    }

    for(let i = 0; i < line.stops.length - 2; i++) {
        cost += COST_RAIL_M * M_PER_PIXEL * line.stops[i].location.distanceTo(line.stops[i+1].location);
    }

    return cost;
}

function calculateTotaCost() {
    let cost = 0;
    transit_lines.forEach((line) => cost += calculateLineCost(line));

    cost += stations.length * COST_STATION;
    
    money = STARTING_BUDGET - cost;
    console.log("Total cost = " + cost);
    console.log("Remaining budget: " + money);
}

// Transit simulation functions
function populateNeighborhood() {
    destinations.forEach((destination) => {
        for(let i = 0; i < destination.population; i++) {
            const location = destination.location.randomPointAround(destination.radius / M_PER_PIXEL);
            commuters.push(new Commuter(location, destinations[Math.floor(Math.random() * destinations.length)]));
        }
    });
}


// Controls
document.onkeydown = checkKey;
document.onkeyup = checkKeyUp;

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
        controls.up = true;
    }
    else if (e.keyCode == '40') {
        // down arrow
        controls.down = true;
    }
    else if (e.keyCode == '37') {
       // left arrow
       controls.left = true;
    }
    else if (e.keyCode == '39') {
       // right arrow
       controls.right = true;
    }
}

function checkKeyUp(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
        controls.up = false;
    }
    else if (e.keyCode == '40') {
        // down arrow
        controls.down = false;
    }
    else if (e.keyCode == '37') {
       // left arrow
       controls.left = false;
    }
    else if (e.keyCode == '39') {
       // right arrow
       controls.right = false;
    }
}

let controls = {
    up: false, down: false, left: false, right: false
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: Math.round((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
        y: Math.round((evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
    };
}

document.getElementById("btn_zoom_out").addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    if(scaling > 1) scaling -= 0.2;
});

document.getElementById("btn_zoom_in").addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    if(scaling < 3 ) scaling += 0.2;
});

document.getElementById("btn_view_coordinates").addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    location_viewing = !location_viewing;
})

document.getElementById("btn_transit_density").addEventListener("click", (e) => {
    e.stopImmediatePropagation();

    transit_density_map = !transit_density_map;
});


// Clear all construction
const reset_map_button = document.getElementById("btn_reset_map");
reset_map_button.addEventListener("click", () => {
    transit_lines.splice(0, transit_lines.length);
    stations.splice(0, stations.length);
});

// Add new transit line
let lines = 0;
let selected_line = null;
const COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'pink', 'brown', 'grey'];
const new_transit_line_button = document.getElementById("btn_new_transit_line");
new_transit_line_button.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    if(mode != "build") {
        mode = "build";
        console.log(mode);
        lines++;
        let new_line = new TransitLine("Line " + lines.toString(), COLORS[Math.floor(Math.random() * COLORS.length)]);
        transit_lines.push(new_line);
        selected_line = new_line;
    }
    else{
        // Complete the line build and calculate the cost of the build
        mode = "view";
        calculateTotaCost();
    }

});

// Building transit line
game_container.addEventListener("click", (e) => {
    let pos = getMousePos(canvas, e);
    let canvas_location = new Point(pos.x, pos.y);

    let game_location = convertToGameCoordinates(canvas_location);

    if(location_viewing) {
        console.log(game_location);
    }

    if(mode == "build") {
        addStop(game_location);
    }
});

// Simulation set up
populateNeighborhood();

// GameLoop
setInterval(function() {
    if(controls.up) center.y -= MAP_SPEED;
    if(controls.down) center.y += MAP_SPEED;
    if(controls.left) center.x -= MAP_SPEED;
    if(controls.right) center.x += MAP_SPEED;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawTransitLines();

    if(transit_density_map) {
        showCommuters();
    }

}, 1000 / FPS);
