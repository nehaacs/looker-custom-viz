looker.plugins.visualizations.add({
  options: {
    green_threshold: { type: "number", label: "Green Threshold (%)", default: 80 },
    amber_threshold: { type: "number", label: "Amber Threshold (%)", default: 50 }
  },

  create: function(element, config) {
    element.innerHTML = `
      <div id="container" style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;">
        <div id="viz-target" style="width: 100%; height: 100%;"></div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const target = document.getElementById("viz-target");
    target.innerHTML = "";

    // 1. Data Logic
    const measures = queryResponse.fields.measure_like;
    const actual = data[0][measures[0].name].value || 0;
    const expected = data[0][measures[1].name].value || 1;
    const pct = Math.round((actual / expected) * 100);
    
    // 2. Full Circle Settings
    const radius = 35;
    const circ = 2 * Math.PI * radius; 
    const dashOffset = circ - (Math.min(pct, 100) / 100) * circ;

    // 3. Color Logic
    let color = "#ed5558"; // Red
    if (pct >= config.green_threshold) color = "#2ECC40"; 
    else if (pct >= config.amber_threshold) color = "#FF851B";

    target.innerHTML = `
      <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; transform: rotate(-90deg);">
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke="#eeeeee" stroke-width="8" />
        
        <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${color}" stroke-width="8" 
                stroke-dasharray="${circ}" 
                stroke-dashoffset="${dashOffset}" 
                stroke-linecap="round" 
                style="transition: stroke-dashoffset 1s ease-in-out;" />
        
        <text x="50" y="55" text-anchor="middle" 
              transform="rotate(90 50 50)" 
              style="font-size: 16px; font-weight: bold; font-family: sans-serif; fill: #333;">
          ${pct}%
        </text>
      </svg>
    `;

    done();
  }
});
