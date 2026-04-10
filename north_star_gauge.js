looker.plugins.visualizations.add({
  options: {
    green_threshold: { type: "number", label: "Green Threshold (%)", default: 80 },
    amber_threshold: { type: "number", label: "Amber Threshold (%)", default: 50 }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .looker-gauge-wrapper {
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: transparent;
        }
        svg {
          max-height: 90%;
          max-width: 90%;
        }
      </style>
      <div class="looker-gauge-wrapper" id="viz-target"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const target = document.getElementById("viz-target");
    target.innerHTML = "";

    if (!data[0] || queryResponse.fields.measure_like.length < 2) {
        this.addError({title: "Missing Data", message: "Requires 2 Measures."});
        return done();
    }

    const measures = queryResponse.fields.measure_like;
    const actual = data[0][measures[0].name].value || 0;
    const expected = data[0][measures[1].name].value || 1;
    const fieldName = measures[0].label_short; // Gets the name of the first measure
    
    const pct = Math.round((actual / expected) * 100);
    const progress = Math.min(Math.max(pct, 0), 100);

    // 1. Specific Color Logic
    // Using your requested RGB for Green, and standard Amber/Red
    let activeColor = "#ed5558"; // Red
    if (pct >= config.green_threshold) {
        activeColor = "rgb(155, 211, 18)"; // Your specific Green
    } else if (pct >= config.amber_threshold) {
        activeColor = "#FF851B"; // Amber
    }

    // 2. SVG Geometry
    const radius = 40;
    const center = 50;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (progress / 100) * circumference;

    target.innerHTML = `
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <circle cx="${center}" cy="${center}" r="${radius}" 
                fill="none" stroke="#f0f0f0" stroke-width="8" />
        
        <circle cx="${center}" cy="${center}" r="${radius}" 
                fill="none" stroke="${activeColor}" stroke-width="8" 
                stroke-dasharray="${circumference}" 
                stroke-dashoffset="${dashOffset}" 
                stroke-linecap="round" 
                transform="rotate(-90 ${center} ${center})" 
                style="transition: stroke-dashoffset 1s ease-out;" />
        
        <text x="${center}" y="${center + 2}" text-anchor="middle" 
              style="font-size: 18px; font-weight: bold; font-family: sans-serif; fill: ${activeColor};">
          ${pct}%
        </text>

        <text x="${center}" y="${center + 12}" text-anchor="middle" 
              style="font-size: 5px; font-family: sans-serif; fill: #999; text-transform: uppercase; letter-spacing: 0.5px;">
          ${fieldName}
        </text>
      </svg>
    `;

    done();
  }
});
