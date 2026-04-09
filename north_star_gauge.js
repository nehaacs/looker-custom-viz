looker.plugins.visualizations.add({
  options: {
    green_threshold: { type: "number", label: "Green Threshold (%)", default: 80 },
    amber_threshold: { type: "number", label: "Amber Threshold (%)", default: 50 }
  },

  create: function(element, config) {
    // Force a height and width on the container so it's not 0px
    element.innerHTML = `
      <div id="container" style="height: 100vh; width: 100vw; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div id="viz-target" style="width: 100%; text-align: center;"></div>
      </div>
    `;
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    try {
      const target = document.getElementById("viz-target");
      if (!target) return; // Guard clause

      // 1. Data Validation
      if (!data || !data.length) {
        this.addError({title: "No Data", message: "Run a query first."});
        return done();
      }

      const measures = queryResponse.fields.measure_like;
      if (measures.length < 2) {
        target.innerHTML = `<div style="color: #666;">Select 2 measures: Actual & Expected</div>`;
        return done();
      }

      // 2. Data Extraction
      const actual = data[0][measures[0].name].value || 0;
      const expected = data[0][measures[1].name].value || 1;
      const pct = Math.round((actual / expected) * 100);
      const displayPct = Math.min(pct, 100);

      // 3. Color Logic
      let color = "#ed5558"; // Red
      if (pct >= config.green_threshold) color = "#2ECC40"; // Green
      else if (pct >= config.amber_threshold) color = "#FF851B"; // Amber

      // 4. SVG Rendering
      const r = 40;
      const circ = Math.PI * r; 
      const dashOffset = circ - (displayPct / 100) * circ;

      target.innerHTML = `
        <svg viewBox="0 0 100 60" style="width: 90%; max-width: 400px; height: auto;">
          <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#f0f0f0" stroke-width="10" stroke-linecap="round"/>
          <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="${color}" stroke-width="10" 
                stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}" 
                stroke-linecap="round" style="transition: stroke-dashoffset 0.8s ease-out;"/>
          <text x="50" y="45" text-anchor="middle" style="font-size: 14px; font-weight: bold; font-family: Arial; fill: ${color};">${pct}%</text>
        </svg>
        <div style="font-family: Arial; font-size: 12px; color: #333; margin-top: 10px;">
          <b>${actual.toLocaleString()}</b> / ${expected.toLocaleString()}
        </div>
      `;

      done();
    } catch (err) {
      console.error("Custom Viz Error:", err);
      done();
    }
  }
});
