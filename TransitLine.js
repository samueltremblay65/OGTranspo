class TransitLine {
    constructor(name, color) { 
    this.name = name;
    this.color = color;
    this.stops = [];
    this.frequency = 6;
  }

  addStop(station) {
    this.stops.push(station);
  }
}