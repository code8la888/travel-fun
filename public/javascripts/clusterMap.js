maptilersdk.config.apiKey = maptilerApiKey;
const map = new maptilersdk.Map({
  container: "cluster-map",
  zoom: 7,
  center: [121, 24],
  style: maptilersdk.MapStyle.BASIC,
  navigationControl: "bottom-right",
});

map.on("load", function () {
  // add a clustered GeoJSON source for a sample set of earthquakes
  map.addSource("hotel", {
    type: "geojson",
    data: hotel,
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
  });

  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "hotel",
    filter: ["has", "point_count"],
    paint: {
      // Use step expressions (https://docs.maptiler.com/gl-style-specification/expressions/#step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750
      "circle-color": [
        "step",
        ["get", "point_count"],
        "rgb(160, 206, 255)",
        5,
        "rgb(121, 187, 255)",
        10,
        "rgb(51, 126, 204)",
      ],
      "circle-radius": ["step", ["get", "point_count"], 20, 5, 30, 10, 40],
    },
  });

  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "hotel",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}間",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
  });

  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "hotel",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "rgb(216, 235, 255)",
      "circle-radius": 5,
      "circle-stroke-width": 1,
      "circle-stroke-color": "white",
    },
  });

  // inspect a cluster on click
  map.on("click", "clusters", async function (e) {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["clusters"],
    });
    const clusterId = features[0].properties.cluster_id;
    const zoom = await map
      .getSource("hotel")
      .getClusterExpansionZoom(clusterId);
    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom,
    });
  });

  // When a click event occurs on a feature in
  // the unclustered-point layer, open a popup at
  // the location of the feature, with
  // description HTML from its properties.
  map.on("click", "unclustered-point", function (e) {
    const { popUpMarkup } = e.features[0].properties;

    const coordinates = e.features[0].geometry.coordinates.slice();

    // Ensure that if the map is zoomed out such that
    // multiple copies of the feature are visible, the
    // popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new maptilersdk.Popup()
      .setLngLat(coordinates)
      .setHTML(popUpMarkup)
      .addTo(map);
  });

  map.on("mouseenter", "clusters", function () {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "clusters", function () {
    map.getCanvas().style.cursor = "";
  });
  map.on("mouseenter", "unclustered-point", function () {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "unclustered-point", function () {
    map.getCanvas().style.cursor = "";
  });
});
