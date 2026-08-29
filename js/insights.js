'use strict';

(function(global) {
  /**
   * Insights module calculating stats and updating dashboard UI.
   * @namespace Insights
   */
  const Insights = {
    /**
     * Calculate all insights from current entries
     * @returns {Object} InsightsData
     */
    calculate: function() {
      const entries = global.Entries ? global.Entries.getAll() : [];
      const totalDays = entries.length;
      
      if (totalDays === 0) {
        return {
          totalDays: 0,
          completed: 0,
          partial: 0,
          notDone: 0,
          completionRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          mostCommonTag: 'N/A',
          mostSuccessfulTag: 'N/A',
          almostDoneDays: 0,
          mostActiveDay: 'N/A',
          tagDistribution: [],
          recentTrend: 'steady',
          weeklyCompletion: []
        };
      }

      const completed = entries.filter(e => e.status === 'done').length;
      const partial = entries.filter(e => e.status === 'partial').length;
      const notDone = entries.filter(e => e.status === 'not-done').length;
      const completionRate = Math.round((completed / totalDays) * 100);

      // Tags
      const tagCounts = entries.reduce((acc, e) => {
        acc[e.tag] = (acc[e.tag] || 0) + 1;
        return acc;
      }, {});
      const mostCommonTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      const tags = Object.keys(tagCounts);
      const tagSuccess = tags.map(tag => {
        const tagEntries = entries.filter(e => e.tag === tag);
        const doneCount = tagEntries.filter(e => e.status === 'done').length;
        return { tag, rate: doneCount / tagEntries.length };
      }).sort((a, b) => b.rate - a.rate);
      const mostSuccessfulTag = tagSuccess[0]?.tag || 'N/A';

      const tagDistribution = tags.map(tag => ({
        tag,
        count: tagCounts[tag],
        percentage: Math.round((tagCounts[tag] / totalDays) * 100)
      })).sort((a, b) => b.count - a.count);

      // Days
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayCounts = entries.reduce((acc, e) => {
        const day = new Date(e.date).getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});
      const mostActiveDayIndex = parseInt(Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '0', 10);
      const mostActiveDay = daysOfWeek[mostActiveDayIndex];

      // Streak calculation
      const sortedDesc = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
      let longestStreak = 0;
      let actualCurrentStreak = 0;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const latestEntryDate = sortedDesc.length > 0 ? new Date(sortedDesc[0].date) : null;
      
      if (latestEntryDate) {
          latestEntryDate.setHours(0,0,0,0);
          const daysSinceLatest = Math.ceil(Math.abs(today - latestEntryDate) / (1000 * 60 * 60 * 24));
          if (daysSinceLatest <= 1) {
              actualCurrentStreak = 1;
              let checkDate = new Date(latestEntryDate);
              for (let i = 1; i < sortedDesc.length; i++) {
                  const prevDate = new Date(sortedDesc[i].date);
                  prevDate.setHours(0,0,0,0);
                  const diff = Math.ceil((checkDate - prevDate) / (1000 * 60 * 60 * 24));
                  if (diff === 1) {
                      actualCurrentStreak++;
                      checkDate = prevDate;
                  } else if (diff > 1) {
                      break;
                  }
              }
          }
      }

      // Calculate longest streak properly by iterating all
      let tempStreak = 0;
      let lastDate = null;
      for (const entry of sortedDesc) {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        
        if (!lastDate) {
          tempStreak = 1;
        } else {
          const diffDays = Math.ceil(Math.abs(lastDate - entryDate) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 1;
          }
        }
        lastDate = entryDate;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;

      // Trend
      const last14 = sortedDesc.slice(0, 14);
      let recentTrend = 'steady';
      if (last14.length >= 7) {
        const recent7 = last14.slice(0, 7);
        const prev7 = last14.slice(7, 14);
        
        const scoreEntry = e => (e.status === 'done' ? 1 : e.status === 'partial' ? 0.5 : 0);
        
        const recentAvg = recent7.reduce((sum, e) => sum + scoreEntry(e), 0) / recent7.length;
        const prevAvg = prev7.length > 0 ? prev7.reduce((sum, e) => sum + scoreEntry(e), 0) / prev7.length : recentAvg;
        
        if (recentAvg > prevAvg + 0.1) recentTrend = 'improving';
        else if (recentAvg < prevAvg - 0.1) recentTrend = 'declining';
      }

      // Weekly completion
      const recent7ForGraph = sortedDesc.slice(0, 7).reverse();
      const weeklyCompletion = recent7ForGraph.map(e => e.status === 'done' ? 1 : e.status === 'partial' ? 0.5 : 0);

      return {
        totalDays,
        completed,
        partial,
        notDone,
        completionRate,
        currentStreak: actualCurrentStreak,
        longestStreak: Math.max(actualCurrentStreak, longestStreak),
        mostCommonTag,
        mostSuccessfulTag,
        almostDoneDays: partial,
        mostActiveDay,
        tagDistribution,
        recentTrend,
        weeklyCompletion
      };
    },

    /**
     * Animate number count-up effect
     * @param {HTMLElement} element 
     * @param {number} target 
     * @param {number} duration 
     */
    animateCountUp: function(element, target, duration = 800) {
      if (!element) return;
      const start = performance.now();
      const initial = 0;
      function update(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(initial + (target - initial) * eased);
        element.textContent = current;
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
      }
      requestAnimationFrame(update);
    },

    /**
     * Render the dashboard section
     */
    renderDashboard: function() {
      const data = this.calculate();
      
      const safeAnimate = (selector, target, isPercentage = false) => {
        const el = document.querySelector(selector);
        if (el) {
          if (isPercentage) {
            const start = performance.now();
            function update(timestamp) {
                const elapsed = timestamp - start;
                const progress = Math.min(elapsed / 800, 1);
                const eased = 1 - Math.pow(1 - progress, 4);
                const current = Math.round(0 + (target - 0) * eased);
                el.textContent = current + '%';
                if (progress < 1) requestAnimationFrame(update);
                else el.textContent = target + '%';
            }
            requestAnimationFrame(update);
          } else {
            this.animateCountUp(el, target);
          }
        }
      };

      safeAnimate('#total-days', data.totalDays);
      safeAnimate('#completed-count', data.completed);
      safeAnimate('#partial-count', data.partial);
      safeAnimate('#notdone-count', data.notDone);
      safeAnimate('#current-streak', data.currentStreak);
      safeAnimate('#completion-pct', data.completionRate, true);

      const barFill = document.querySelector('#completion-bar .bar-fill');
      if (barFill) {
        barFill.style.width = `${data.completionRate}%`;
        barFill.style.transition = 'width 0.8s ease-out';
      }

      const commonTagEl = document.querySelector('#common-tag');
      if (commonTagEl) commonTagEl.textContent = data.mostCommonTag;

      // Recent entries
      const recentList = document.querySelector('#recent-entries');
      if (recentList && global.Entries) {
        const entries = global.Entries.getAll();
        const recent = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        
        recentList.innerHTML = '';
        recent.forEach(entry => {
          const div = document.createElement('div');
          div.className = 'recent-entry';
          
          let color = '#736E65';
          if (entry.status === 'done') color = '#5A8362';
          if (entry.status === 'partial') color = '#D6A845';
          if (entry.status === 'not-done') color = '#B85B5B';

          const text = entry.wanted.length > 40 ? entry.wanted.substring(0, 40) + '...' : entry.wanted;

          div.innerHTML = `
            <div style="font-size: 0.8em; color: var(--text-secondary); font-weight: 500;">${entry.date}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${color}; flex-shrink: 0; box-shadow: 0 0 4px ${color}88;"></span>
              <span>${text}</span>
            </div>
          `;
          recentList.appendChild(div);
        });
      }

      // Insight text blocks
      const insightsContainer = document.querySelector('#insights-container');
      if (insightsContainer && data.totalDays > 0) {
        let stageName = 'The Sprout 🌱';
        if (data.totalDays > 50) stageName = 'The Flourishing Canopy 👑🌳';
        else if (data.totalDays > 20) stageName = 'The Young Tree 🌳';
        else if (data.totalDays > 5) stageName = 'The Sapling 🌿';

        const insights = [
          `Growth Stage: Your tree has grown into ${stageName}`,
          `You completed ${data.completionRate}% of your recorded intentions.`,
          `Most common category: ${data.mostCommonTag}`,
          `Most successful category: ${data.mostSuccessfulTag}`,
          `You had ${data.almostDoneDays} 'almost done' days.`,
          `Your most active day: ${data.mostActiveDay}`
        ];

        if (data.recentTrend === 'improving') {
          insights.push('Your last few entries show a higher completion rate.');
        }

        insightsContainer.innerHTML = insights.map(text => `<p class="insight-text">${text}</p>`).join('');
      } else if (insightsContainer) {
        insightsContainer.innerHTML = '<p class="insight-text">Plant seeds by creating your first entry to see insights.</p>';
      }
    }
  };

  global.Insights = Insights;
})(window);
