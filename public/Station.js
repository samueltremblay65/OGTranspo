class Station {
    constructor(name, location) {
        this.name = name;
        this.location = location;
        this.lines = [];
    }

    addLine(line) {
        this.lines.push(line);
    }

    sharesLine(station) {
        for(let i = 0; i < this.lines.length; i++) { 
            if(station.lines.includes(this.lines[i])){
                return true;
            }
        }
        return false;
    }

    hasMultipleLines() {
        return this.lines.length > 1;
    }

    shortestDirectConnection(station) {
        let shortestTime = null;
        let shortestTrip = null;

        for(let i = 0; i < this.lines.length; i++) { 
            if(station.lines.includes(this.lines[i])){
                const line = this.lines[i];
                const time = line.calculateJourneyTime(this, station);
                const step = new TransitStep(this, station, "metro", line, 0);
                const trip = new TransitTrip([step]);

                if(shortestTime == null) {
                    shortestTime = time;
                    shortestTrip = trip;
                }
                else if(time < shortestTime) {
                    shortestTime = time;
                    shortestTrip = trip;
                } 
            }
        }
        return shortestTrip;
    }

    shortestTransitTrip(station) {
        // All intelligent possible transit trips. Will filter by length later
        const possible_trips = [];

        // If has direct connection, add shortest one to the list of possible trips
        if(this.sharesLine(station)) {
            possible_trips.push(this.shortestDirectConnection(station));
        }

        // Queue for search
        const queue = [];

        // Seed queue with all stations on all the lines that serve start station
        this.lines.forEach(line => {
            line.stops.forEach(stop => {
                if(!stop.hasMultipleLines()) {
                    return;
                }
                else {
                    const step = new TransitStep(this, stop, "metro", line, 0);
                    const trip = new TransitTrip([step]);
                    trip.addVisitedConnectionPoints(line.getVisitedConnectionPoints(this, stop));
                    queue.push(trip);
                }
            })
        });

        // Search loop
        while(queue.length > 0) {
            let trip = queue.pop();

            const currentStop = trip.getLastStop();

            if(currentStop.sharesLine(station)) {
                trip = trip.combine(currentStop.shortestDirectConnection(station));
                possible_trips.push(trip);
                continue;
            }

            // If we do not have a direct connection to end station:
            // For each line served at this stop, enqueue a trip to each connection point on these lines

            currentStop.lines.forEach(line => {
                const connectionPoints = line.getConnectionPoints();

                connectionPoints.forEach(connectionPoint => {
                    if(!trip.visited.includes(connectionPoint)) {
                        const new_trip = trip.branch(new TransitStep(currentStop, connectionPoint, "metro", line, 0));
                        new_trip.addVisitedConnectionPoints(line.getVisitedConnectionPoints(currentStop, connectionPoint));
                        queue.push(new_trip);
                    }
                });
            });
        }

        if(possible_trips.length == 0) return null;

        let shortest = possible_trips[0];
        let shortest_time = shortest.calculateTotalDuration();

        possible_trips.forEach(trip => {
            const duration = trip.calculateTotalDuration();
            if(duration < shortest_time) {
                shortest_time = duration;
                shortest = trip;
            }
        });

        return shortest;
    }
}