(function() {
  'use strict';

  window.App = {
    init: async function() {
      // 1. Initialize storage (IndexedDB)
      if(window.Storage) await window.Storage.init();
      
      // 2. Setup ambient floating seed motes
      const particleContainer = document.getElementById('ambient-particles');
      if (particleContainer && particleContainer.children.length === 0) {
        const count = 18;
        for (let i = 0; i < count; i++) {
          const mote = document.createElement('div');
          mote.className = 'seed-mote';
          const size = 3 + Math.random() * 4.5;
          const left = Math.random() * 100;
          const duration = 14 + Math.random() * 18;
          const delay = Math.random() * 20;
          
          mote.style.width = `${size}px`;
          mote.style.height = `${size}px`;
          mote.style.left = `${left}%`;
          mote.style.animationDuration = `${duration}s`;
          mote.style.animationDelay = `-${delay}s`;
          
          particleContainer.appendChild(mote);
        }
      }

      // 3. Setup all UI event listeners & Time-Adaptive Lighting
      if(window.UI) {
        window.UI.setupListeners();
        window.UI.initTimeMood();
      }
      
      // 4. Render hero tree on home page
      if(window.Tree) window.Tree.renderHeroTree();
      
      // 4. Determine initial screen
      const entries = window.Entries ? window.Entries.getAll() : [];
      if (entries.length > 0) {
        // If entries exist, show tree by default
        if(window.UI) window.UI.navigateTo('tree-screen');
      } else {
        // First time user, show home
        if(window.UI) window.UI.navigateTo('home-screen');
      }
      
      // 5. Add entrance animations to nav
      const nav = document.getElementById('main-nav');
      if (nav) nav.classList.add('animate-fade-up');
      
      // 6. Footer intersection observer
      const footer = document.getElementById('main-footer');
      if (footer) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              footer.classList.add('animate-fade-up');
              observer.unobserve(footer);
            }
          });
        }, { threshold: 0.1 });
        observer.observe(footer);
      }
      
      // 7. Listen for entry events to update views
      document.addEventListener('entry-created', (e) => {
        const treeScreen = document.getElementById('tree-screen');
        if (treeScreen && treeScreen.classList.contains('active') && window.Tree) {
          window.Tree.render();
        }
      });
      
      document.addEventListener('entry-updated', () => {
        const treeScreen = document.getElementById('tree-screen');
        if (treeScreen && treeScreen.classList.contains('active') && window.Tree) {
          window.Tree.render();
        }
      });
      
      document.addEventListener('entry-deleted', () => {
        const treeScreen = document.getElementById('tree-screen');
        if (treeScreen && treeScreen.classList.contains('active') && window.Tree) {
          window.Tree.render();
        }
        const dashboardScreen = document.getElementById('dashboard-screen');
        if (dashboardScreen && dashboardScreen.classList.contains('active') && window.Insights) {
          window.Insights.renderDashboard();
        }
      });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
  });
})();
