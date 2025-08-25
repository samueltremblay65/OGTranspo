class TransitLine {
    constructor(name, color, type, id) { 
    this.name = name;
    this.color = color;
    this.type = type;
    this.stops = [];

    this.updateTransitTypeParameters();

    if(id != null) this.id = id;
    else this.id = crypto.randomUUID();
  }

  updateTransitTypeParameters() {
    this.train_speed = TRANSIT_PARAMETERS[this.type].TRAIN_SPEED;
    this.stop_time = TRANSIT_PARAMETERS[this.type].STOP_TIME;
    this.rail_cost = TRANSIT_PARAMETERS[this.type].RAIL_M_COST;
    this.station_cost = TRANSIT_PARAMETERS[this.type].STATION_COST;
  }

  calculateCost() {
    let cost = 0;
    cost += this.calculateStationCost();

    if(this.stops.length < 2) {
        return cost;
    }

    cost += this.calculateRailCost();

    return cost;
  }

  calculateStationCost() {
    let cost = 0;
    cost += this.station_cost * this.stops.length;
    return cost;
  }

  calculateRailCost() {
    let cost = 0;
    for(let i = 0; i < this.stops.length - 1; i++) {
        cost += this.rail_cost * M_PER_PIXEL * this.stops[i].location.distanceTo(this.stops[i+1].location);
    }
    return cost;
  } 

  calculateRailMeters() {
    let meters = 0;
    for(let i = 0; i < this.stops.length - 1; i++) {
        meters += M_PER_PIXEL * this.stops[i].location.distanceTo(this.stops[i+1].location);
    }
    return meters;
  }

  // Assumes that both stops are on this line
  calculateJourneyTime(stop1, stop2) {
    let index1 = this.stops.indexOf(stop1);
    let index2 = this.stops.indexOf(stop2);

    if(index1 == index2) return 0;

    let time = 0;

    if(index1 > index2){
      const tmp = index1;
      index1 = index2;
      index2 = tmp;
    }

    for(let i = index1; i < index2; i++)
    {
      time += this.stop_time;
      const distance = this.stops[i].location.distanceTo(this.stops[i+1].location);
      time += this.calculateTrainTime(distance);
    }

    return time;
  }

  getConnectionPoints() {
    const connection_points = [];

    this.stops.forEach(stop => { 
      if(stop.hasMultipleLines()) connection_points.push(stop);
    });

    return connection_points;
  }

  getVisitedConnectionPoints(start, end) {
    let index1 = this.stops.indexOf(start);
    let index2 = this.stops.indexOf(end);

    if(index1 > index2) {
      const tmp = index1;
      index1 = index2;
      index2 = tmp;
    }

    const visited = [];

    for(let i = index1; i <= index2; i++)
    {
      if(this.stops[i].hasMultipleLines()){
        visited.push(this.stops[i]);
      }
    }
    return visited;
  }

  getStopsBetween(station1, station2) {
    if(station1 == station2) return [station1];

    let direction = 1;
    let index1 = this.stops.indexOf(station1);
    let index2 = this.stops.indexOf(station2);

    if(index2 < index1) direction = -1;

    const stops = [];

    let i = index1 + 1;
    do {
      stops.push(stops[i]);
      i += direction;
    }while(index1 != index2)

    return stops;
  }

  calculateTrainTime(distance) {
    return distance * M_PER_PIXEL / this.train_speed;
  }

  addStop(station) {
    this.stops.push(station);
    station.addLine(this);
  }

  restoreStop(station, index) {
    this.stops.splice(index, 0, station);
  }

  removeStop(station) {
    const index = this.stops.indexOf(station);
    this.stops.splice(index, 1);
    return index;
  }
}