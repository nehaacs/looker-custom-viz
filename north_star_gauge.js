looker.viz.register({
  // Configuration options for the user in the Looker UI
  options: {
    gauge_color: {
      type: "string",
      label: "Gauge Color (High)",
      default: "#34a853",
      display: "color"
    },
    target_value: {
      type: "number",
      label: "Target Value (for % calculation)",
      default: 100
    }
  },

  // Called once when the visualization is initialized
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
        .trend-badge {
          margin-top: -10px;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .ratio-text {
          font-size: 11px;
          color: #666;
          margin-top: 2px;
        }
      </style>
      <div id="viz-target" class="gauge-container"></div>
    `;
  },

  // Called every time the data or settings change
  updateAsync: function(data, element, config, queryResponse, details, done) {
    const target = document.getElementById('viz-target');
    
    // 1. Data Extraction (Assumes: 1st column=Score, 2nd=Trend, 3rd=Ratio)
    // Note: Adjust these indexes based on your Explore field order
    const score = data[0][queryResponse.fields.measure_like[0].name].value;
    const trend = data[0][queryResponse.fields.measure_like[1].name].value;
    const ratio = data[0][queryResponse.fields.measure_like[2].name].value;
    
    const targetVal = config.target_value || 100;
    const percentage = Math.min((score / targetVal) * 100, 100);
    const dashArray = (percentage * 251) / 100; // 251 is the circumference of r=40

    // 2. Trend Logic
    const trendColor = trend >= 0 ? "#137333" : "#d93025";
    const trendBg = trend >= 0 ? "#e6f4ea" : "#fce8e6";
    const trendIcon = trend >= 0 ? "▲" : "▼";

    // 3. Render the HTML/SVG
    target.innerHTML = `
      <svg width="180" height="140" viewBox="0 0 160 120">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#ea4335" /> <stop offset="50%" style="stop-color:#fbbc04" /> <stop offset="100%" style="stop-color:#34a853" /> </linearGradient>
        </defs>
        
        <circle cx="80" cy="60" r="40" fill="none" stroke="#e0e0e0" stroke-width="10" />
        
        <circle cx="80" cy="60" r="40" fill="none" stroke="url(#gaugeGradient)" 
                stroke-width="10" stroke-linecap="round"
                stroke-dasharray="${dashArray}, 251"
                transform="rotate(-90 80 60)" />
        
        <text x="80" y="65" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">${score}</text>
      </svg>
      
      <div class="trend-badge" style="background-color: ${trendBg}; color: ${trendColor};">
        ${trendIcon} ${Math.abs(trend)}%
      </div>
      
      <div class="ratio-text">Ratio: ${ratio}</div>
    `;

    done();
  }
});
