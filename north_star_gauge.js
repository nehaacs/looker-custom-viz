looker.plugins.visualizations.add({
  options: {
    green_threshold: { type: "number", label: "Green Threshold (%)", default: 80 },
    amber_threshold: { type: "number", label: "Amber Threshold (%)", default: 50 }
  },

  create: function(element, config) {
    element.innerHTML = `
      <div id="container" style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;">
        <div id="viz-target" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;"></div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const target = document.getElementById("viz-target");
    target.innerHTML = "";

    if (!data.length || queryResponse.fields.measure_like.length < 2) {
      target.innerHTML = "Select Actual and Expected measures.";
      return done();
    }

    // 1. Data Logic
    const actual = data[0][queryResponse.fields.measure_like[0].name].value || 0;
    const expected = data[0][queryResponse.fields.measure_like[1].name].value || 1;
    const pct = Math.round((actual / expected) * 100);
    const displayPct = Math.min(pct, 100);

    // 2. Full Circle Math
    const radius = 35;
    const circumference = 2 * Math.PI * radius; // 2 * π * r
    const dashOffset = circumference - (displayPct / 100) * circumference;

    // 3. Dynamic Coloring
    let color = "#ed5558"; // Red
    if (pct >= config.green_threshold) color = "#2ECC40"; 
    else if (pct >= config.amber_threshold) color = "#FF851B";

    target.innerHTML = `
      <svg viewBox="0 0 100 100" style="width: 80%; height: 80%;">
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke="#f0f0f0" stroke-width="8" />
        
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="8" 
                stroke-dasharray="${circumference}" 
                stroke-dashoffset="${dashOffset}" 
                stroke-linecap="round" 
                transform="rotate(-90 50 50)" 
                style="transition: stroke-dashoffset 1s ease-in-out;" />
        
        <text x="50" y="55" text-anchor="middle" style="font-size: 16px; font-weight: bold; font-family: Arial; fill: #333;">
          ${pct}%
        </text>
      </svg>
      <div style="font-family: Arial; font-size: 12px; color: #666; margin-top: -10px;">
        <b>${actual.toLocaleString()}</b> / ${expected.toLocaleString()}
      </div>
    `;

    done();
  }
});
