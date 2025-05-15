class Location {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    distanceTo(location) {
        let distance = Math.sqrt(Math.abs(this.x - location.x) ** 2 + Math.abs(this.y - location.y) ** 2);
        return distance;
    }
}