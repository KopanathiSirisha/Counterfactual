(function() {
  'use strict';

  let currentEntryId = null;

  window.UI = {
    _currentPhotoData: null,

    navigateTo: function(screenId) {
      // Hide all screens
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const target = document.getElementById(screenId);
      if (target) {
        target.classList.add('active');
        target.style.opacity = '0';
        target.style.transform = 'translateY(12px)';
        requestAnimationFrame(() => {
          target.style.transition = 'opacity 500ms ease, transform 500ms ease';
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        });
      }
      
      // Update nav states
      document.querySelectorAll('#main-nav a, #main-nav button').forEach(el => el.classList.remove('active'));
      const navItem = document.querySelector(`#main-nav [data-target="${screenId}"]`) || document.getElementById(`nav-${screenId.split('-')[0]}`);
      if(navItem) navItem.classList.add('active');

      // Trigger respective render logic
      if (screenId === 'tree-screen' && window.Tree) window.Tree.render();
      if (screenId === 'dashboard-screen' && window.Insights) window.Insights.renderDashboard();
      
      // Close mobile navigation
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) navLinks.classList.remove('open');
    },

    showEntryForm: function() {
      this.navigateTo('entry-screen');
      document.getElementById('entry-form').reset();
      
      const today = new Date().toISOString().split('T')[0];
      const dateInput = document.getElementById('entry-date');
      if(dateInput) dateInput.value = today;
      
      const dateDisplay = document.getElementById('entry-date-display');
      if(dateDisplay) dateDisplay.textContent = this.formatDate(today);
      
      const idInput = document.getElementById('entry-id');
      if(idInput) idInput.value = '';
      
      document.querySelectorAll('.status-option').forEach(el => el.classList.remove('selected'));
      document.querySelectorAll('.tag-pill').forEach(el => el.classList.remove('selected'));
      
      const intensityInput = document.getElementById('entry-intensity');
      if(intensityInput) intensityInput.value = 3;
      const intensityVal = document.getElementById('intensity-value');
      if(intensityVal) intensityVal.textContent = 3;
      
      const preview = document.getElementById('photo-preview');
      if(preview) preview.innerHTML = '';
      
      this._currentPhotoData = null;
    },

    editEntry: async function(id) {
      const entry = window.Entries ? window.Entries.getById(id) : null;
      if (!entry) return;
      
      this.navigateTo('entry-screen');
      
      document.getElementById('entry-id').value = entry.id;
      document.getElementById('entry-date').value = entry.date;
      document.getElementById('entry-date-display').textContent = this.formatDate(entry.date);
      document.getElementById('entry-wanted').value = entry.wanted || '';
      document.getElementById('entry-did').value = entry.did || '';
      
      document.querySelectorAll('.status-option').forEach(el => {
        el.classList.remove('selected');
        const input = el.querySelector('input');
        if (input && input.value === entry.status) {
          el.classList.add('selected');
          input.checked = true;
        }
      });
      
      document.querySelectorAll('.tag-pill').forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.tag === entry.tag) el.classList.add('selected');
      });
      
      const intensityInput = document.getElementById('entry-intensity');
      if(intensityInput) intensityInput.value = entry.intensity || 3;
      const intensityVal = document.getElementById('intensity-value');
      if(intensityVal) intensityVal.textContent = entry.intensity || 3;
      
      const preview = document.getElementById('photo-preview');
      if(preview) preview.innerHTML = '';
      this._currentPhotoData = null;

      if (entry.photoId && window.Storage) {
        const dataUrl = await window.Storage.getPhoto(entry.photoId);
        if (dataUrl) {
          const img = document.createElement('img');
          img.src = dataUrl;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '50%';
          preview.appendChild(img);
        }
      }
    },

    showDetail: async function(entryId) {
      const entry = window.Entries ? window.Entries.getById(entryId) : null;
      if (!entry) return;
      currentEntryId = entryId;
      
      document.getElementById('modal-date').textContent = this.formatDate(entry.date);
      document.getElementById('modal-wanted').textContent = entry.wanted;
      document.getElementById('modal-did').textContent = entry.did;
      
      const emojiMap = { 'done': '✅', 'partial': '🟡', 'not-done': '❌' };
      document.getElementById('modal-status').textContent = `${emojiMap[entry.status] || ''} ${entry.status || ''}`;
      
      const tagEl = document.getElementById('modal-tag');
      if(tagEl) tagEl.textContent = (entry.tag || '').charAt(0).toUpperCase() + (entry.tag || '').slice(1);
      
      document.getElementById('modal-intensity').textContent = '⚡'.repeat(entry.intensity || 3);
      
      const photoEl = document.getElementById('modal-photo');
      if(photoEl) {
        photoEl.innerHTML = '';
        if (entry.photoId && window.Storage) {
          const dataUrl = await window.Storage.getPhoto(entry.photoId);
          if (dataUrl) {
            photoEl.innerHTML = `
              <div class="modal-framed-photo">
                <div class="modal-frame-tape"></div>
                <img src="${dataUrl}" alt="Daily Memory" class="modal-frame-img" />
              </div>
            `;
            photoEl.style.display = 'block';
          } else {
            photoEl.style.display = 'none';
          }
        } else {
          photoEl.style.display = 'none';
        }
      }
      
      const modal = document.getElementById('detail-modal');
      if(modal) modal.classList.add('active', 'visible');
    },

    hideDetail: function() {
      const modal = document.getElementById('detail-modal');
      if(modal) {
        modal.classList.remove('active', 'visible');
      }
      currentEntryId = null;
    },

    handleSave: async function() {
      const btn = document.getElementById('save-btn');
      const id = document.getElementById('entry-id').value;
      const date = document.getElementById('entry-date').value;
      const wanted = document.getElementById('entry-wanted').value.trim();
      const did = document.getElementById('entry-did').value.trim();
      const statusEl = document.querySelector('input[name="status"]:checked');
      const status = statusEl ? statusEl.value : null;
      const tagEl = document.querySelector('.tag-pill.selected');
      const tag = tagEl ? tagEl.dataset.tag : null;
      const intensityInput = document.getElementById('entry-intensity');
      const intensity = intensityInput ? parseInt(intensityInput.value) : 3;
      
      if (!date || !wanted || !did || !status || !tag) {
        this.showToast('Please fill in all required fields', 'error');
        return;
      }
      
      if(btn) {
        btn.textContent = 'Saving...';
        btn.classList.add('save-saving');
        btn.disabled = true;
      }
      
      let photoId = null;
      if (this._currentPhotoData && window.Storage) {
        photoId = crypto.randomUUID();
        await window.Storage.savePhoto(photoId, this._currentPhotoData);
      }
      
      if (id) {
        const existing = window.Entries.getById(id);
        if (existing && existing.photoId && photoId && window.Storage) {
          await window.Storage.deletePhoto(existing.photoId);
        }
        window.Entries.update(id, { 
          date, wanted, did, status, tag, intensity, 
          photoId: photoId || (existing ? existing.photoId : null) 
        });
      } else {
        window.Entries.create({ date, wanted, did, status, tag, intensity, photoId });
      }
      
      await new Promise(r => setTimeout(r, 400));
      if(btn) {
        btn.textContent = '✓ Saved';
        btn.classList.remove('save-saving');
      }
      
      await new Promise(r => setTimeout(r, 600));
      if(btn) {
        btn.textContent = 'Save Day';
        btn.disabled = false;
      }
      this._currentPhotoData = null;
      
      this.navigateTo('tree-screen');
    },

    handlePhotoSelect: function(file) {
      if (!file || !file.type.startsWith('image/')) {
        this.showToast('Please select a valid image file', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Image must be less than 5MB', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this._currentPhotoData = e.target.result;
        const preview = document.getElementById('photo-preview');
        if(preview) {
          preview.innerHTML = '';
          const img = document.createElement('img');
          img.src = this._currentPhotoData;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '50%';
          preview.appendChild(img);
        }
      };
      reader.readAsDataURL(file);
    },

    setupListeners: function() {
      const bind = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
      };

      bind('start-btn', 'click', () => this.showEntryForm());
      bind('add-entry-btn', 'click', () => this.showEntryForm());
      
      bind('nav-home', 'click', (e) => { e.preventDefault(); this.navigateTo('home-screen'); });
      bind('nav-tree', 'click', (e) => { e.preventDefault(); this.navigateTo('tree-screen'); });
      bind('nav-dashboard', 'click', (e) => { e.preventDefault(); this.navigateTo('dashboard-screen'); });
      
      bind('nav-toggle', 'click', () => {
        const links = document.querySelector('.nav-links');
        if(links) links.classList.toggle('open');
      });
      
      bind('save-btn', 'click', (e) => { e.preventDefault(); this.handleSave(); });
      bind('cancel-btn', 'click', (e) => {
        e.preventDefault();
        const entries = window.Entries ? window.Entries.getAll() : [];
        if (entries.length > 0) this.navigateTo('tree-screen');
        else this.navigateTo('home-screen');
      });
      
      bind('entry-form', 'submit', (e) => { e.preventDefault(); this.handleSave(); });
      
      bind('entry-date', 'change', (e) => {
        const display = document.getElementById('entry-date-display');
        if(display) display.textContent = this.formatDate(e.target.value);
      });
      
      document.querySelectorAll('.status-option').forEach(opt => {
        opt.addEventListener('click', () => {
          document.querySelectorAll('.status-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          const input = opt.querySelector('input');
          if(input) input.checked = true;
        });
      });
      
      document.querySelectorAll('.tag-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('selected'));
          pill.classList.add('selected');
        });
      });
      
      bind('entry-intensity', 'input', (e) => {
        const val = document.getElementById('intensity-value');
        if(val) val.textContent = e.target.value;
      });
      
      bind('photo-drop-zone', 'click', () => {
        const input = document.getElementById('photo-upload');
        if(input) input.click();
      });
      
      bind('photo-upload', 'change', (e) => {
        if(e.target.files && e.target.files[0]) {
          this.handlePhotoSelect(e.target.files[0]);
        }
      });
      
      const dropZone = document.getElementById('photo-drop-zone');
      if(dropZone) {
        dropZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropZone.style.borderColor = 'var(--accent)';
        });
        dropZone.addEventListener('dragleave', () => {
          dropZone.style.borderColor = 'var(--border)';
        });
        dropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropZone.style.borderColor = 'var(--border)';
          if(e.dataTransfer.files && e.dataTransfer.files[0]) {
            this.handlePhotoSelect(e.dataTransfer.files[0]);
          }
        });
      }
      
      bind('modal-close', 'click', () => this.hideDetail());
      
      const detailModal = document.getElementById('detail-modal');
      if (detailModal) {
        detailModal.addEventListener('click', (e) => {
          if (e.target === detailModal) this.hideDetail();
        });
      }
      
      bind('modal-edit-btn', 'click', () => {
        if(currentEntryId) {
          this.hideDetail();
          this.editEntry(currentEntryId);
        }
      });
      
      bind('modal-delete-btn', 'click', () => {
        if(currentEntryId && window.Entries) {
          if(confirm('Are you sure you want to delete this entry?')) {
            window.Entries.delete(currentEntryId);
            this.hideDetail();
          }
        }
      });
      
      bind('walk-other-path-btn', 'click', () => {
        if(window.Tree) window.Tree.toggleOtherPath();
      });

      // Time-Adaptive Mood Selector Buttons
      document.querySelectorAll('.time-mood-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const mood = btn.dataset.time;
          this.setTimeMood(mood);
        });
      });
    },

    TIME_THEMES: {
      morning: {
        key: 'morning',
        name: 'Morning Sky',
        icon: '🌅',
        badge: '🌅 Morning Reflection',
        greeting: 'Hello there! Good morning, have a nice day 🌱',
        quote: '“Every morning brings a new seed of intention. Water it with action.”',
        entryPill: '🌅 Morning Reflection',
        entryMsg: 'What intentions will you plant this morning?'
      },
      afternoon: {
        key: 'afternoon',
        name: 'Afternoon Sun',
        icon: '☀️',
        badge: '☀️ Afternoon Focus',
        greeting: 'Good afternoon! Keep the momentum flowing 🌻',
        quote: '“The sun reaches its height; let your actions reflect your highest goals.”',
        entryPill: '☀️ Afternoon Journal',
        entryMsg: 'How is your afternoon journey unfolding?'
      },
      evening: {
        key: 'evening',
        name: 'Sunset Twilight',
        icon: '🌇',
        badge: '🌇 Evening Reflection',
        greeting: 'Good evening! Take a restful moment to reflect 🌇',
        quote: '“As twilight settles in, celebrate both what you wanted and what you achieved.”',
        entryPill: '🌇 Evening Review',
        entryMsg: 'Pause and record your evening reflection.'
      },
      night: {
        key: 'night',
        name: 'Starry Night',
        icon: '🌌',
        badge: '🌌 Night Meditation',
        greeting: 'Peaceful night! Rest well under the quiet stars 🌌✨',
        quote: '“Under the calm canopy of stars, every thought prepares for tomorrow’s sunrise.”',
        entryPill: '🌌 Night Meditation',
        entryMsg: 'Rest your mind and capture your daily reflections.'
      }
    },

    setTimeMood: function(mood) {
      const actualMood = (mood === 'auto') ? this.getAutomaticTimeMood() : mood;
      document.body.classList.remove('time-morning', 'time-afternoon', 'time-evening', 'time-night');
      document.body.classList.add(`time-${actualMood}`);
      
      document.querySelectorAll('.time-mood-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.time === mood);
      });
      
      localStorage.setItem('cf-time-mood', mood);

      // Update Dynamic Greetings & Quotes across screens
      const theme = this.TIME_THEMES[actualMood] || this.TIME_THEMES.morning;
      
      // Home screen greeting & quote
      const heroBadge = document.getElementById('hero-time-badge');
      const heroGreeting = document.getElementById('hero-greeting');
      const heroQuote = document.getElementById('hero-quote');
      if (heroBadge) heroBadge.textContent = theme.badge;
      if (heroGreeting) heroGreeting.textContent = theme.greeting;
      if (heroQuote) heroQuote.textContent = theme.quote;

      // Entry screen greeting
      const entryPill = document.getElementById('entry-time-pill');
      const entryMsg = document.getElementById('entry-greeting-msg');
      if (entryPill) entryPill.textContent = theme.entryPill;
      if (entryMsg) entryMsg.textContent = theme.entryMsg;

      // Tree screen time badge
      const treeTimeIcon = document.getElementById('tree-time-icon');
      const treeTimeText = document.getElementById('tree-time-text');
      if (treeTimeIcon) treeTimeIcon.textContent = theme.icon;
      if (treeTimeText) treeTimeText.textContent = theme.name;

      // Re-render hero tree if on home screen
      const homeScreen = document.getElementById('home-screen');
      if (window.Tree && homeScreen && homeScreen.classList.contains('active')) {
        window.Tree.renderHeroTree();
      }
    },

    getAutomaticTimeMood: function() {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;

      // 6:00 AM (360 mins) to 11:59 AM (719 mins) -> Morning
      if (totalMinutes >= 360 && totalMinutes < 720) {
        return 'morning';
      }
      // 12:00 PM (720 mins) to 4:00 PM (960 mins) -> Afternoon
      else if (totalMinutes >= 720 && totalMinutes < 960) {
        return 'afternoon';
      }
      // 4:00 PM (960 mins) to 7:00 PM (1140 mins) -> Evening
      else if (totalMinutes >= 960 && totalMinutes < 1140) {
        return 'evening';
      }
      // 7:00 PM (1140 mins) to 6:00 AM (360 mins) -> Night
      else {
        return 'night';
      }
    },

    initTimeMood: function() {
      const savedMood = localStorage.getItem('cf-time-mood') || 'auto';
      this.setTimeMood(savedMood);
    },

    formatDate: function(dateString) {
      if(!dateString) return '';
      const d = new Date(dateString + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
    },

    showToast: function(message, type) {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.backgroundColor = type === 'error' ? 'var(--not-done)' : 'var(--done)';
      toast.style.color = 'white';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '20px';
      toast.style.zIndex = '9999';
      toast.style.opacity = '1';
      toast.style.transition = 'opacity 0.3s ease';
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  };
})();
