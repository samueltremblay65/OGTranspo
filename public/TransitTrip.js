class TransitTrip {
    constructor(steps) {
        this.steps = steps;
        this.visited = [];
    }

    calculateTotalDuration() {
        let time = 0;
        this.steps.forEach(step => {
            if(step.mode == "walk") time += step.walk_time;
            if(step.mode == "metro") time += step.line.calculateJourneyTime(step.start, step.end);
        });
        return time;
    }

    calculateIntermediateDuration(step) {
        let i = 0;
        let time = 0;
        do {
            if(this.steps[i].mode == "walk") time += this.steps[i].walk_time;
            if(this.steps[i].mode == "metro") time += this.steps[i].line.calculateJourneyTime(this.steps[i].start, this.steps[i].end);
        } while(this.steps[i++] != step)
        return time;
    }

    addVisitedConnectionPoints(visited) {
        this.visited = this.visited.concat(visited);
    }

    addMetroTransfer(station, line) {
        const start = this.steps[this.steps.length - 1].end;
        const step = new TransitStep(start, station, "metro", line, 0);
        this.steps.push(step);
    }

    addWalkingSteps(start_location, end_location, calculateWalkingTime) {
        const start_station = this.steps[0].start;
        const end_station = this.steps[this.steps.length-1].end;

        const start_walk_duration = calculateWalkingTime(start_location.distanceTo(start_station.location));
        const end_walk_duration = calculateWalkingTime(end_location.distanceTo(end_station.location));

        this.steps.unshift(new TransitStep(start_location, this.steps[0].start, "walk", null, start_walk_duration));
        this.steps.push(new TransitStep(this.steps[this.steps.length-1].end, end_location, "walk", null, end_walk_duration));
    }

    getLastStop() {
        return this.steps[this.steps.length - 1].end;
    }
}