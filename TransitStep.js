class TransitStep {
    constructor(start, end, mode, line, walk_time) {
        this.start = start;
        this.end = end;
        this.mode = mode;
        this.line = line;
        this.walk_time = walk_time;
    }

    print() {
        console.log(`Take lien ${line} from ${start.name} to ${this.end.name}`);
    }


}