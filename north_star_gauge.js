looker.plugins.visualizations.add({
  options: {
    green_threshold: { type: "number", label: "Green Threshold (%)", default: 80 },
    amber_threshold: { type: "number", label: "Amber Threshold (%)", default: 50 }
  },

  create: function(element, config) {
    element.innerHTML = `
      <div id="container" style="height:100%; width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;">
        <div id="error-display" style="color:red; font-size:12px;"></div>
        <div id="viz-target" style="width:100%; text-align:center;"></div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const target = document.getElementById("viz-target");
    const errorDisplay = document.getElementById("error-display");
    errorDisplay.innerHTML = ""; // Clear errors
    target.innerHTML = ""; // Clear viz

    // 1. Check if data exists
    if (!data || data.length === 0) {
      errorDisplay.innerHTML = "No data returned from query.";
      return done();
    }

    // 2. Identify Measures (Indices 0 and 1)
    const measures = queryResponse.fields.measure_like;
    if (measures.length < 2) {
      errorDisplay.innerHTML = "Error: Please select at least TWO measures (Actual and Expected).";
      return done();
    }

    // 3. Extract Values safely
    const actualRaw = data[0][measures[0].name].value;
    const expectedRaw = data[0][measures[1].name].value;
    
    const actual = parseFloat(actualRaw) || 0;
    const expected = parseFloat(expectedRaw) || 1; // Prevent div by zero
    
    const pct = Math.round((actual / expected) * 100);
    const displayPct = pct > 100 ? 100 : pct; // Cap visual at 100%

    // 4. Color Logic
    let color = "#ed5558"; // Red
    if (pct >= config.green_threshold) color = "#3eb0d5"; // Green/Blue
    else if (pct >= config.amber_threshold) color = "#e9b404"; // Amber

    // 5. SVG Render
    const r = 40;
    const circ = Math.PI * r; 
    const dashOffset = circ - (displayPct / 100) * circ;

    target.innerHTML = `
      <svg viewBox="0 0 100 60" style="width:80%; max-height:200px;">
        <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#eee" stroke-width="10" stroke-linecap="round"/>
        <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="${color}" stroke-width="10" 
              stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}" 
              stroke-linecap="round" style="transition: stroke-dashoffset 0.6s ease-in-out;"/>
        <text x="50" y="45" text-anchor="middle" style="font-size:14px; font-weight:bold; fill:${color};">${pct}%</text>
      </svg>
      <div style="font-size:12px; color:#666; margin-top:5px;">
        ${measures[0].label_short}: <b>${actual.toLocaleString()}</b> / ${measures[1].label_short}: <b>${expected.toLocaleString()}</b>
      </div>
    `;

    done();
  }
});
