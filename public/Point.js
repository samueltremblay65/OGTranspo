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
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radius;

        return new Point(Math.round(this.x + Math.cos(angle) * distance), Math.round(this.y + Math.sin(angle) * distance));
    }

    evenlyDistributedPointAround(radius) {
        let point = null;

        do {
            const x = 2 * Math.random() * radius;
            const y = 2 * Math.random() * radius;
            point = new Point(Math.round(this.x - radius + 2 * x), Math.round(this.y - radius + 2 * y));
        } while(!this.isWithin(radius, point));

        return point;
    }
}