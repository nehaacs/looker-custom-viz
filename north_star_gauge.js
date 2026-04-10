looker.plugins.visualizations.add({
  options: {
    green_threshold: { type: "number", label: "Green Threshold (%)", default: 80 },
    amber_threshold: { type: "number", label: "Amber Threshold (%)", default: 50 }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .looker-gauge-container {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: white;
        }
        svg {
          max-height: 100%;
          max-width: 100%;
        }
      </style>
      <div class="looker-gauge-container" id="viz-target"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const target = document.getElementById("viz-target");
    target.innerHTML = "";

    // 1. Data Safety Check
    if (!data[0] || !queryResponse.fields.measure_like[0] || !queryResponse.fields.measure_like[1]) {
        this.addError({title: "Missing Data", message: "Requires 2 Measures (Actual & Expected)"});
        return done();
    }

    const measures = queryResponse.fields.measure_like;
    const actual = data[0][measures[0].name].value || 0;
    const expected = data[0][measures[1].name].value || 1;
    const pct = Math.round((actual / expected) * 100);
    
    // 2. SVG Geometry
    const radius = 40;
    const center = 50;
    const circumference = 2 * Math.PI * radius;
    // Ensure dashOffset never goes below 0 or above circumference
    const progress = Math.min(Math.max(pct, 0), 100);
    const dashOffset = circumference - (progress / 100) * circumference;

    // 3. Conditional Color Logic
    let color = "#ed5558"; // Red
    if (pct >= config.green_threshold) color = "#2ECC40"; 
    else if (pct >= config.amber_threshold) color = "#FF851B";

    // 4. Render (ViewBox 100x100 is crucial for full circle)
    target.innerHTML = `
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <circle cx="${center}" cy="${center}" r="${radius}" 
                fill="none" stroke="#f0f0f0" stroke-width="10" />
        
        <circle cx="${center}" cy="${center}" r="${radius}" 
                fill="none" stroke="${color}" stroke-width="10" 
                stroke-dasharray="${circumference}" 
                stroke-dashoffset="${dashOffset}" 
                stroke-linecap="round" 
                transform="rotate(-90 ${center} ${center})" 
                style="transition: stroke-dashoffset 1s ease-out;" />
        
        <text x="${center}" y="${center + 5}" text-anchor="middle" 
              style="font-size: 18px; font-weight: bold; font-family: 'Open Sans', Helvetica, sans-serif; fill: #333;">
          ${pct}%
        </text>
      </svg>
      <div style="margin-top: 5px; font-family: sans-serif; font-size: 12px; color: #666;">
        ${actual.toLocaleString()} / ${expected.toLocaleString()}
      </div>
    `;

    done();
  }
});
