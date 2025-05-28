class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    distanceTo(point) {
        let distance = Math.sqrt(Math.abs(this.x - point.x) ** 2 + Math.abs(this.y - point.y) ** 2);
        return distance;
    }

    isWithin(radius, point) {
        return this.distanceTo(point) <= radius;
    }

    randomPointAround(radius) {
        const x = this.x - radius + Math.round(Math.random() * 2 * radius);
        const y = this.y - radius + Math.round(Math.random() * 2 * radius);

        return new Point(x, y);
    }
}