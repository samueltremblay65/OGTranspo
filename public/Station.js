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
        let shortestTrip;

        // If has direct connection, use shortest one as current shortest trip. 
        // There may be a faster way that involves multiple trains
        if(this.sharesLine(station)) {
            shortestTrip = this.shortestDirectConnection(station);
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

        // Search loop, breadth first approach is used
        while(queue.length > 0) {
            let trip = queue.pop();

            // If the subtrip is already longer than the shortest option, abort search for this current trip start
            if(shortestTrip != null) {
                if(trip.calculateTotalDuration() > shortestTrip.calculateTotalDuration()) continue;
            }

            // Get the stop where we are currently during this subtrip
            const currentStop = trip.getLastStop();

            // If this stop connects to the end station, we have a new possible trip. 
            // Check to see if it is the shortest one yet
            if(currentStop.sharesLine(station)) {
                trip = trip.combine(currentStop.shortestDirectConnection(station));
                if(shortestTrip == null || trip.calculateTotalDuration() < shortestTrip.calculateTotalDuration()) shortestTrip = trip;
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

        return shortestTrip;
    }
}