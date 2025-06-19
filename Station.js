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

    shortestDirectConnection(station) {
        let shortestTime = null;
        let shortestTrip = null;

        for(let i = 0; i < this.lines.length; i++) { 
            if(station.lines.includes(this.lines[i])){
                const line = this.lines[i];
                const time = line.calculateJourneyTime(this, station);
                const step = new TransitStep(this, station, "metro", line);
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

    shortestSingleConnection(station) {
        let shortestTime = null;
        let shortestTrip = null; 

        this.lines.forEach((line) => {
            line.stops.forEach((stop) => {
                stop.lines.forEach((stationLine) => {
                    if(station.lines.includes(stationLine)) {
                        const step1 = new TransitStep(this, stop, "metro", line);
                        const step2 = new TransitStep(stop, station, "metro", stationLine);
                        const trip = new TransitTrip([step1, step2]);
                        const time = trip.calculateTotalDuration();

                        if(shortestTime == null) {
                            shortestTime = time;
                            shortestTrip = trip;
                        }
                        else if(time < shortestTime) {
                            shortestTime = time;
                            shortestTrip = trip;
                        }
                    }
                })
            });
        });

        return shortestTrip;
    }

    shortestTransitTrip(station) {
        const direct = this.shortestDirectConnection(station);
        const single = this.shortestSingleConnection(station);

        if(direct == null && single == null) return null;

        else if(direct == null) return single;

        else if(single == null) return direct;

        else return direct.calculateTotalDuration() <= single.calculateTotalDuration() ? direct : single;
    }
}