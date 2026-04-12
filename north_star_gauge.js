looker.plugins.visualizations.add({

  options: {
    // ── Original options ── unchanged
    green_threshold: { type: "number", label: "Green Threshold (%)", default: 80 },
    amber_threshold: { type: "number", label: "Amber Threshold (%)", default: 50 },
    // ── New options for trend badge ──
    trend_value:     { type: "number", label: "Trend vs 30d Avg (%)", default: 0 },
    trend_direction: {
      type: "string", label: "Trend Direction",
      values: [{ "Up": "up" }, { "Down": "down" }],
      display: "select", default: "up"
    }
  },

  create: function(element, config) {
    element.innerHTML = `
      <style>
        .lk-wrap {
          height: 100%; width: 100%;
          display: flex; align-items: center; justify-content: center;
          background-color: transparent;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .lk-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1.5px solid #d4d4f7;
          padding: 16px 14px 14px;
          display: flex; flex-direction: column; align-items: center;
          min-width: 180px; max-width: 220px; width: 100%;
        }
        .lk-card-top {
          width: 100%; display: flex;
          align-items: flex-start; justify-content: center;
          margin-bottom: 12px; position: relative;
        }
        .lk-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.6px;
          color: #555; text-transform: uppercase;
          text-align: center; line-height: 1.4; padding-right: 18px;
        }
        .lk-info-btn {
          position: absolute; right: 0; top: 0;
          width: 16px; height: 16px; border-radius: 50%;
          border: 1.5px solid #aaa; background: transparent;
          color: #888; font-size: 9px; font-style: normal;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .lk-gauge-wrap { position: relative; width: 150px; height: 150px; }
        .lk-gauge-wrap svg { width: 150px; height: 150px; }
        .lk-center {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
        }
        .lk-pct  { font-size: 30px; font-weight: 800; line-height: 1; }
        .lk-frac { font-size: 11px; color: #888; margin-top: 4px; }
        .lk-sub  {
          font-size: 8px; letter-spacing: 0.5px; color: #bbb;
          text-transform: uppercase; margin-top: 4px; line-height: 1.4;
        }
        .lk-trend-row { margin-top: 10px; display: flex; align-items: center; gap: 5px; }
        .lk-tbadge {
          font-size: 11px; font-weight: 700;
          border-radius: 5px; padding: 2px 7px;
        }
        .lk-tbadge.up { color: #15803d; background: #f0fdf4; }
        .lk-tbadge.dn { color: #dc2626; background: #fef2f2; }
        .lk-trend-vs { font-size: 10px; color: #bbb; }
        .lk-stale-section {
          margin-top: 10px; width: 100%;
          border-top: 1px solid #f0f0f0; padding-top: 8px;
          display: flex; flex-direction: column; gap: 3px;
        }
        .lk-stale-line {
          font-size: 10px; color: #e53e3e;
          text-decoration: underline; text-align: center;
          cursor: pointer; line-height: 1.6;
        }
        .lk-tt-anchor { position: relative; }
        .lk-tooltip {
          display: none;
          position: absolute; top: calc(100% + 8px); left: 50%;
          transform: translateX(-50%); width: 260px;
          background: #1a1e2e; color: #d1d5db;
          border-radius: 10px; padding: 16px;
          font-size: 11px; line-height: 1.65; z-index: 999;
        }
        .lk-tooltip.open { display: block; }
        .lk-tooltip::before {
          content: ''; position: absolute; top: -6px; left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top: none; border-bottom-color: #1a1e2e;
        }
        .lk-tt-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 10px; }
        .lk-tt-key   { color: #818cf8; font-weight: 700; }
        .lk-tt-p     { margin-top: 8px; }
      </style>

      <div class="lk-wrap">
        <div class="lk-card">

          <div class="lk-card-top">
            <div class="lk-label" id="lk-label"></div>
            <div class="lk-tt-anchor">
              <i class="lk-info-btn" id="lk-info-btn">i</i>
              <div class="lk-tooltip" id="lk-tooltip">
                <div class="lk-tt-title">Observed Freshness Score Explained</div>
                <p>Measures the operational health of our pipelines by evaluating the actively tracked Provenances (tables/endpoints) that contain the filtered StatVars.</p>
                <p class="lk-tt-p"><span class="lk-tt-key">Formula:</span> [ Known Fresh / (Known Fresh + Known Stale) ] × 100</p>
                <p class="lk-tt-p"><span class="lk-tt-key">Freshness SLA:</span> A Provenance is marked "Stale" if it exceeds its expected update frequency plus a standard processing buffer (e.g., a Daily dataset has a 12-hour buffer, yielding a 36-hour SLA).</p>
                <p class="lk-tt-p"><span class="lk-tt-key">Example:</span> Out of 100 tracked Provenances powering your selected StatVars, we can confirm 85 are Fresh and 5 are Stale (10 lack metadata). The score is 94.4% [ 85 / 90 ].</p>
              </div>
            </div>
          </div>

          <div class="lk-gauge-wrap">
            <svg id="lk-svg" viewBox="0 0 150 150"></svg>
            <div class="lk-center">
              <span class="lk-pct"  id="lk-pct"></span>
              <span class="lk-frac" id="lk-frac"></span>
              <span class="lk-sub">Fresh<br>Provenances</span>
            </div>
          </div>

          <div class="lk-trend-row">
            <span class="lk-tbadge" id="lk-trend-badge"></span>
            <span class="lk-trend-vs">vs. 30d average</span>
          </div>

          <div class="lk-stale-section">
            <span class="lk-stale-line" id="lk-stale-p"></span>
            <span class="lk-stale-line" id="lk-stale-s"></span>
          </div>

        </div>
      </div>
    `;

    element.querySelector('#lk-info-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      element.querySelector('#lk-tooltip').classList.toggle('open');
    });
    element.ownerDocument.addEventListener('click', function() {
      element.querySelector('#lk-tooltip').classList.remove('open');
    });
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {

    this.clearErrors();

    const measures = queryResponse.fields.measure_like;

    // ── Original guard ── unchanged
    if (!data[0] || measures.length < 2) {
      this.addError({ title: "Missing Data", message: "Requires 2 Measures." });
      return done();
    }

    // ── Original value extraction ── unchanged
    const actual    = data[0][measures[0].name].value || 0;
    const expected  = data[0][measures[1].name].value || 1;
    const fieldName = measures[0].label_short;

    // ── Original pct + progress logic ── unchanged
    const pct      = Math.round((actual / expected) * 100);
    const progress = Math.min(Math.max(pct, 0), 100);

    // ── Original RAG color logic ── unchanged (exact same variable name + RGB values)
    let activeColor = "#ed5558";
    if (pct >= config.green_threshold) {
      activeColor = "rgb(155, 211, 18)";
    } else if (pct >= config.amber_threshold) {
      activeColor = "#FF851B";
    }

    // ── Original SVG geometry ── unchanged variable names
    const radius        = 57;
    const center        = 75;
    const circumference = 2 * Math.PI * radius;
    const dashOffset    = circumference - (progress / 100) * circumference;

    // ── Populate card ──
    element.querySelector('#lk-label').textContent = fieldName;

    const pctEl = element.querySelector('#lk-pct');
    pctEl.textContent = pct + '%';
    pctEl.style.color = activeColor;

    element.querySelector('#lk-frac').textContent = `(${actual} / ${expected})`;

    element.querySelector('#lk-svg').innerHTML = `
      <circle cx="${center}" cy="${center}" r="${radius}"
              fill="none" stroke="#f0f0f0" stroke-width="11"/>
      <circle cx="${center}" cy="${center}" r="${radius}"
              fill="none" stroke="${activeColor}" stroke-width="11"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${dashOffset}"
              stroke-linecap="round"
              transform="rotate(-90 ${center} ${center})"
              style="transition: stroke-dashoffset 1s ease-out;"/>
    `;

    // ── Trend badge (new options: trend_value, trend_direction) ──
    const trendVal = Math.abs(config.trend_value || 0);
    const trendDir = config.trend_direction || "up";
    const badge    = element.querySelector('#lk-trend-badge');
    badge.textContent = (trendDir === "up" ? "↑ " : "↓ ") + trendVal + "%";
    badge.className   = "lk-tbadge " + (trendDir === "up" ? "up" : "dn");

    // ── Stale lines (optional measures[2] and measures[3]) ──
    const stalePEl = element.querySelector('#lk-stale-p');
    const staleSEl = element.querySelector('#lk-stale-s');

    if (measures[2]) {
      const staleP = data[0][measures[2].name].value || 0;
      stalePEl.textContent     = `${staleP} / ${expected} Stale Provenances`;
      stalePEl.style.display   = "block";
    } else {
      stalePEl.style.display   = "none";
    }

    if (measures[3]) {
      const staleS = data[0][measures[3].name].value || 0;
      staleSEl.textContent     = `${staleS} Stale StatVars`;
      staleSEl.style.display   = "block";
    } else {
      staleSEl.style.display   = "none";
    }

    done();
  }

});
