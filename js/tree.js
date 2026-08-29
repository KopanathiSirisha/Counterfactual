(function() {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function createSvgElement(tag, attributes = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) {
      el.setAttribute(key, value);
    }
    return el;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Calculate Growth Stage based on entry count
  function getTreeGrowthStage(entryCount) {
    if (entryCount <= 5) {
      return {
        key: 'sprout',
        level: 'Stage I',
        name: 'The Sprout',
        icon: '🌱',
        progress: `(${entryCount}/5 Days)`
      };
    } else if (entryCount <= 20) {
      return {
        key: 'sapling',
        level: 'Stage II',
        name: 'The Sapling',
        icon: '🌿',
        progress: `(${entryCount}/20 Days)`
      };
    } else if (entryCount <= 50) {
      return {
        key: 'young-tree',
        level: 'Stage III',
        name: 'The Young Tree',
        icon: '🌳',
        progress: `(${entryCount}/50 Days)`
      };
    } else {
      return {
        key: 'ancient-canopy',
        level: 'Stage IV',
        name: 'The Flourishing Tree',
        icon: '🌺',
        progress: `(${entryCount} Days • Flourishing)`
      };
    }
  }

  let debounceTimer;

  window.Tree = {
    render: async function() {
      const container = document.getElementById('tree-container');
      const svg = document.getElementById('tree-svg');
      const cardsContainer = document.getElementById('tree-cards-container');
      if (!container) return;

      const entries = window.Entries ? window.Entries.getAll() : [];
      const stage = getTreeGrowthStage(entries.length);

      // Update Growth Stage Badge in Header
      const stageIconEl = document.getElementById('stage-icon');
      const stageNameEl = document.getElementById('stage-name');
      const stageProgressEl = document.getElementById('stage-progress');
      if (stageIconEl) stageIconEl.textContent = stage.icon;
      if (stageNameEl) stageNameEl.textContent = `${stage.level}: ${stage.name}`;
      if (stageProgressEl) stageProgressEl.textContent = stage.progress;

      // Clear containers
      if (svg) svg.innerHTML = '';
      if (cardsContainer) cardsContainer.innerHTML = '';

      if (entries.length === 0) {
        if (cardsContainer) {
          cardsContainer.innerHTML = `
            <div class="tree-empty-card">
              <div style="font-size: 40px; margin-bottom: 0.75rem;">🌱</div>
              <h3>Your Reflective Journey Begins Here</h3>
              <p>Log what you intended to do versus what you actually did each day to build your interactive growth timeline.</p>
              <button class="tree-empty-cta" id="empty-add-btn">+ Add Your First Day</button>
            </div>
          `;
          const emptyBtn = document.getElementById('empty-add-btn');
          if (emptyBtn) {
            emptyBtn.addEventListener('click', () => {
              if (window.UI) window.UI.showEntryForm();
            });
          }
        }
        return;
      }

      // ════════════════════════════════════════════════════════════════
      // WINDING JOURNEY HIGHWAY & FORKING LANES ENGINE
      // ════════════════════════════════════════════════════════════════
      const totalEntries = entries.length;
      const cardSpacing = 240;
      const groundPadding = 60;
      const topPadding = 80;
      const totalHeight = Math.max(650, topPadding + (totalEntries * cardSpacing) + groundPadding);
      const groundY = totalHeight - 40;
      const topY = 40;
      const svgWidth = 960;
      const centerX = svgWidth / 2;

      svg.setAttribute('viewBox', `0 0 ${svgWidth} ${totalHeight}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');

      // 1. Render Topographic Elevation Contours (GPS Map Feel)
      const topoLines = [
        `M 0 ${totalHeight * 0.15} Q 260 ${totalHeight * 0.12}, 520 ${totalHeight * 0.18} T ${svgWidth} ${totalHeight * 0.14}`,
        `M 0 ${totalHeight * 0.38} Q 280 ${totalHeight * 0.32}, 560 ${totalHeight * 0.42} T ${svgWidth} ${totalHeight * 0.36}`,
        `M 0 ${totalHeight * 0.62} Q 240 ${totalHeight * 0.58}, 500 ${totalHeight * 0.66} T ${svgWidth} ${totalHeight * 0.6}`,
        `M 0 ${totalHeight * 0.85} Q 320 ${totalHeight * 0.8}, 620 ${totalHeight * 0.88} T ${svgWidth} ${totalHeight * 0.82}`
      ];
      topoLines.forEach(d => {
        const topo = createSvgElement('path', { class: 'topo-contour-line', d });
        svg.appendChild(topo);
      });

      // 2. Generate Continuous Winding Highway Spine (Reference 1 & 2)
      const waypoints = [];
      waypoints.push({ x: centerX, y: groundY });

      for (let i = 0; i < totalEntries; i++) {
        const wpY = groundY - 110 - (i * cardSpacing);
        const wpX = i % 2 === 0 ? 350 : 610;
        waypoints.push({ x: wpX, y: wpY, index: i });
      }
      waypoints.push({ x: centerX, y: topY });

      // Construct Smooth Highway Curve
      let highwayPathD = `M ${waypoints[0].x} ${waypoints[0].y}`;
      for (let w = 0; w < waypoints.length - 1; w++) {
        const curr = waypoints[w];
        const next = waypoints[w + 1];
        const midY = (curr.y + next.y) / 2;
        highwayPathD += ` C ${curr.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y}`;
      }

      // Asphalt Road Bed
      const roadBed = createSvgElement('path', {
        class: 'road-highway-bed',
        d: highwayPathD
      });
      svg.appendChild(roadBed);

      // Road Shoulder Curbs
      const roadCurb = createSvgElement('path', {
        class: 'road-highway-curb',
        d: highwayPathD
      });
      svg.appendChild(roadCurb);

      // Center Dashed Lane Markings
      const roadCenterStripe = createSvgElement('path', {
        class: 'road-center-stripe',
        d: highwayPathD
      });
      svg.appendChild(roadCenterStripe);

      // 3. Render Waypoint Map Pins & Forking Lanes
      for (let i = 0; i < totalEntries; i++) {
        const entry = entries[i];
        const wp = waypoints[i + 1];
        const statusKey = entry.status || 'done';
        const statusClass = `status-${statusKey}`;
        const statusLabel = statusKey === 'done' ? 'Reached' : (statusKey === 'partial' ? 'Detour' : 'Roadblock');
        const formattedDate = window.UI ? window.UI.formatDate(entry.date) : entry.date;
        const tagLabel = (entry.tag || 'General').toUpperCase();
        const milestoneNum = String(i + 1).padStart(2, '0');

        // Forking lane left (Intended Route - The Road Not Taken)
        const intendedLaneD = `M ${wp.x} ${wp.y} C ${wp.x - 70} ${wp.y}, ${wp.x - 140} ${wp.y - 30}, ${wp.x - 190} ${wp.y - 30}`;
        const laneIntended = createSvgElement('path', {
          class: 'road-lane-intended',
          d: intendedLaneD
        });
        svg.appendChild(laneIntended);

        // Forking lane right (Taken Route - The Road Taken)
        const takenLaneD = `M ${wp.x} ${wp.y} C ${wp.x + 70} ${wp.y}, ${wp.x + 140} ${wp.y - 30}, ${wp.x + 190} ${wp.y - 30}`;
        const laneTaken = createSvgElement('path', {
          class: 'road-lane-taken',
          d: takenLaneD
        });
        svg.appendChild(laneTaken);

        // Waypoint Beacon Pulse Ring
        const beaconRing = createSvgElement('circle', {
          class: 'waypoint-beacon-ring',
          cx: wp.x,
          cy: wp.y,
          r: 10
        });
        svg.appendChild(beaconRing);

        // Teardrop Location Map Pin (Reference 1 & 4)
        const pinGroup = createSvgElement('g', {
          class: 'map-pin-group',
          transform: `translate(${wp.x}, ${wp.y})`
        });
        const pinBody = createSvgElement('path', {
          class: 'map-pin-body',
          d: 'M 0 0 C -11 -10, -13 -24, 0 -24 C 13 -24, 11 -10, 0 0 Z'
        });
        const pinCircle = createSvgElement('circle', {
          class: 'map-pin-inner-circle',
          cx: 0,
          cy: -14.5,
          r: 6
        });
        const pinText = createSvgElement('text', {
          class: 'map-pin-label',
          x: 0,
          y: -14
        });
        pinText.textContent = milestoneNum;

        pinGroup.appendChild(pinBody);
        pinGroup.appendChild(pinCircle);
        pinGroup.appendChild(pinText);

        pinGroup.addEventListener('click', () => {
          if (window.UI) window.UI.showDetail(entry.id);
        });

        svg.appendChild(pinGroup);

        // 4. Build Compact Sleek Milestone Status Pill in HTML container
        const cardEl = document.createElement('div');
        cardEl.className = `milestone-pill-card ${statusClass} ${i % 2 === 0 ? 'card-stagger-left' : 'card-stagger-right'}`;
        cardEl.dataset.entryId = entry.id;

        cardEl.innerHTML = `
          <div class="milestone-pill-top">
            <div class="milestone-pill-left">
              <span class="milestone-num-badge">${milestoneNum}</span>
              <span class="milestone-date-text">${formattedDate}</span>
            </div>
            <span class="milestone-status-badge ${statusClass}">
              <span class="status-dot"></span>
              <span>${statusLabel}</span>
            </span>
          </div>
          <div class="milestone-pill-bottom">
            <span class="milestone-tag-chip">🏷️ ${tagLabel}</span>
            <span class="milestone-click-hint">Click for details ↗</span>
          </div>
        `;

        cardEl.addEventListener('click', () => {
          if (window.UI) window.UI.showDetail(entry.id);
        });

        cardEl.addEventListener('mouseenter', (e) => {
          const rect = cardEl.getBoundingClientRect();
          window.Tree.showTooltip(entry, rect.left + window.scrollX + 20, rect.top + window.scrollY - 30);
        });
        cardEl.addEventListener('mouseleave', () => {
          window.Tree.hideTooltip();
        });

        if (cardsContainer) cardsContainer.appendChild(cardEl);
      }
    },

    addBranch: function(entry, animate) {
      this.render();
    },

    toggleOtherPath: function() {
      const container = document.getElementById('tree-container');
      const btn = document.getElementById('walk-other-path-btn');
      if (container) {
        container.classList.toggle('walk-other-path');
        container.classList.toggle('tree-normal');
      }
      if (btn) btn.classList.toggle('active');
    },

    showTooltip: function(entry, x, y) {
      let tooltip = document.querySelector('.tree-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'tree-tooltip';
        document.body.appendChild(tooltip);
      }
      const emojiMap = { 'done': '✅', 'partial': '🟡', 'not-done': '❌' };
      
      tooltip.innerHTML = `
        <div class="tooltip-date">${window.UI ? window.UI.formatDate(entry.date) : entry.date}</div>
        <div class="tooltip-wanted"><span>Intended:</span> ${escapeHtml(entry.wanted || '')}</div>
        <div class="tooltip-did"><span>Traveled:</span> ${escapeHtml(entry.did || '')}</div>
        <div class="tooltip-status">${emojiMap[entry.status] || ''} <span style="font-weight: normal; font-size: 11px; text-transform: capitalize;">${entry.status || ''}</span></div>
      `;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.classList.add('visible');
    },

    hideTooltip: function() {
      const tooltip = document.querySelector('.tree-tooltip');
      if (tooltip) tooltip.classList.remove('visible');
    },

    renderHeroTree: function() {
      const svg = document.getElementById('hero-tree-svg');
      if (!svg) return;
      svg.innerHTML = '';
      svg.setAttribute('viewBox', '0 0 240 200');
      
      // Mini Winding Road on Landing Page
      const road = createSvgElement('path', {
        class: 'road-highway-bed',
        d: 'M 120 190 C 80 145, 160 100, 120 40'
      });
      road.style.strokeWidth = '24px';
      svg.appendChild(road);

      const stripe = createSvgElement('path', {
        class: 'road-center-stripe',
        d: 'M 120 190 C 80 145, 160 100, 120 40'
      });
      stripe.style.strokeWidth = '2px';
      stripe.style.strokeDasharray = '6 6';
      svg.appendChild(stripe);

      const beacon = createSvgElement('circle', {
        class: 'waypoint-beacon-core',
        cx: 120,
        cy: 40,
        r: 6
      });
      svg.appendChild(beacon);
    }
  };

  // Debounced resize handler
  window.addEventListener('resize', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (document.getElementById('tree-screen').classList.contains('active')) {
        window.Tree.render();
      }
    }, 300);
  });

})();
