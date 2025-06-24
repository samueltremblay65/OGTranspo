const destinations = [];

addDestinations();

function addDestinations() {
    // This option populates the center more and diminishes in density as the distance grows outwards
    const radial_options = {distribution: "radial"};

    const parliament = new Destination("Parliament of Canada", new Point(1380, 590), "poi", 10, 50);
    const airport = new Destination("Ottawa International Airport", new Point(1550, 1450), "poi", 20, 50);
    const rideau_centre = new Destination("Rideau Centre", new Point(1460, 540), "poi", 30, 200);
    const uottawa = new Destination("University of Ottawa", new Point(1560, 612), "poi", 15, 400);
    const downtown = new Destination("Downtown", new Point(1385, 645), "neighborhood", 200, 400);
    const sandyhill = new Destination("Sandy Hill", new Point(1578, 500), "neighborhood", 300, 1300);
    const centertown = new Destination("Centertown", new Point(1406, 846), "neighborhood", 500, 2000, radial_options);
    const full_city = new Destination("Ottawa", new Point(500, 800), "city", 3500, 0);

    destinations.push(parliament, airport, rideau_centre, uottawa, downtown, sandyhill, centertown, full_city);
}
