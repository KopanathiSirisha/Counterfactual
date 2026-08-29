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

  // Consistent seeded random based on ID
  function seededRandom(seed) {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0;
    return function() {
      s = (s * 16807 + 0) % 2147483647;
      return (s & 0x7fffffff) / 2147483647;
    };
  }

  // Milestone Stages for the Journey Decision Map
  function getJourneyStage(entryCount) {
    if (entryCount <= 5) {
      return 'Epoch I · The Trailhead';
    } else if (entryCount <= 20) {
      return 'Epoch II · The Forking Path';
    } else if (entryCount <= 50) {
      return 'Epoch III · The Divergent Journey';
    } else {
      return 'Epoch IV · The Flourishing Journey';
    }
  }

  let debounceTimer;

  window.Tree = {
    render: async function() {
      const container = document.getElementById('tree-container');
      const svg = document.getElementById('tree-svg');
      const cardsContainer = document.getElementById('tree-cards-container');
      if (!container || !svg) return;

      const entries = window.Entries ? window.Entries.getAll() : [];
      const stageName = getJourneyStage(entries.length);

      // Update Stage Badge in Header
      const stageNameEl = document.getElementById('stage-name');
      if (stageNameEl) stageNameEl.textContent = stageName;

      // Clear containers
      svg.innerHTML = '';
      if (cardsContainer) cardsContainer.innerHTML = '';

      if (entries.length === 0) {
        if (cardsContainer) {
          cardsContainer.innerHTML = `
            <div class="tree-empty-card" style="text-align: center; max-width: 440px; margin: 3.5rem auto; padding: 2.25rem 2rem; background: var(--card); border: 1px solid var(--border); border-radius: 18px; box-shadow: 0 4px 20px var(--shadow);">
              <div style="font-size: 28px; margin-bottom: 0.75rem; color: var(--actual);">🛣️</div>
              <h3 style="font-family: var(--font-serif); font-size: 22px; margin-bottom: 0.6rem; color: var(--text);">Begin Your Journey Map</h3>
              <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.4rem;">Record what you intended to do versus what path you actually took to watch your personal life map emerge.</p>
              <button class="tree-empty-cta" id="empty-add-btn" style="padding: 10px 22px; border-radius: 24px; background: var(--actual); color: #fff; border: none; font-size: 13.5px; font-weight: 500; cursor: pointer;">+ Record Today's Decision</button>
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
      // ARTISTIC ORGANIC ROAD & BRANCHING DECISION MAP ENGINE
      // ════════════════════════════════════════════════════════════════
      const totalEntries = entries.length;
      const verticalSpacing = 160;
      const groundPadding = 60;
      const topPadding = 80;
      const totalHeight = Math.max(620, topPadding + (totalEntries * verticalSpacing) + groundPadding);
      const groundY = totalHeight - 40;
      const topY = 40;
      const svgWidth = 920;
      const centerX = svgWidth / 2;

      svg.setAttribute('viewBox', `0 0 ${svgWidth} ${totalHeight}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');

      // 1. Generate Organic Winding Road Waypoints
      const waypoints = [];
      waypoints.push({ x: centerX, y: groundY });

      for (let i = 0; i < totalEntries; i++) {
        const entry = entries[i];
        const rand = seededRandom(entry.id || String(i));
        const wpY = groundY - 90 - (i * verticalSpacing);
        // Subtle natural S-curve oscillation with slight organic imperfection
        const isLeft = (i % 2 === 0);
        const xOffset = (isLeft ? -130 : 130) + ((rand() - 0.5) * 35);
        const wpX = centerX + xOffset;
        waypoints.push({ x: wpX, y: wpY, entry, index: i, rand, isLeft });
      }
      waypoints.push({ x: centerX, y: topY });

      // Construct Smooth Organic Road Spine (Bezier Curve)
      let roadPathD = `M ${waypoints[0].x} ${waypoints[0].y}`;
      for (let w = 0; w < waypoints.length - 1; w++) {
        const curr = waypoints[w];
        const next = waypoints[w + 1];
        const midY = (curr.y + next.y) / 2;
        roadPathD += ` C ${curr.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y}`;
      }

      // Inked Painted Journey Road (No continuous highway dashed centerline)
      const roadTrack = createSvgElement('path', {
        class: 'road-track animate',
        d: roadPathD
      });
      svg.appendChild(roadTrack);

      // Subtle Environmental Route Trail Dots along the path
      for (let w = 0; w < waypoints.length; w++) {
        const wp = waypoints[w];
        const dotOffset = (w % 2 === 0 ? 45 : -45);
        const trailDot = createSvgElement('circle', {
          class: 'route-trail-marker',
          cx: wp.x + dotOffset,
          cy: wp.y - 20,
          r: 1.6
        });
        svg.appendChild(trailDot);
      }

      // 2. Render Branches, Decision Markers & Journal Memory Cards
      for (let i = 0; i < totalEntries; i++) {
        const wp = waypoints[i + 1];
        const entry = wp.entry;
        const milestoneNum = String(i + 1).padStart(2, '0');
        const formattedDate = window.UI ? window.UI.formatDate(entry.date) : entry.date;

        const cardSide = wp.isLeft ? -1 : 1; // Left or Right direction

        // 2A. Orange Branch: What Actually Happened (Solid Line)
        const actualBranchEndX = wp.x + (cardSide * 125);
        const actualBranchEndY = wp.y - 15;
        const actualBranchD = `M ${wp.x} ${wp.y} Q ${wp.x + (cardSide * 60)} ${wp.y + 5}, ${actualBranchEndX} ${actualBranchEndY}`;

        const branchActual = createSvgElement('path', {
          class: 'branch-actual animate',
          d: actualBranchD
        });
        svg.appendChild(branchActual);

        // 2B. Blue Branch: What Could Have Happened (Dashed Line)
        const altSide = -cardSide; // Opposite direction
        const altBranchEndX = wp.x + (altSide * 115);
        const altBranchEndY = wp.y - 30;
        const altBranchD = `M ${wp.x} ${wp.y} Q ${wp.x + (altSide * 55)} ${wp.y - 10}, ${altBranchEndX} ${altBranchEndY}`;

        const branchAlt = createSvgElement('path', {
          class: 'branch-alternative animate',
          d: altBranchD
        });
        svg.appendChild(branchAlt);

        // 2C. Alternative Ghost Circle (○)
        const ghostMarker = createSvgElement('g', {
          class: 'alt-ghost-marker',
          transform: `translate(${altBranchEndX}, ${altBranchEndY})`
        });
        const ghostCircle = createSvgElement('circle', {
          class: 'alt-ghost-circle',
          cx: 0,
          cy: 0,
          r: 5.5
        });
        ghostMarker.appendChild(ghostCircle);

        ghostMarker.addEventListener('mouseenter', (e) => {
          const rect = ghostMarker.getBoundingClientRect();
          window.Tree.showTooltip(entry, rect.left + window.scrollX + 15, rect.top + window.scrollY - 30);
        });
        ghostMarker.addEventListener('mouseleave', () => {
          window.Tree.hideTooltip();
        });
        ghostMarker.addEventListener('click', () => {
          if (window.UI) window.UI.showDetail(entry.id);
        });
        svg.appendChild(ghostMarker);

        // 2D. Circular Decision Marker with Milestone Number (01, 02, 03)
        const decisionMarker = createSvgElement('g', {
          class: 'decision-marker-group',
          transform: `translate(${wp.x}, ${wp.y})`
        });
        const markerHalo = createSvgElement('circle', {
          class: 'decision-marker-halo',
          cx: 0,
          cy: 0,
          r: 11
        });
        const markerBg = createSvgElement('circle', {
          class: 'decision-marker-bg',
          cx: 0,
          cy: 0,
          r: 11.5
        });
        const markerText = createSvgElement('text', {
          class: 'decision-marker-num',
          x: 0,
          y: 0
        });
        markerText.textContent = milestoneNum;

        decisionMarker.appendChild(markerHalo);
        decisionMarker.appendChild(markerBg);
        decisionMarker.appendChild(markerText);

        decisionMarker.addEventListener('mouseenter', (e) => {
          const rect = decisionMarker.getBoundingClientRect();
          window.Tree.showTooltip(entry, rect.left + window.scrollX + 20, rect.top + window.scrollY - 30);
        });
        decisionMarker.addEventListener('mouseleave', () => {
          window.Tree.hideTooltip();
        });
        decisionMarker.addEventListener('click', () => {
          if (window.UI) window.UI.showDetail(entry.id);
        });
        svg.appendChild(decisionMarker);

        // 3. Build Journal Memory Card with 3-Tier Visual Hierarchy
        // Hierarchy: Date (small) -> Main Decision (large) -> Counterfactual (smaller & italic)
        const cardEl = document.createElement('div');
        cardEl.className = `journal-memory-card ${wp.isLeft ? 'card-stagger-left' : 'card-stagger-right'}`;
        cardEl.dataset.entryId = entry.id;

        const rawDid = entry.did || 'No action recorded';
        const rawWanted = entry.wanted || 'No intention recorded';

        cardEl.innerHTML = `
          <div class="card-date-header">
            <span>${milestoneNum} · ${formattedDate}</span>
          </div>
          <div class="card-decision-title">
            <span class="card-decision-prefix">I chose to:</span>
            "${escapeHtml(rawDid)}"
          </div>
          <div class="card-counterfactual-text">
            Instead: "${escapeHtml(rawWanted)}"
          </div>
        `;

        cardEl.addEventListener('click', () => {
          if (window.UI) window.UI.showDetail(entry.id);
        });

        cardEl.addEventListener('mouseenter', (e) => {
          const rect = cardEl.getBoundingClientRect();
          window.Tree.showTooltip(entry, rect.left + window.scrollX + 20, rect.top + window.scrollY - 30);
          branchAlt.style.opacity = '1';
          branchAlt.style.strokeWidth = '3px';
        });
        cardEl.addEventListener('mouseleave', () => {
          window.Tree.hideTooltip();
          if (!container.classList.contains('walk-other-path')) {
            branchAlt.style.opacity = '0.8';
            branchAlt.style.strokeWidth = '2.2px';
          }
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
      if (btn) {
        const isAlt = container && container.classList.contains('walk-other-path');
        btn.classList.toggle('active', isAlt);
        btn.textContent = isAlt ? '← Back to actual path' : 'Explore alternate path →';
      }
    },

    showTooltip: function(entry, x, y) {
      let tooltip = document.querySelector('.tree-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'tree-tooltip';
        document.body.appendChild(tooltip);
      }
      const statusLabel = entry.status === 'done' ? 'Completed' : (entry.status === 'partial' ? 'Detour' : 'Roadblock');
      
      tooltip.innerHTML = `
        <div class="tooltip-date">${window.UI ? window.UI.formatDate(entry.date) : entry.date}</div>
        <div class="tooltip-did"><strong>Actual:</strong> "${escapeHtml(entry.did || 'No action recorded')}"</div>
        <div class="tooltip-wanted"><strong>Alternative:</strong> "${escapeHtml(entry.wanted || 'No intention recorded')}"</div>
        <div class="tooltip-status">✦ ${statusLabel}</div>
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
      svg.setAttribute('viewBox', '0 0 240 180');
      
      // Mini Illustrated Inked Road on Landing Page
      const road = createSvgElement('path', {
        class: 'road-track animate',
        d: 'M 120 165 C 120 125, 75 105, 80 65 C 85 35, 140 30, 155 15'
      });
      road.style.strokeWidth = '12px';
      svg.appendChild(road);

      // Orange actual branch
      const branchOrange = createSvgElement('path', {
        class: 'branch-actual animate',
        d: 'M 80 65 Q 115 55, 140 45'
      });
      svg.appendChild(branchOrange);

      // Blue alternative branch
      const branchBlue = createSvgElement('path', {
        class: 'branch-alternative animate',
        d: 'M 80 65 Q 45 60, 30 75'
      });
      svg.appendChild(branchBlue);

      // Markers
      const m1 = createSvgElement('circle', {
        class: 'decision-marker-bg',
        cx: 80, cy: 65, r: 8.5
      });
      const t1 = createSvgElement('text', {
        class: 'decision-marker-num',
        x: 80, y: 65
      });
      t1.textContent = '01';
      t1.style.fontSize = '7.5px';

      const ghost = createSvgElement('circle', {
        class: 'alt-ghost-circle',
        cx: 30, cy: 75, r: 4.5
      });

      svg.appendChild(m1);
      svg.appendChild(t1);
      svg.appendChild(ghost);
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
