class Station {
    constructor(name, location, id) {
        this.name = name;
        this.location = location;
        this.lines = [];
        if(id != null) this.id = id;
        else this.id = crypto.randomUUID();
    }

    addLine(line) {
        this.lines.push(line);
    }

    removeLine(line) {
        const index = this.lines.indexOf(line);
        this.lines.splice(index, 1);
        return index;
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

        let shortestToStation = new Map();

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
                if(!stop.hasMultipleLines() || stop == this) {
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

            const duration = trip.calculateTotalDuration();
            const currentStop = trip.getLastStop();

            // If the subtrip is already longer than the shortest option, abort search for this current trip start
            if(shortestTrip != null) {
                if(duration > shortestTrip.calculateTotalDuration()) continue;
                if(trip.steps.length > 5) continue;
            }

            // If there is already a path to the current station elsewhere that 
            let hasFaster = false;
            trip.steps.forEach(step => {
                if(shortestToStation.has(step.end)) {
                    if(shortestToStation.get(step.end) < trip.calculateIntermediateDuration(step)) {
                        hasFaster = true;
                    }
                }
            });

            if(hasFaster) continue;

            if(shortestToStation.has(currentStop)) {
                if(shortestToStation.get(currentStop) > duration) shortestToStation.set(currentStop, duration);
                else continue;
            } else shortestToStation.set(currentStop, duration);

            // If this stop is the end station or directly connects to the end station, we have a new possible trip. 
            // Check to see if it is the shortest one yet
            if(currentStop == station) {
                if(shortestTrip == null || trip.calculateTotalDuration() < shortestTrip.calculateTotalDuration()) shortestTrip = trip;
            }
            else if(currentStop.sharesLine(station)) {
                const tripEnd = currentStop.shortestDirectConnection(station);
                const new_trip = new TransitTrip(trip.steps.concat(tripEnd.steps));

                // We don't really care about the visited at this point, but maybe future updates will require
                // To keep track of the visited stations even after reaching the station

                if(shortestTrip == null || new_trip.calculateTotalDuration() < shortestTrip.calculateTotalDuration()) shortestTrip = new_trip;
            }

            // If we do not have a direct connection to end station:
            // For each line served at this stop, enqueue a trip to each connection point on these lines
            currentStop.lines.forEach(line => {
                // No point in checking trips on the same line as the last step. Should have just taken the train there directly
                if(line == trip.steps[trip.steps.length - 1].line) return;

                const connectionPoints = line.getConnectionPoints();

                connectionPoints.forEach(connectionPoint => {
                    if(!trip.visited.includes(connectionPoint) && connectionPoint != station) {
                        const new_trip = new TransitTrip([...trip.steps, new TransitStep(currentStop, connectionPoint, "metro", line, 0)]);
                        new_trip.visited = [...trip.visited];
                        new_trip.addVisitedConnectionPoints(line.getVisitedConnectionPoints(currentStop, connectionPoint));
                        queue.push(new_trip);
                    }
                });
            });
        }

        return shortestTrip;
    }
}