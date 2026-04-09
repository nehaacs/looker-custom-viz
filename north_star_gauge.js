looker.plugins.visualizations.add({
  options: {
    green_threshold: {
      type: "number",
      label: "Green Threshold (%)",
      default: 80,
      section: "Formatting"
    },
    amber_threshold: {
      type: "number",
      label: "Amber Threshold (%)",
      default: 50,
      section: "Formatting"
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .gauge-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-family: sans-serif;
        }
        .gauge-svg { width: 100%; max-height: 70%; }
        .val-text { font-size: 20px; font-weight: bold; margin-top: -20px; }
        .label-text { font-size: 12px; color: #777; margin-top: 5px; }
      </style>
      <div class="gauge-wrapper" id="viz-container"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const container = document.getElementById("viz-container");
    container.innerHTML = "";

    // Validation
    if (queryResponse.fields.measure_like.length < 2) {
      this.addError({title: "Requirement", message: "Select 'Actual' then 'Expected' measures."});
      return;
    }

    // Extract Data
    const actual = data[0][queryResponse.fields.measure_like[0].name].value;
    const expected = data[0][queryResponse.fields.measure_like[1].name].value;
    const pct = expected > 0 ? (actual / expected) * 100 : 0;
    const displayPct = Math.min(Math.round(pct), 100);

    // Color Logic
    let color = "#FF4136"; // Red
    if (pct >= config.green_threshold) color = "#2ECC40"; // Green
    else if (pct >= config.amber_threshold) color = "#FF851B"; // Amber

    // SVG Math (Semi-circle)
    const r = 40;
    const circ = Math.PI * r; 
    const dashOffset = circ - (Math.min(pct, 100) / 100) * circ;

    container.innerHTML = `
      <svg viewBox="0 0 100 60" class="gauge-svg">
        <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#eee" stroke-width="10" stroke-linecap="round"/>
        <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="${color}" stroke-width="10" 
              stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}" 
              stroke-linecap="round" style="transition: all 0.8s ease-out;"/>
      </svg>
      <div class="val-text" style="color: ${color}">${displayPct}%</div>
      <div class="label-text">Actual: ${actual.toLocaleString()} / Target: ${expected.toLocaleString()}</div>
    `;

    done();
  }
});
