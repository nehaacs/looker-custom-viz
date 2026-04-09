looker.plugins.visualizations.add({
  // Property options for the visualization editor
  options: {
    greenThreshold: {
      type: "number",
      label: "Green Threshold (%)",
      default: 80,
      section: "Formatting"
    },
    amberThreshold: {
      type: "number",
      label: "Amber Threshold (%)",
      default: 50,
      section: "Formatting"
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .gauge-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-family: 'Open Sans', Helvetica, Arial, sans-serif;
        }
        .gauge-svg { width: 100%; height: 80%; }
        .gauge-text { font-size: 24px; font-weight: bold; }
        .gauge-label { font-size: 14px; color: #666; }
      </style>
      <div class="gauge-container" id="gauge-target"></div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    const container = document.getElementById("gauge-target");
    container.innerHTML = ""; // Clear previous render

    // 1. Validation: Ensure we have two measures
    if (queryResponse.fields.measure_like.length < 2) {
      this.addError({title: "Missing Data", message: "This chart requires two measures: Actual and Total Expected."});
      return;
    }

    // 2. Data Extraction
    const row = data[0];
    const actual = row[queryResponse.fields.measure_like[0].name].value;
    const expected = row[queryResponse.fields.measure_like[1].name].value;
    
    const percentage = expected > 0 ? Math.round((actual / expected) * 100) : 0;

    // 3. Conditional Formatting Logic
    let color = "#ed5558"; // Red (Default)
    if (percentage >= config.greenThreshold) {
      color = "#3eb0d5"; // Green (Looker Blue/Green)
    } else if (percentage >= config.amberThreshold) {
      color = "#e9b404"; // Amber
    }

    // 4. Render SVG Gauge
    // Simple semi-circle calculation for a North Star Gauge
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    container.innerHTML = `
      <svg viewBox="0 0 100 60" class="gauge-svg">
        <path d="M20,50 A30,30 0 1,1 80,50" fill="none" stroke="#eee" stroke-width="8" />
        <path d="M20,50 A30,30 0 1,1 80,50" fill="none" stroke="${color}" stroke-width="8" 
              stroke-dasharray="${circumference}" 
              stroke-dashoffset="${offset}" 
              style="transition: stroke-dashoffset 0.5s ease;" />
      </svg>
      <div class="gauge-text" style="color: ${color}">${percentage}%</div>
      <div class="gauge-label">${actual.toLocaleString()} / ${expected.toLocaleString()}</div>
    `;

    done();
  }
});
