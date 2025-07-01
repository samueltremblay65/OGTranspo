class TransitLine {
    constructor(name, color, train_speed, stop_time) { 
    this.name = name;
    this.color = color;
    this.stops = [];
    this.frequency = 6;
    this.train_speed = train_speed;
    this.stop_time = stop_time;
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

  calculateTrainTime(distance) {
    return distance * 8 / this.train_speed;
  }

  addStop(station) {
    this.stops.push(station);
    station.addLine(this);
  }

  removeStop(station) {
    this.stops.splice(this.stops.indexOf(station), 1);
    station.lines.splice(station.lines.indexOf(this));
  }
}