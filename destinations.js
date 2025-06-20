const destinations = [];

addDestinations();

function addDestinations() {
    const parliament = new Destination("Parliament of Canada", new Point(1380, 590), "poi", 10, 50);
    const airport = new Destination("Ottawa International Airport", new Point(1550, 1450), "poi", 20, 50);
    const rideau_centre = new Destination("Rideau Centre", new Point(1460, 540), "poi", 30, 200);
    const uottawa = new Destination("University of Ottawa", new Point(1560, 612), "poi", 15, 400);
    const dows = new Destination("Dow's Lake", new Point(1326, 988), "poi", 10, 50);
    const westboro = new Destination("Westboro", new Point(700, 1300), "neighborhood", 100, 1200);
    const westboro_east = new Destination("Westboro", new Point(867, 1026), "neighborhood", 100, 1000);
    const downtown = new Destination("Downtown", new Point(1385, 645), "neighborhood", 200, 400);
    const sandyhill = new Destination("Sandy Hill", new Point(1578, 500), "neighborhood", 300, 1300);

    const radial_options = {distribution: "radial"};

    const centertown = new Destination("Centertown", new Point(1406, 846), "neighborhood", 500, 2000, radial_options);
    const mechanicsville = new Destination("Mechanicsville", new Point(1111, 936), "neighborhood", 100, 1000);
    const experimental_farm = new Destination("Experimental farm", new Point(1008, 1309), "neighborhood", 60, 800);
    const full_city = new Destination("Ottawa", new Point(500, 800), "city", 2000, 10000);

    destinations.push(parliament, airport, rideau_centre, uottawa, dows, westboro, westboro_east, downtown, sandyhill, 
        centertown, mechanicsville, experimental_farm, full_city);
}
