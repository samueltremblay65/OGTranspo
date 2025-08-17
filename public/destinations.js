const destinations = [];

addDestinations();

function addDestinations() {
    // This option populates the center more and diminishes in density as the distance grows outwards
    const radial_options = {distribution: "radial"};

    const parliament = new Destination("Parliament of Canada", new Point(1380, 590), "poi", 50, 100);
    const airport = new Destination("Ottawa International Airport", new Point(1550, 1450), "poi", 75, 100);
    const train_station = new Destination("Ottawa Train Station", new Point(1942, 701), "poi", 75, 100);
    const rideau_centre = new Destination("Rideau Centre", new Point(1460, 540), "poi", 60, 200);
    const uottawa = new Destination("University of Ottawa", new Point(1560, 612), "poi", 100, 400);
    const downtown = new Destination("Downtown", new Point(1385, 645), "neighborhood", 200, 400, radial_options);
    const sandyhill = new Destination("Sandy Hill", new Point(1578, 500), "neighborhood", 200, 1300);
    const centertown = new Destination("Centertown", new Point(1408, 726), "neighborhood", 100, 500, radial_options);
    const lansdowne = new Destination("Lansdowne", new Point(1553, 971), "poi", 75, 300);
    const majors_hill = new Destination("Major's Hill Park", new Point(1374, 504), "poi", 100, 150);
    const nature_museum = new Destination("Nature Museum", new Point(1499, 769), "poi", 25, 50);
    const britania = new Destination("Britania Beach", new Point(1560, 612), "poi", 25, 50);
    const history_museum = new Destination("Museum of History", new Point(1245, 477), "poi", 30, 50);
    const war_museum = new Destination("War Museum", new Point(1167, 713), "poi", 30, 50);
    const rideau_falls = new Destination("Rideau Falls", new Point(1426, 282), "poi", 25, 50);
    const strathcona = new Destination("Strathcona Park", new Point(1685, 551), "poi", 50, 150);
    const dows = new Destination("Dow's Lake", new Point(1327, 994), "poi", 50, 75);
    const casino = new Destination("Casino Lac Leamy", new Point(1072, 193), "poi", 75, 25);


    // Carleton, Rideau Falls, Casino, Lebreton Flats, CTC, Museum of History, Museum of Nature
    const full_city = new Destination("Ottawa", new Point(1385, 645), "city", 3500, 0);

    destinations.push(
        parliament, airport, train_station, rideau_centre, uottawa, downtown, sandyhill, centertown, full_city,
        lansdowne, majors_hill, nature_museum, britania, history_museum, war_museum, rideau_falls, strathcona,
        dows, casino

    );
}
