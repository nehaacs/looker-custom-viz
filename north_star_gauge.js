looker.plugins.visualizations.add({

  options: {
    green_threshold: {
      type: "number",
      label: "Green Threshold (%)",
      default: 80
    },
    amber_threshold: {
      type: "number",
      label: "Amber Threshold (%)",
      default: 50
    },
    trend_value: {
      type: "number",
      label: "Trend vs 30d Avg (%)",
      default: 0
    },
    trend_direction: {
      type: "string",
      label: "Trend Direction",
      values: [{ "Up": "up" }, { "Down": "down" }],
      display: "select",
      default: "up"
    }
  },

  create: function (element, config) {
    element.innerHTML = `
      <style>
        /* ── Reset ── */
        .lk-wrap * { box-sizing: border-box; margin: 0; padding: 0; }

        .lk-wrap {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: transparent;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          /* BUG 7 FIX: no overflow:hidden so tooltips are never clipped */
          overflow: visible;
        }

        /* ── Header ── */
        .lk-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .lk-header-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: #1a1a2e;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .lk-header-title svg {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }
        .lk-header-sub {
          font-size: 11px;
          color: #aaa;
          font-weight: 400;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        /* BUG 6 FIX: buttons always right-aligned, even when header wraps */
        .lk-header-btns {
          display: flex;
          gap: 7px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .lk-btn-reset {
          font-size: 11px;
          padding: 5px 10px;
          border-radius: 7px;
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #555;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
          white-space: nowrap;
        }
        .lk-btn-reset:hover { background: #f5f5f5; }
        .lk-btn-save {
          font-size: 11px;
          padding: 5px 10px;
          border-radius: 7px;
          border: none;
          background: #4f46e5;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          white-space: nowrap;
        }
        .lk-btn-save:hover { background: #4338ca; }

        /* ── Card ── */
        .lk-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e8eaed;
          padding: 14px 12px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: border-color 0.15s;
          width: 100%;
          /* BUG 7 FIX: no overflow hidden */
          overflow: visible;
        }
        .lk-card:hover  { border-color: #b0b0e8; }
        .lk-card.selected { border: 2px solid #4f46e5; background: #fafafe; }

        /* ── Card header: label + info btn as proper flex siblings ── */
        .lk-card-top {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-bottom: 12px;
        }
        .lk-label {
          flex: 1;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #555;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.5;
          word-break: break-word;
        }
        .lk-info-btn {
          flex-shrink: 0;
          margin-top: 1px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 1.5px solid #bbb;
          background: transparent;
          color: #999;
          font-size: 9px;
          font-style: normal;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        /* ── Gauge
             BUG 1 FIX: fluid width up to 130px so it scales on small screens
             viewBox="0 0 130 130", center=65, radius=36
             Inner clear = 65 - 36 - 4.5(half stroke) = 24.5px each side = 49px total vertical
        ── */
        .lk-gauge-wrap {
          position: relative;
          width: 100%;
          max-width: 130px;
          aspect-ratio: 1 / 1;
        }
        .lk-gauge-wrap svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .lk-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          /* padding scales relative to container via % */
          padding: 0 22%;
        }
        .lk-pct {
          font-size: clamp(14px, 4cqw, 22px);
          font-weight: 800;
          line-height: 1;
        }
        .lk-frac {
          font-size: clamp(8px, 2.2cqw, 10px);
          color: #888;
          margin-top: 3px;
          /* BUG 5 FIX: allow wrapping for large numbers */
          white-space: normal;
          word-break: break-all;
          line-height: 1.3;
        }
        .lk-sub {
          font-size: clamp(7px, 1.8cqw, 8px);
          letter-spacing: 0.4px;
          color: #bbb;
          text-transform: uppercase;
          margin-top: 3px;
          line-height: 1.4;
        }

        /* ── Trend ── */
        .lk-trend-row {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .lk-tbadge {
          font-size: 10px;
          font-weight: 700;
          border-radius: 4px;
          padding: 2px 6px;
          white-space: nowrap;
        }
        .lk-tbadge.up { color: #15803d; background: #f0fdf4; }
        .lk-tbadge.dn { color: #dc2626; background: #fef2f2; }
        .lk-trend-vs   { font-size: 9.5px; color: #bbb; white-space: nowrap; }

        /* ── Stale lines ── */
        .lk-stale-section {
          margin-top: 9px;
          width: 100%;
          border-top: 1px solid #f0f0f0;
          padding-top: 7px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .lk-stale-line {
          font-size: 10px;
          color: #ccc;
          text-align: center;
          line-height: 1.6;
          cursor: default;
          transition: color 0.15s;
        }
        .lk-stale-line.active {
          color: #e53e3e;
          text-decoration: underline;
          cursor: pointer;
        }

        /* ── ↳ Provenance link ── */
        .lk-prov-link {
          margin-top: 9px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 600;
          color: #bbb;
          background: #f5f5f5;
          border: 1px solid #e8e8e8;
          border-radius: 6px;
          padding: 4px 10px;
          cursor: default;
          text-decoration: none;
          transition: all 0.15s;
          white-space: nowrap;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lk-prov-link.active {
          color: #4f46e5;
          background: #eef0ff;
          border-color: #c7c9f5;
          cursor: pointer;
        }
        .lk-prov-link.active:hover { background: #e4e6ff; }

        /* ── Tooltip ── */
        .lk-tt-anchor { position: relative; }
        .lk-tooltip {
          display: none;
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: min(260px, 90vw);
          background: #1a1e2e;
          color: #d1d5db;
          border-radius: 10px;
          padding: 14px;
          font-size: 11px;
          line-height: 1.65;
          z-index: 9999;
        }
        .lk-tooltip.open { display: block; }
        .lk-tooltip::before {
          content: '';
          position: absolute;
          top: -6px;
          right: 4px;
          border: 6px solid transparent;
          border-top: none;
          border-bottom-color: #1a1e2e;
        }
        .lk-tt-title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
        }
        .lk-tt-key { color: #818cf8; font-weight: 700; }
        .lk-tt-p   { margin-top: 7px; }

        /* ── Tabs ── */
        .lk-tabs {
          display: flex;
          gap: 2px;
          margin-top: 16px;
          border-bottom: 2px solid #e8eaed;
          flex-wrap: wrap;
        }
        .lk-tab {
          font-size: 12px;
          font-weight: 600;
          padding: 7px 14px;
          color: #888;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          margin-bottom: -2px;
          border-radius: 6px 6px 0 0;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .lk-tab:hover  { color: #4f46e5; background: #f0f0ff; }
        .lk-tab.active { color: #4f46e5; border-bottom-color: #4f46e5; background: #f5f6ff; }

        .lk-tab-content         { display: none; padding: 12px 2px 2px; }
        .lk-tab-content.active  { display: block; }

        /* ── Provenance table ── */
        .lk-prov-header { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
        .lk-prov-sub    { font-size: 11px; color: #888; margin-bottom: 10px; }
        .lk-prov-table-wrap { overflow-x: auto; }
        .lk-prov-table  {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          min-width: 340px;
        }
        .lk-prov-table th {
          text-align: left;
          padding: 7px 10px;
          background: #f4f5f8;
          color: #555;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.3px;
          border-bottom: 1px solid #e8eaed;
          white-space: nowrap;
        }
        .lk-prov-table td {
          padding: 7px 10px;
          border-bottom: 1px solid #f0f0f0;
          color: #333;
        }
        .lk-prov-table tr:last-child td { border-bottom: none; }
        .lk-badge-stale {
          font-size: 10px; font-weight: 600;
          border-radius: 4px; padding: 2px 7px;
          background: #fef2f2; color: #dc2626;
        }
        .lk-badge-fresh {
          font-size: 10px; font-weight: 600;
          border-radius: 4px; padding: 2px 7px;
          background: #f0fdf4; color: #15803d;
        }

        /* ── Toast ── */
        .lk-toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1e2e;
          color: #fff;
          font-size: 11px;
          font-weight: 500;
          padding: 7px 16px;
          border-radius: 8px;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          white-space: nowrap;
          z-index: 99999;
        }
        .lk-toast.show { opacity: 1; }

        /* ── Responsive breakpoints ── */
        @media (max-width: 480px) {
          .lk-header-sub { display: none; }
          .lk-header-btns { width: 100%; justify-content: flex-end; }
          .lk-btn-reset span, .lk-btn-save span { display: none; }
        }
      </style>

      <div class="lk-wrap" id="lk-root">

        <div class="lk-header">
          <div class="lk-header-title">
            <svg viewBox="0 0 14 14" fill="none" stroke="#4f46e5" stroke-width="1.6" stroke-linecap="round">
              <line x1="1"   y1="3.5"  x2="13"  y2="3.5"/>
              <line x1="3"   y1="7"    x2="11"  y2="7"/>
              <line x1="5"   y1="10.5" x2="9"   y2="10.5"/>
            </svg>
            Filters
          </div>
          <span class="lk-header-sub">— Observed Freshness Score of Provenances</span>
          <div class="lk-header-btns">
            <button class="lk-btn-reset" id="lk-btn-reset">&#8635; Reset to Default</button>
            <button class="lk-btn-save"  id="lk-btn-save">&#128190; Save Filter as Default</button>
          </div>
        </div>

        <div id="lk-card-container"></div>

        <div class="lk-tabs" id="lk-tabs">
          <div class="lk-tab active" data-tab="overview">Overview</div>
          <div class="lk-tab" data-tab="provenance">Provenance</div>
        </div>

        <div class="lk-tab-content active" data-tab="overview">
          <p style="font-size:12px;color:#888;padding:6px 2px;">
            Select a tile, then click &#8627; Stale Provenances to drill into the Provenance tab.
          </p>
        </div>

        <div class="lk-tab-content" data-tab="provenance">
          <div class="lk-prov-header" id="lk-prov-title"></div>
          <div class="lk-prov-sub"    id="lk-prov-sub"></div>
          <div class="lk-prov-table-wrap">
            <table class="lk-prov-table">
              <thead>
                <tr>
                  <th>Provenance</th>
                  <th>Last Updated</th>
                  <th>Expected Frequency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="lk-prov-tbody"></tbody>
            </table>
          </div>
        </div>

      </div>
      <div class="lk-toast" id="lk-toast"></div>
    `;

    /* ── localStorage helpers ── */
    const LS_KEY         = 'lk_freshness_filters';
    const SYSTEM_DEFAULT = { selectedIndex: 0 };

    function loadState() {
      try {
        return JSON.parse(
          element.ownerDocument.defaultView.localStorage.getItem(LS_KEY)
        ) || SYSTEM_DEFAULT;
      } catch (e) { return SYSTEM_DEFAULT; }
    }

    function saveState(s) {
      try {
        element.ownerDocument.defaultView.localStorage.setItem(
          LS_KEY, JSON.stringify(s)
        );
      } catch (e) {}
    }

    /* ── Tab switching ── */
    function switchTab(name) {
      element.querySelectorAll('.lk-tab').forEach(function (t) {
        t.classList.toggle('active', t.dataset.tab === name);
      });
      element.querySelectorAll('.lk-tab-content').forEach(function (t) {
        t.classList.toggle('active', t.dataset.tab === name);
      });
    }

    element.querySelectorAll('.lk-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchTab(tab.dataset.tab); });
    });

    /* ── Toast ── */
    function showToast(msg) {
      var toast = element.querySelector('#lk-toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(function () { toast.classList.remove('show'); }, 2200);
    }

    /* BUG 4 FIX: tooltip close registered once in create, not in updateAsync */
    element.ownerDocument.addEventListener('click', function () {
      element.querySelectorAll('.lk-tooltip.open').forEach(function (t) {
        t.classList.remove('open');
      });
    });

    /* ── Expose helpers to updateAsync via element properties ── */
    element._lk = {
      loadState    : loadState,
      saveState    : saveState,
      switchTab    : switchTab,
      showToast    : showToast,
      LS_KEY       : LS_KEY,
      SYSTEM_DEFAULT: SYSTEM_DEFAULT
    };

    /* ── Header button delegation ── */
    element.querySelector('#lk-btn-reset').addEventListener('click', function () {
      if (typeof element._lk.onReset === 'function') element._lk.onReset();
    });
    element.querySelector('#lk-btn-save').addEventListener('click', function () {
      if (typeof element._lk.onSave === 'function') element._lk.onSave();
    });
  },

  updateAsync: function (data, element, config, queryResponse, details, done) {

    this.clearErrors();

    const measures = queryResponse.fields.measure_like;

    if (!data[0] || measures.length < 2) {
      this.addError({ title: 'Missing Data', message: 'Requires 2 Measures.' });
      return done();
    }

    /* ── Original value extraction ── unchanged */
    const actual    = data[0][measures[0].name].value || 0;
    const expected  = data[0][measures[1].name].value || 1;
    const fieldName = measures[0].label_short;

    /* ── Optional stale measures ── */
    const staleProvCount = measures[2]
      ? (data[0][measures[2].name].value || 0) : null;
    const staleVarCount  = measures[3]
      ? (data[0][measures[3].name].value || 0) : null;

    /* ── Original pct + progress logic ── unchanged */
    const pct      = Math.round((actual / expected) * 100);
    const progress = Math.min(Math.max(pct, 0), 100);

    /* ── Original RAG color logic ── unchanged */
    let activeColor = '#ed5558';
    if      (pct >= config.green_threshold) activeColor = 'rgb(155, 211, 18)';
    else if (pct >= config.amber_threshold) activeColor = '#FF851B';

    /* ── SVG geometry — viewBox 130×130, center 65, radius 36 ── */
    const radius        = 36;
    const center        = 65;
    const circumference = 2 * Math.PI * radius;
    const dashOffset    = circumference - (progress / 100) * circumference;

    /* ── Trend ── */
    const trendVal = Math.abs(config.trend_value || 0);
    const trendDir = config.trend_direction || 'up';

    /* ── Helpers from create() ── */
    const lk           = element._lk;
    const switchTab    = lk.switchTab;
    const showToast    = lk.showToast;
    const loadState    = lk.loadState;
    const saveState    = lk.saveState;

    /* BUG 3 FIX: persist selectedIndex on element so re-renders don't reset it */
    if (element._lk.selectedIndex === undefined) {
      element._lk.selectedIndex = loadState().selectedIndex ?? 0;
    }

    /* ── Tooltip HTML ── */
    const TT_HTML = `
      <div class="lk-tt-title">Observed Freshness Score Explained</div>
      <p>Measures the operational health of our pipelines by evaluating the actively
      tracked Provenances (tables/endpoints) that contain the filtered StatVars.</p>
      <p class="lk-tt-p"><span class="lk-tt-key">Formula:</span>
        [ Known Fresh / (Known Fresh + Known Stale) ] × 100</p>
      <p class="lk-tt-p"><span class="lk-tt-key">Freshness SLA:</span>
        A Provenance is marked "Stale" if it exceeds its expected update frequency
        plus a standard processing buffer (e.g., a Daily dataset has a 12-hour buffer,
        yielding a 36-hour SLA).</p>
      <p class="lk-tt-p"><span class="lk-tt-key">Example:</span>
        Out of 100 tracked Provenances powering your selected StatVars, we can confirm
        85 are Fresh and 5 are Stale (10 lack metadata). The score is 94.4% [ 85 / 90 ].</p>`;

    /* ── Provenance drill-down ── */
    function openProvenance() {
      var titleEl = element.querySelector('#lk-prov-title');
      var subEl   = element.querySelector('#lk-prov-sub');
      var tbody   = element.querySelector('#lk-prov-tbody');

      titleEl.textContent = fieldName + ' — Stale Provenances';
      subEl.textContent   = (staleProvCount || 0) + ' stale out of ' + expected
                          + ' tracked provenances for this filter.';
      tbody.innerHTML     =
        '<tr><td colspan="4" style="color:#aaa;font-size:11px;padding:10px;">'
        + 'Connect your Looker query to populate provenance-level rows.</td></tr>';
      switchTab('provenance');
    }

    /* ── BUG 2 FIX: single card, no 5-col grid ── */
    function renderCard() {
      var container = element.querySelector('#lk-card-container');
      container.innerHTML = '';

      var stalePText = staleProvCount !== null
        ? staleProvCount + ' / ' + expected + ' Stale Provenances' : '';
      var staleSText = staleVarCount !== null
        ? staleVarCount + ' Stale StatVars' : '';

      var card = element.ownerDocument.createElement('div');
      card.className = 'lk-card selected'; /* single-tile — always selected in its cell */

      card.innerHTML = `
        <div class="lk-card-top">
          <div class="lk-label">${fieldName}</div>
          <div class="lk-tt-anchor">
            <i class="lk-info-btn" id="lk-info-btn">i</i>
            <div class="lk-tooltip" id="lk-tooltip">${TT_HTML}</div>
          </div>
        </div>

        <div class="lk-gauge-wrap">
          <svg viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${center}" cy="${center}" r="${radius}"
                    fill="none" stroke="#ebebeb" stroke-width="9"/>
            <circle cx="${center}" cy="${center}" r="${radius}"
                    fill="none" stroke="${activeColor}" stroke-width="9"
                    stroke-dasharray="${circumference.toFixed(2)}"
                    stroke-dashoffset="${dashOffset.toFixed(2)}"
                    stroke-linecap="round"
                    transform="rotate(-90 ${center} ${center})"
                    style="transition: stroke-dashoffset 1s ease-out;"/>
          </svg>
          <div class="lk-center">
            <span class="lk-pct" style="color:${activeColor};">${pct}%</span>
            <span class="lk-frac">(${actual} / ${expected})</span>
            <span class="lk-sub">Fresh<br>Provenances</span>
          </div>
        </div>

        <div class="lk-trend-row">
          <span class="lk-tbadge ${trendDir === 'up' ? 'up' : 'dn'}">
            ${trendDir === 'up' ? '&#8593;' : '&#8595;'} ${trendVal}%
          </span>
          <span class="lk-trend-vs">vs. 30d average</span>
        </div>

        <div class="lk-stale-section">
          ${stalePText
            ? `<span class="lk-stale-line active" id="lk-stale-p">${stalePText}</span>`
            : ''}
          ${staleSText
            ? `<span class="lk-stale-line active" id="lk-stale-s">${staleSText}</span>`
            : ''}
        </div>

        <a class="lk-prov-link active" id="lk-prov-link">
          &#8627; ${staleProvCount !== null ? staleProvCount : '—'} Stale Provenances
        </a>
      `;

      /* Info tooltip */
      card.querySelector('#lk-info-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        var tt = card.querySelector('#lk-tooltip');
        element.querySelectorAll('.lk-tooltip.open').forEach(function (t) {
          if (t !== tt) t.classList.remove('open');
        });
        tt.classList.toggle('open');
      });

      /* Stale lines */
      card.querySelectorAll('.lk-stale-line.active').forEach(function (sl) {
        sl.addEventListener('click', function (e) {
          e.stopPropagation();
          openProvenance();
        });
      });

      /* ↳ Provenance link */
      card.querySelector('#lk-prov-link').addEventListener('click', function (e) {
        e.stopPropagation();
        openProvenance();
      });

      container.appendChild(card);
    }

    renderCard();

    /* ── Header button handlers — re-assigned each updateAsync so closures are fresh ── */
    element._lk.onSave = function () {
      saveState({ selectedIndex: element._lk.selectedIndex });
      showToast('Filter saved as default');
    };

    element._lk.onReset = function () {
      var stored = null;
      try {
        stored = JSON.parse(
          element.ownerDocument.defaultView.localStorage.getItem(lk.LS_KEY)
        );
      } catch (e) {}
      var base = stored || lk.SYSTEM_DEFAULT;
      element._lk.selectedIndex = base.selectedIndex ?? 0;
      renderCard();
      switchTab('overview');
      showToast('Reset to ' + (stored ? 'your saved default' : 'system default'));
    };

    done();
  }

});
