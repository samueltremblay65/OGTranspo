let canvas = document.getElementById("canvas");
let game_container = document.getElementById("map_container");
let ctx = canvas.getContext("2d");

const game_map = new Image();
game_map.src = "map.png";

const game_map_canvas = document.createElement('canvas');

let scaling = 1.0;

let center = {x: 850, y: 200};

const transit_lines = [];
const stations = [];
const commuters = [];

let money = STARTING_BUDGET;

let mode = "view";
let location_viewing = false;
let transit_density_map = false;

let selectedStation = null;
let selectedLine = null;
let displayedTrip = null;

let color = 0;
const LINE_COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'pink', 'brown', 'grey', "lime"];

// Drawing functions
function drawBackground() {
    ctx.drawImage(game_map, center.x, center.y, canvas.width / scaling, canvas.height / scaling, 0, 0, canvas.width, canvas.height);
}

function drawTransitLines() {
    transit_lines.forEach((line) => {
        drawTransitLine(line);
    });
}

function drawTransitLine(line) {
    if(line.stops.length > 1) {
        // Draw path to connect stations
        ctx.lineWidth = 6;
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
        ctx.arc(canvas_location.x, canvas_location.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawDisplayedTrip() {
    if(displayedTrip == null) return;
    displayedTrip.steps.forEach(step => {
        ctx.strokeStyle = "#7efcb9";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.setLineDash([10]);

        ctx.beginPath();

        let start;
        let end;

        if(step.mode == "metro") {
            const stops = step.line.getStopsBetween(step.start, step.end);

            ctx.moveTo(start.location.x, start.location.y);

            stops.forEach(stop => {
                const location = convertToCanvasCoordinates(stop.location);
                ctx.lineTo(location.x, location.y);
            });
        }
        else {
            if(step.start instanceof Station) {
                start = convertToCanvasCoordinates(step.start.location);
            }
            else if (step.start instanceof Point) {
                start = convertToCanvasCoordinates(step.start);
            }

            if(step.end instanceof Station) {
                end = convertToCanvasCoordinates(step.end.location);
            }
            else if (step.end instanceof Point) {
                end = convertToCanvasCoordinates(step.end);
            }

            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    });

    ctx.setLineDash([]);
}

function displayTransitTrip(trip) {
    displayedTrip = trip;
}

function showCommuters() {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    commuters.forEach((commuter) => {
        if(!isOnScreen(commuter.location)) return;

        const canvas_location = convertToCanvasCoordinates(commuter.location);
        ctx.beginPath();
        ctx.strokeStyle = "#8e8e8eff";
        ctx.arc(canvas_location.x, canvas_location.y, 3, 0, 2 * Math.PI);
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
    // If location is not further than 100 meters from previous stations on the line
    let too_close = false;
    selectedLine.stops.forEach(station => {
        if(location.isWithin(100/M_PER_PIXEL, station.location)) too_close = true;
    })

    if(too_close) return;

    for(var i = 0; i < stations.length; i++) {
        if(location.isWithin(100 / M_PER_PIXEL, stations[i].location)) {
            selectedLine.addStop(stations[i]);
            actionStack.push({type:"add_stop", line: selectedLine, station: stations[i]});
            return;
        }
    }

    const station = new Station("Station " + (stations.length + 1), location);
    stations.push(station);
    selectedLine.addStop(station);
    
    actionStack.push({type:"add_station", line: selectedLine, station: station});
}

function removeStation(station) {
    stations.splice(stations.indexOf(station), 1);

    const line_indexes = [];
    station.lines.forEach(line => {
        const index = line.removeStop(station);
        line_indexes.push({line: line, index: index});
    });

    actionStack.push({type:"remove_station", station: selectedStation, line_indexes: line_indexes});
    updateBudgetDisplay();
}

function undoAction(action) {
    if(action.type == "add_station") {
        const index = stations.indexOf(action.station);
        stations.splice(index, 1);
        action.line.removeStop(action.station);
        action.station.lines.splice(action.station.lines.indexOf(action.line), 1);
    }
    else if(action.type == "add_stop") {
        action.line.removeStop(action.station);
        action.station.lines.splice(action.station.lines.indexOf(action.line), 1);
    }
    else if(action.type == "add_line") {
        const index = transit_lines.indexOf(action.line);
        transit_lines.splice(index, 1);
        color = action.color;
        mode = "view";
        selectedLine = null;
        setBuildButtonText("view");
    }
    else if(action.type == "finish_line") {
        mode = "build";
        selectedLine = action.line;
        setBuildButtonText("build");
    }
    else if(action.type == "remove_station") {
        mode = "view";
        stations.push(action.station);
        action.line_indexes.forEach(element => {
            const line = element.line;
            const index = element.index;

            action.station.lines.push(line);
            line.restoreStop(action.station, index);
        });
    }
}

// Costing functions
function calculateLineCost(line) {
    // Calculates only cost of railway
    let cost = 0;

    cost += COST_STATION * line.stops.length;

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
    return cost;
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

function showMenuBarButtons(menu_mode) {
    switch(menu_mode){
        case "view":
            document.getElementById("btn_new_transit_line").style.display = "inline";
            document.getElementById("btn_transit_density").style.display = "inline";
            document.getElementById("btn_save").style.display = "inline";
            document.getElementById("btn_simulate").style.display = "inline";
            document.getElementById("btn_manage_system").style.display = "inline";
            document.getElementById("btn_settings").style.display = "none";
            document.getElementById("btn_save").style.display = "inline";
            document.getElementById("btn_load").style.display = "inline";
            document.getElementById("btn_zoom_out").style.display = "inline";
            document.getElementById("btn_zoom_in").style.display = "inline";
            break;
        case "build":
            document.getElementById("btn_new_transit_line").style.display = "inline";
            document.getElementById("btn_transit_density").style.display = "inline";
            document.getElementById("btn_save").style.display = "none";
            document.getElementById("btn_simulate").style.display = "none";
            document.getElementById("btn_manage_system").style.display = "none";
            document.getElementById("btn_settings").style.display = "none";
            document.getElementById("btn_save").style.display = "none";
            document.getElementById("btn_load").style.display = "inline";
            document.getElementById("btn_zoom_out").style.display = "inline";
            document.getElementById("btn_zoom_in").style.display = "inline";
            break;
        case "modal":
            document.getElementById("btn_new_transit_line").style.display = "none";
            document.getElementById("btn_transit_density").style.display = "none";
            document.getElementById("btn_save").style.display = "none";
            document.getElementById("btn_manage_system").style.display = "none";
            document.getElementById("btn_simulate").style.display = "none";
            document.getElementById("btn_settings").style.display = "none";
            document.getElementById("btn_save").style.display = "none";
            document.getElementById("btn_load").style.display = "none";
            document.getElementById("btn_zoom_out").style.display = "none";
            document.getElementById("btn_zoom_in").style.display = "none";
            break;
    }
}

document.getElementById("btn_zoom_out").addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    if(scaling > 0.6) scaling -= 0.2;
});

document.getElementById("btn_zoom_in").addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    if(scaling < 3 ) scaling += 0.2;
});

document.getElementById("btn_manage_system").addEventListener("click", (e) => {
    e.stopImmediatePropagation();

    if(mode == "view") showManageModal();
});

document.getElementById("btn_close_manage_modal").addEventListener("click", hideManageModal);

document.getElementById("btn_transit_density").addEventListener("click", (e) => {
    e.stopImmediatePropagation();

    transit_density_map = !transit_density_map;
});

document.getElementById("btn_simulate").addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    if(mode != "view") return;
    hideInformationMenus();

    if(calculateTotaCost() > STARTING_BUDGET) return;

    simulate();
});

document.getElementById("btn_build_line_continue").addEventListener("click", function(e) {
    e.stopImmediatePropagation();
    let line_name = document.getElementById("input_line_name").value;

    if(line_name == null || line_name.length == 0) line_name = "Line " + (transit_lines.length + 1);
    let new_line = new TransitLine(line_name, LINE_COLORS[color % LINE_COLORS.length], TRAIN_SPEED, STOP_TIME);
    transit_lines.push(new_line);
    selectedLine = new_line;
    actionStack.push({type: "add_line", target: new_line, color: color});
    color = color + 1 % LINE_COLORS.length;
    hideBuildLineDialog();
    mode = "build";
    showMenuBarButtons("build");
    setBuildButtonText("build");
});

document.getElementById("btn_build_line_cancel").addEventListener("click", function(e) {
    e.stopImmediatePropagation();
    hideBuildLineDialog();
    mode = "view";
    showMenuBarButtons("view");
});

document.getElementById("station_quick_menu").addEventListener("click", function(e) {
    e.stopImmediatePropagation();
});

document.getElementById("btn_save").addEventListener("click", function(e) {
    e.stopImmediatePropagation();

    const station_data = [];
    const line_data = [];

    stations.forEach(station => {
        const line_ids = [];

        station.lines.forEach(line => {
            line_ids.push(line.id);
         });

        const data = { id: station.id, name: station.name, location: station.location, line_ids: line_ids};
        station_data.push(data);
    });

    transit_lines.forEach(line => {
        const stop_ids = [];

        line.stops.forEach(station => {
            stop_ids.push(station.id);
        });

        const data = {id: line.id, name: line.name, color: line.color, 
            stops: stop_ids, train_speed: line.train_speed, stop_time: line.stop_time};
        line_data.push(data);
    });

    const save_data = {stations: station_data, lines: line_data};
    const save_string = JSON.stringify(save_data);

    saveText(save_string, "OG_Transpo.json");
});

document.getElementById("btn_load").addEventListener("click", function(e) {
    e.stopImmediatePropagation();

    document.getElementById("load_file_input").click();
});

document.getElementById("btn_manage_reset").addEventListener("click", function(e) {
    e.stopImmediatePropagation();

    reset();

    document.getElementById("tb_manage_total_budget").innerHTML = format_cost(STARTING_BUDGET);
    document.getElementById("tb_manage_available_budget").innerHTML = format_cost(STARTING_BUDGET - calculateTotaCost());

    const template = document.querySelector(".manage_line_bar_item");
    const list = document.getElementById("manage_line_list");

    template.style.display = "inline-block";

    while (list.childElementCount > 1) {
        list.removeChild(list.lastElementChild);
    }

    const msg = document.createElement("p");
    msg.innerHTML = "This transit system does not have any transit lines yet.";
    list.appendChild(msg);
    template.style.display = "none";
});


document.getElementById("load_file_input").addEventListener('change', () => {
    const selectedFile = document.getElementById("load_file_input").files[0];
    document.getElementById("load_file_input").value = null;
    let fr = new FileReader();
    fr.onload = function () {
        const data_string = fr.result;
        const json_data = JSON.parse(data_string);

        reset();
        loadFromJson(json_data);
    }

	fr.readAsText(selectedFile);
});

function saveText(text, filename){
  var a = document.createElement('a');
  a.setAttribute('href', 'data:text/plain;charset=utf-8,'+encodeURIComponent(text));
  a.setAttribute('download', filename);
  a.click()
}

function reset() {
    transit_lines.splice(0, transit_lines.length);
    stations.splice(0, stations.length);
    mode = "view";
    showMenuBarButtons("view");
    setBuildButtonText("view");
    hideInformationMenus();
    hideConfirmLineDialog();
    updateBudgetDisplay(STARTING_BUDGET);
}

function loadFromJson(json) {
    const station_data = json.stations;
    const line_data = json.lines;

    station_data.forEach(data => {
        const station = new Station(data.name, new Point(data.location.x, data.location.y), data.id);
        stations.push(station);
    });

    line_data.forEach(data => {
        const line = new TransitLine(data.name, data.color, data.train_speed, data.stop_time, data.id);
        data.stops.forEach(station_id => {
            const station = stations.find(station => station.id == station_id);
            line.addStop(station);
        });
        transit_lines.push(line);
    })
}

const new_transit_line_button = document.getElementById("btn_new_transit_line");
new_transit_line_button.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    if(mode != "build") {
        hideInformationMenus();
        showBuildLineDialog();
    }
    else{
        // Complete the line build and calculate the cost of the build
        showConfirmLineDialog();
    }
});

function setBuildButtonText(state) {
    if(state == "build") new_transit_line_button.innerHTML = "Finish Transit Line";
    else new_transit_line_button.innerHTML = "New Transit Line";
}

// Building transit line
game_container.addEventListener("click", (e) => {
    let pos = getMousePos(canvas, e);
    let canvas_location = new Point(pos.x, pos.y);

    let game_location = convertToGameCoordinates(canvas_location);

    if(location_viewing) {
        console.log(game_location);
        console.log(getGameMapColor(game_location));
    }

    if(selectedStation != null) hideStationQuickMenu();

    if(mode == "view") {
        stations.forEach(station => {
            if(game_location.distanceTo(station.location) < 50 / M_PER_PIXEL) {
                showStationQuickMenu(canvas_location, station);            }
        });
    }

    if(mode == "build") {
        addStop(game_location);
    }
});

document.getElementById("btn_close_simulation_modal").addEventListener("click", hideSimulationDialog);

document.getElementById("btn_close_manage_modal").addEventListener("click", hideSimulationDialog);

document.getElementById("btn_confirm_line_continue").addEventListener("click", function() {
    actionStack.push({type:"finish_line", line: selectedLine});
    mode = "view";
    showMenuBarButtons("view");
    setBuildButtonText("view");

    const total_cost = calculateTotaCost();

    const budget_remaining = STARTING_BUDGET - total_cost;

    updateBudgetDisplay(budget_remaining);
    hideConfirmLineDialog();

    if(budget_remaining < 0) showBudgetAlert();
});

document.getElementById("btn_confirm_line_cancel").addEventListener("click", function() {
    let action;
    do {
        action = actionStack.pop();
        undoAction(action);
    }while(action.type != "add_line");

    mode = "view";
    showMenuBarButtons("view");
    setBuildButtonText("view");
    hideConfirmLineDialog();
});

document.getElementById("station_quick_rename").addEventListener("click", function() {
    actionStack.push({type:"rename_station", station: selectedStation});

    if(document.getElementById("station_quick_rename_input").style.visibility == "visible") {
        station_quick_rename();
    }
    else station_quick_showRename();
});

document.getElementById("station_quick_remove").addEventListener("click", function() {
    removeStation(selectedStation);
    hideStationQuickMenu();
});

document.getElementById("btn_budget_alert_dismiss").addEventListener("click", function() {
    mode = "view";
    showMenuBarButtons("view");
    document.getElementById("budget_alert_modal").style.visibility = "hidden";
})

function station_quick_showRename() {
    const rename_input = document.getElementById("station_quick_rename_input");
    rename_input.style.display = "block";
    rename_input.style.visibility = "visible";
    rename_input.setAttribute("placeholder", selectedStation.name);

    rename_input.focus();

    document.getElementById("station_quick_tb_name").style.display = "none";
}

function station_quick_rename() {
    const rename_input = document.getElementById("station_quick_rename_input");

    const new_name = rename_input.value.trim();
    selectedStation.name = new_name;

    rename_input.style.display = "none";
    rename_input.style.visibility = "hidden";
    rename_input.value = "";

    const station_name_tb = document.getElementById("station_quick_tb_name");
    station_name_tb.innerHTML = selectedStation.name;
    station_name_tb.style.display = "block";
    station_name_tb.style.visibility = "visible";
}

function showSimulationDialog(statistics) {
    mode = "statistics_menu";
    showMenuBarButtons("modal");

    document.getElementById("simulation_modal").style.visibility = "visible";
    let minutes = Math.round(statistics.averageTime / 60);
    document.getElementById("tb_transit_time").innerHTML = minutes + " minutes";

    minutes = Math.round(statistics.averageWalkTime / 60);
    document.getElementById("tb_transit_walking_time").innerHTML = minutes + " minutes";

    document.getElementById("tb_connections").innerHTML = statistics.connections + " transfers";

    document.getElementById("tb_longest").innerHTML = Math.round(statistics.longest_trip.calculateTotalDuration() / 60) + " minutes";

    document.getElementById("tb_transit_percentage").innerHTML = statistics.transit_trip_percentage + "%";
}

function hideSimulationDialog() {
    mode = "view";
    showMenuBarButtons("view");
    document.getElementById("simulation_modal").style.visibility = "hidden";
}

function showManageModal() {
    mode = "manage";
    showMenuBarButtons("modal");
    document.getElementById("manage_modal").style.visibility = "visible";

    document.getElementById("tb_manage_total_budget").innerHTML = format_cost(STARTING_BUDGET);
    document.getElementById("tb_manage_available_budget").innerHTML = format_cost(STARTING_BUDGET - calculateTotaCost());

    const template = document.querySelector(".manage_line_bar_item");
    const list = document.getElementById("manage_line_list");

    template.style.display = "inline-block";

    while (list.childElementCount > 1) {
        list.removeChild(list.lastElementChild);
    }

    if(transit_lines.length == 0) {
        const msg = document.createElement("p");
        msg.innerHTML = "This transit system does not have any transit lines yet.";
        list.appendChild(msg);
        template.style.display = "none";
        return;
    }

    transit_lines.forEach(line => {
        const line_bar = template.cloneNode(true);
        const tb_line_name = line_bar.querySelector(".manage_line_name");
        tb_line_name.innerHTML = line.name;
        list.appendChild(line_bar);
    });

    template.style.display = "none";

}

function hideManageModal() {
    mode = "view";
    showMenuBarButtons("view");
    document.getElementById("manage_modal").style.visibility = "hidden";
}

function showBuildLineDialog() {
    mode = "build_menu";
    showMenuBarButtons("modal");
    document.getElementById("build_line_modal").style.visibility = "visible";
}

function hideBuildLineDialog() {
    document.getElementById("build_line_modal").style.visibility = "hidden";
}

function showConfirmLineDialog() {
    document.getElementById("confirm_line_modal").style.visibility = "visible";

    const line_cost = calculateLineCost(selectedLine);
    document.getElementById("tb_line_cost").innerHTML = format_cost(line_cost);

    actionStack.push({type:"finish_line", line: selectedLine});
    mode = "confirm_line_menu";
    showMenuBarButtons("modal");
    setBuildButtonText("view");
}

function hideConfirmLineDialog() {
    document.getElementById("confirm_line_modal").style.visibility = "hidden";
}

function updateBudgetDisplay(remaining) {
    document.getElementById("budget").innerHTML = format_cost(remaining);

    const budget_ui = document.getElementById("budget_bar");

    budget_ui.style.background = "#ebffde";
    budget_ui.style.borderColor = "#a4c78d";

    if(remaining < 0) {
        budget_ui.style.background = "#f5a9a9";
        budget_ui.style.borderColor = "#bd0000"
    }else if(remaining < STARTING_BUDGET / 3) {
        budget_ui.style.background = "#ffec96";
        budget_ui.style.borderColor = "#dbba25";
    }
}

function showBudgetAlert() {
    mode = "budget_alert";
    showMenuBarButtons("modal");
    document.getElementById("budget_alert_modal").style.visibility = "visible";
}

function showStationQuickMenu(location, station) {
    mode = "station_quick_menu";
    showMenuBarButtons("view");
    selectedStation = station;
    const quickStationMenu = document.getElementById("station_quick_menu");

    document.getElementById("station_quick_tb_name").innerHTML = station.name;
    
    quickStationMenu.style.visibility = "visible";

    if(location.y < canvas.height / 3) {
        quickStationMenu.style.top = (location.y + 20) + "px";
    }
    else {
        quickStationMenu.style.top = (location.y - 140) + "px";
    }

    let x = Math.max(20, location.x - 100);
    x = Math.min(canvas.width - 20 - quickStationMenu.clientWidth, x);

    quickStationMenu.style.left = x + "px";

    const station_name_tb = document.getElementById("station_quick_tb_name");
    station_name_tb.style.display = "block";
    station_name_tb.style.visibility = "visible";
}

function hideStationQuickMenu() {
    mode = "view";
    showMenuBarButtons("view");
    const quickStationMenu = document.getElementById("station_quick_menu");
    
    quickStationMenu.style.visibility = "hidden";

    const name_input = document.getElementById("station_quick_rename_input");
    name_input.style.display = "none";
    name_input.style.visibility = "hidden";

    const name_tb = document.getElementById("station_quick_tb_name");
    name_tb.style.display = "none";
    name_tb.style.visibility = "hidden";

    selectedStation = null;
}

function hideInformationMenus() {
    hideSimulationDialog();
    hideStationQuickMenu();
}

game_map.onload = function() {
    game_map_canvas.width = game_map.width;
    game_map_canvas.height = game_map.height;
    game_map_canvas.getContext('2d').drawImage(game_map, 0, 0, game_map.width, game_map.height);

    // Simulation set up
    populateNeighborhood();

    // UI Setup
    updateBudgetDisplay(STARTING_BUDGET);

    // GameLoop
    setInterval(function() {
        // Handle map movement controls
        mapControls();
        // Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        if(transit_density_map) showCommuters();
        drawTransitLines();
        drawDisplayedTrip();

    }, 1000 / FPS);
}

function mapControls() {
    // Controls loop for map movement
    if(isMenuOpen()) return;

    if(controls.up) center.y -= MAP_SPEED;
    if(controls.down) center.y += MAP_SPEED;
    if(controls.left) center.x -= MAP_SPEED;
    if(controls.right) center.x += MAP_SPEED;

    if(center.x < 0) center.x = 0;
    if(center.y < 0) center.y = 0;
    
    if(center.x + canvas.width / scaling > game_map.width) center.x = game_map.width - canvas.width / scaling;
    if(center.y + canvas.height / scaling > game_map.height) center.y = game_map.height - canvas.height / scaling;
}

function isMenuOpen() {
    if(mode == "build" || mode == "view") return false;
    return true;
}

// Simulation code
function simulate() {
    let transit_trips = [];
    for(let i = 0; i < 250; i++)  {
        let commuter = commuters[Math.floor(Math.random() * commuters.length)];
        const trip = findOptimalTransitTrip(commuter.location, commuter.destination.location);
        transit_trips.push(trip);
    }

    let statistics = calculateTransitStatistics(transit_trips);
    showSimulationDialog(statistics);
    // displayTransitTrip(statistics.longest_trip);
    return statistics.averageTime;
}

function calculateTransitStatistics(trips) {
    const times = [];
    const walk_times = [];
    const connections = [];

    const metro_line_usage = {};

    let walking_trips = 0;
    let transit_trips = 0;

    let longest_trip;

    transit_lines.forEach(line => {
        metro_line_usage[line.name] = 0;
    });

    trips.forEach(trip => {
        const time = trip.calculateTotalDuration();

        if(longest_trip == null || time > longest_trip.calculateTotalDuration()) longest_trip = trip;

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

        let trip_connections = 0;
        trip.steps.forEach(step => {
            if(step.mode == "metro") trip_connections++;
        });

        if(trip_connections != 0) trip_connections--;
        connections.push(trip_connections);

        // Determine percentage of walking vs transit trips
        let isWalking = true;
        trip.steps.forEach(step => {
            if(step.mode != "walk") isWalking = false;
        });

        if(isWalking) walking_trips++; else transit_trips++;
    });
    
    const averageTime = calculateAverage(times);
    const averageWalkTime = calculateAverage(walk_times);
    const averageConnections = calculateAverage(connections);

    const transit_trip_percentage = 100 * transit_trips / trips.length;

    return {averageTime: averageTime, averageWalkTime: averageWalkTime, connections: averageConnections, 
        lineUsage: metro_line_usage, longest_trip: longest_trip, transit_trip_percentage: transit_trip_percentage};
}

function findOptimalTransitTrip(location1, location2) {
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

function calculateWalkingTime(distance) {
    return distance * M_PER_PIXEL / WALKING_SPEED;
}

function findClosestStations(location, n) {
    const sortByDistance = (a, b) => a.location.distanceTo(location) - b.location.distanceTo(location);

    const sorted = [...stations].sort(sortByDistance);

    return sorted.slice(0, Math.min(n, sorted.length));
}

function calculateAverage(arr) {
    let total = 0;
    for(let i = 0; i < arr.length; i++)
    {
        total += arr[i];
    }
    return total / arr.length;
}

function getGameMapColor(location) {
    const pixel_data = game_map_canvas.getContext('2d').getImageData(location.x, location.y, 1, 1).data;

    if(pixel_data[0] == 245 && pixel_data[1] == 243 && pixel_data[2] == 243) return "white";

    if(pixel_data[0] == 144 && pixel_data[1] == 218 && pixel_data[2] == 238) return "water";

    else return pixel_data;
}

function format_cost(cost) {
    return (new Intl.NumberFormat("en-CA", {style: "currency", currency: "CAD"}).format(Math.round(cost) * 1000));
}

// Testing functions
function test_simulate() {
    const location1 = new Point(1668, 460);
    const location2 = new Point(1228, 824);

    const trip = findOptimalTransitTrip(location1, location2);
    console.log(trip);
    console.log(trip.calculateTotalDuration());
}