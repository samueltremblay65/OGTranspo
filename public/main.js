let canvas = document.getElementById("canvas");
let game_container = document.getElementById("map_container");
let ctx = canvas.getContext("2d");

const game_map = new Image();
game_map.src = "map.png";

const game_map_canvas = document.createElement('canvas');

let scaling = 2.2;

let center = {x: 800, y: 500};

const transit_lines = [];
const stations = [];
const commuters = [];

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
        if(!isOnScreen(commuter.location)) return;

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

function isOnScreen(location) {
    const canvas_location = convertToCanvasCoordinates(location);
    if(canvas_location.x < 0 || canvas_location.y < 0 || 
        canvas_location.x > canvas.width || canvas_location.y > canvas.height) return false;
    return true;
}

// Transit construction functions
function addStop(location) {
    // If location is not further than 100 meters from previous station, don't add stop
    if(selected_line.stops.length != 0 && 
        location.isWithin(100 / M_PER_PIXEL, selected_line.stops[selected_line.stops.length - 1].location)) return;

    for(var i = 0; i < stations.length; i++) {
        if(location.isWithin(100 / M_PER_PIXEL, stations[i].location)) {
            selected_line.addStop(stations[i]);
            actionStack.push({type:"add_stop", line: selected_line, station: station});
            return;
        }
    }

    const station = new Station("station " + stations.length, location);
    stations.push(station);
    selected_line.addStop(station);
    
    actionStack.push({type:"add_station", line: selected_line, station: station});
}

function undoAction(action) {
    if(action.type == "add_station") {
        const index = stations.indexOf(action.station);
        stations.splice(index, 1);
        action.line.removeStop(action.station);
    }
    else if(action.type == "add_stop") {
        action.line.removeStop(action.station);
    }
    else if(action.type == "add_line") {
        const index = transit_lines.indexOf(action.line);
        transit_lines.splice(index, 1);
        color = action.color;
        mode = "view";
        selected_line = null;
    }
    else if(action.type == "finish_line") {
        mode = "build";
        selected_line = action.line;
        console.log("Resuming construction of line");
    }
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

        if(destination.type == "city") {
            let population = 0;

            while(population < destination.population) {
                const x = Math.round(Math.random() * game_map.width);
                const y = Math.round(Math.random() * game_map.height);

                const location = new Point(x, y);

                if(getGameMapColor(location) == "white") {
                    commuters.push(new Commuter(location, destinations[Math.floor(Math.random() * destinations.length)]));
                    population++;
                }
            }
            return;
        }

        for(let i = 0; i < destination.population; i++) {
            let population = 0;

            while(population < destination.population) {
                let location = destination.location.evenlyDistributedPointAround(destination.radius / M_PER_PIXEL);
                if(destination.options != null && destination.options.distribution == "radial") {
                    location = destination.location.randomPointAround(destination.radius / M_PER_PIXEL);
                }

                if(getGameMapColor(location) != "water") {
                    commuters.push(new Commuter(location, destinations[Math.floor(Math.random() * destinations.length)]));
                    population++;
                }
            }
            return;
        }
    });
}

// Controls
document.onkeydown = checkKey;
document.onkeyup = checkKeyUp;

const actionStack = [];

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

    if (e.ctrlKey && e.keyCode == 90) {
        console.log('Ctrl+z: undoing last action');
        const action = actionStack.pop();
        if(action != null) undoAction(action);
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

document.getElementById("btn_simulate").addEventListener("click", (e) => {
    e.stopImmediatePropagation();

    simulate();
});

// Clear all construction
const reset_map_button = document.getElementById("btn_reset_map");
reset_map_button.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    transit_lines.splice(0, transit_lines.length);
    stations.splice(0, stations.length);
});

// Add new transit line
let selected_line = null;
let color = 0;
const COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'pink', 'brown', 'grey'];
const new_transit_line_button = document.getElementById("btn_new_transit_line");
new_transit_line_button.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    if(mode != "build") {
        mode = "build";
        console.log(mode);
        let new_line = new TransitLine("Line " + (transit_lines.length + 1), COLORS[color], TRAIN_SPEED, STOP_TIME);
        transit_lines.push(new_line);
        selected_line = new_line;
        actionStack.push({type: "add_line", target: new_line, color: color});
        color = color + 1 % COLORS.length;
    }
    else{
        // Complete the line build and calculate the cost of the build

        actionStack.push({type:"finish_line", line: selected_line});
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
        console.log(getGameMapColor(game_location));
    }

    if(mode == "build") {
        addStop(game_location);
    }
});

game_map.onload = function() {
    game_map_canvas.width = game_map.width;
    game_map_canvas.height = game_map.height;
    game_map_canvas.getContext('2d').drawImage(game_map, 0, 0, game_map.width, game_map.height);

    // Simulation set up
    populateNeighborhood();

    // GameLoop
    setInterval(function() {
        // Controls loop for map movement
        if(controls.up) center.y -= MAP_SPEED;
        if(controls.down) center.y += MAP_SPEED;
        if(controls.left) center.x -= MAP_SPEED;
        if(controls.right) center.x += MAP_SPEED;

        if(center.x < 0) center.x = 0;
        if(center.y < 0) center.y = 0;
        
        if(center.x + canvas.width / scaling > game_map.width) center.x = game_map.width - canvas.width / scaling;
        if(center.y + canvas.height / scaling > game_map.height) center.y = game_map.height - canvas.height / scaling;
        
        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawTransitLines();

        // Show commuters
        if(transit_density_map) {
            showCommuters();
        }

    }, 1000 / FPS);
}

// Simulation code
function simulate() {
    let transit_trips = [];
    for(let i = 0; i < 100; i++)  {
        let commuter = commuters[Math.floor(Math.random() * commuters.length)];
        const trip = calculateTransitTrip(commuter.location, commuter.destination.location);
        transit_trips.push(trip);
    }

    let statistics = calculateTransitStatistics(transit_trips);
    console.log(statistics);
    return statistics.averageTime;
}

function calculateTransitStatistics(trips) {
    const times = [];
    const walk_times = [];

    const metro_line_usage = {};

    transit_lines.forEach(line => {
        metro_line_usage[line.name] = 0;
    });

    trips.forEach(trip => {
        const time = trip.calculateTotalDuration();
        times.push(time);

        let walk_time = 0;

        trip.steps.forEach(step => {
            
            if(step.mode == "walk") {
                walk_time += step.walk_time;
            }
            else if(step.mode == "metro") {
                metro_line_usage[step.line.name]++;
            }
        });
        walk_times.push(walk_time);
    });
    
    const averageTime = calculateAverage(times);
    const averageWalkTime = calculateAverage(walk_times);

    return {averageTime: averageTime, averageWalkTime: averageWalkTime, lineUsage: metro_line_usage};
}

function test_simulate() {
    const location1 = new Point(1668, 460);
    const location2 = new Point(1228, 824);

    const trip = calculateTransitTrip(location1, location2);
    console.log(trip);
    console.log(trip.calculateTotalDuration());
}

function calculateTransitTrip(location1, location2) {
    const shortest_trips = [];

    // Add walking trip
    const distance = location1.distanceTo(location2);
    const walk_time = calculateWalkingTime(distance);
    const walk_trip = new TransitTrip([new TransitStep(location1, location2, "walk", null, walk_time)]);

    if(stations.length == 0) {
        return walk_trip;
    }

    // Calculate transit trips
    const NEARBY_STATIONS = 3;
    const start_stations = findClosestStations(location1, NEARBY_STATIONS);
    const end_stations = findClosestStations(location2, NEARBY_STATIONS);

    start_stations.forEach(start => {
        end_stations.forEach(end => {
            if(start == end) return;
            const transit_trip = start.shortestTransitTrip(end);

            if(transit_trip == null) return;
            transit_trip.addWalkingSteps(location1, location2, calculateWalkingTime);
            shortest_trips.push(transit_trip);
        });
    });

    let shortest_trip = walk_trip;
    shortest_trips.forEach(trip => {
        if(trip.calculateTotalDuration() < shortest_trip.calculateTotalDuration()) shortest_trip = trip;
    });

    return shortest_trip;
}

function findClosestStations(location, n) {
    const sortByDistance = (a, b) => a.location.distanceTo(location) - b.location.distanceTo(location);

    const sorted = [...stations].sort(sortByDistance);

    return sorted.slice(0, n);
}

function calculateAverage(arr) {
    let total = 0;
    for(let i = 0; i < arr.length; i++)
    {
        total += arr[i];
    }
    return total / arr.length;
}

function calculateWalkingTime(distance) {
    return distance * M_PER_PIXEL / WALKING_SPEED;
}

function getGameMapColor(location) {
    const pixel_data = game_map_canvas.getContext('2d').getImageData(location.x, location.y, 1, 1).data;

    if(pixel_data[0] == 245 && pixel_data[1] == 243 && pixel_data[2] == 243) return "white";

    if(pixel_data[0] == 144 && pixel_data[1] == 218 && pixel_data[2] == 238) return "water";

    else return pixel_data;
}

