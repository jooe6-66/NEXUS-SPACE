/* CATALOG LOGIC */

(function () {
  const rooms = [
    {
      id: 'R01',
      name: 'Dyna',
      capacity: 4,
      status: 'available',
      size: '24 m²',
      floor: 'Lantai 2',
      price: { hourly: 150000, halfDay: 550000, fullDay: 900000 },
      facilities: ['Proyektor', 'Whiteboard', 'AC', 'WiFi', 'Papan Tulis'],
      gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    },
    {
      id: 'R02',
      name: 'Mebius',
      capacity: 6,
      status: 'available',
      size: '32 m²',
      floor: 'Lantai 2',
      price: { hourly: 200000, halfDay: 750000, fullDay: 1200000 },
      facilities: ['Proyektor', 'TV 55"', 'AC', 'WiFi', 'Soundsystem', 'Telepon'],
      gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    },
    {
      id: 'R03',
      name: 'Cosmos',
      capacity: 8,
      status: 'available',
      size: '40 m²',
      floor: 'Lantai 3',
      price: { hourly: 250000, halfDay: 950000, fullDay: 1600000 },
      facilities: ['Proyektor', 'Whiteboard', 'AC', 'WiFi', 'Video Conference', 'Loker'],
      gradient: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
    },
    {
      id: 'R04',
      name: 'Hikari',
      capacity: 10,
      status: 'available',
      size: '52 m²',
      floor: 'Lantai 3',
      price: { hourly: 350000, halfDay: 1300000, fullDay: 2200000 },
      facilities: ['Dual Proyektor', 'AC', 'WiFi', 'Video Conference', 'Telepon', 'Mini Bar'],
      gradient: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    },
    {
      id: 'R05',
      name: 'Saga',
      capacity: 12,
      status: 'available',
      size: '64 m²',
      floor: 'Lantai 4',
      price: { hourly: 450000, halfDay: 1700000, fullDay: 2800000 },
      facilities: ['Proyektor', 'TV 75"', 'AC', 'WiFi', 'Soundsystem', 'Video Conference', 'Katering'],
      gradient: 'linear-gradient(135deg, #fff1f2 0%, #fecdd3 100%)',
    },
    {
      id: 'R06',
      name: 'Ultra',
      capacity: 20,
      status: 'available',
      size: '96 m²',
      floor: 'Lantai 5',
      price: { hourly: 600000, halfDay: 2200000, fullDay: 3800000 },
      facilities: ['Dual Proyektor', 'Stage', 'AC', 'WiFi', 'Soundsystem', 'Video Conference', 'Live Streaming', 'Katering', 'Parkir VIP'],
      gradient: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
    },
  ];
  (function syncStatusFromBookings() {
    try {
      const bookings = JSON.parse(localStorage.getItem('nexus-bookings') || '[]');
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const nowMins = d.getHours() * 60 + d.getMinutes();

      const occupiedIds = new Set();
      const reservedIds = new Set();

      bookings
        .filter(b => b.date === today)
        .forEach(b => {
          const [h, m]   = b.startTime.split(':').map(Number);
          const startMin = h * 60 + m;
          const endMin   = startMin + (parseInt(b.duration) * 60);
          if (nowMins >= startMin && nowMins < endMin) {
            occupiedIds.add(b.roomId);
          } else if (nowMins < startMin) {
            reservedIds.add(b.roomId);
          }
        });

      rooms.forEach(r => {
        if (occupiedIds.has(r.id)) {
          r.status = 'occupied';
        } else if (reservedIds.has(r.id)) {
          r.status = 'reserved';
        } else {
          r.status = 'available';
        }
      });
    } catch {
    }
  })();

  let activeFilter   = 'all';
  let activeCapacity = 'all';
  let searchQuery    = '';

  const grid      = document.getElementById('catalogGrid');
  const emptyEl   = document.getElementById('catalogEmpty');
  const countEl   = document.getElementById('filterCount');
  const rp = n => 'Rp ' + n.toLocaleString('id-ID');
  function renderCards() {
    const filtered = rooms.filter(room => {
      const matchStatus = activeFilter === 'all' || room.status === activeFilter;

      const matchCapacity =
        activeCapacity === 'all'    ? true :
        activeCapacity === 'small'  ? room.capacity <= 6 :
        activeCapacity === 'medium' ? room.capacity >= 7 && room.capacity <= 12 :
                                      room.capacity >= 13;

      const matchSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          room.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchCapacity && matchSearch;
    });

    grid.innerHTML = '';

    if (filtered.length === 0) {
      emptyEl.classList.add('show');
      countEl.textContent = '0 ruangan ditemukan';
      return;
    }

    emptyEl.classList.remove('show');
    countEl.textContent = `${filtered.length} ruangan ditemukan`;

    const statusLabel = { available: 'Tersedia', occupied: 'Digunakan', reserved: 'Direservasi' };
    const statusClass = { available: 'status--available', occupied: 'status--occupied', reserved: 'status--reserved' };

    filtered.forEach((room, i) => {
      const isAvailable = room.status === 'available';

      const visibleFacilities = room.facilities.slice(0, 3);
      const extraCount        = room.facilities.length - 3;
      const facilitiesHTML    = visibleFacilities.map(f =>
        `<span class="facility-chip">${f}</span>`
      ).join('') + (extraCount > 0 ? `<span class="facility-chip facility-chip--more">+${extraCount}</span>` : '');

      const bookBtnHTML = isAvailable
        ? `<a href="booking.html?room=${room.id}" class="room-card__btn-book">
             <i class="ti ti-calendar-plus" aria-hidden="true"></i> Booking
           </a>`
        : `<span class="room-card__btn-book room-card__btn-book--disabled">
             <i class="ti ti-lock" aria-hidden="true"></i> ${statusLabel[room.status]}
           </span>`;

      const card = document.createElement('div');
      card.setAttribute('role', 'listitem');
      card.className = 'room-card';
      card.style.animationDelay = `${i * 60}ms`;
      card.dataset.roomId = room.id;

      card.innerHTML = `
        <div class="room-card__photo">
          <img
            src="images/rooms/room-${room.id.toLowerCase()}.jpg"
            alt="Foto Ruang ${room.name}"
            class="room-card__img"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div class="room-card__photo-bg" style="background:${room.gradient}; display:none;">
            <i class="ti ti-door room-card__photo-icon" aria-hidden="true"></i>
          </div>
          <span class="room-card__status ${statusClass[room.status]}">
            ${statusLabel[room.status]}
          </span>
        </div>
        <div class="room-card__body">
          <div class="room-card__header">
            <div>
              <p class="room-card__name">Ruang ${room.name}</p>
              <p class="room-card__id">${room.id}</p>
            </div>
            <div class="room-card__price">
              <p class="room-card__price-val">${rp(room.price.hourly)}</p>
              <span class="room-card__price-unit">per jam</span>
            </div>
          </div>
          <div class="room-card__meta">
            <span class="meta-tag"><i class="ti ti-users" aria-hidden="true"></i> ${room.capacity} orang</span>
            <span class="meta-tag"><i class="ti ti-resize" aria-hidden="true"></i> ${room.size}</span>
            <span class="meta-tag"><i class="ti ti-building" aria-hidden="true"></i> ${room.floor}</span>
          </div>
          <div class="room-card__facilities">${facilitiesHTML}</div>
        </div>
        <div class="room-card__footer">
          <button class="room-card__btn-detail" data-room-id="${room.id}" aria-label="Lihat detail Ruang ${room.name}">
            <i class="ti ti-info-circle" aria-hidden="true"></i> Detail
          </button>
          ${bookBtnHTML}
        </div>
      `;

      grid.appendChild(card);
    });

    grid.querySelectorAll('.room-card__btn-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(btn.dataset.roomId);
      });
    });
  }

  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('filter-tab--active'));
      tab.classList.add('filter-tab--active');
      activeFilter = tab.dataset.filter;
      renderCards();
    });
  });

  document.getElementById('capacityFilter').addEventListener('change', (e) => {
    activeCapacity = e.target.value;
    renderCards();
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderCards();
  });

  document.getElementById('resetFilter')?.addEventListener('click', () => {
    activeFilter   = 'all';
    activeCapacity = 'all';
    searchQuery    = '';
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('filter-tab--active'));
    document.querySelector('[data-filter="all"]').classList.add('filter-tab--active');
    document.getElementById('capacityFilter').value = 'all';
    document.getElementById('searchInput').value    = '';
    renderCards();
  });

  const modalOverlay = document.getElementById('modalOverlay');

  function openModal(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const statusLabel = { available: 'Tersedia', occupied: 'Sedang Digunakan', reserved: 'Direservasi' };
    const isAvailable = room.status === 'available';

    document.getElementById('modalRoomId').textContent   = room.id;
    document.getElementById('modalRoomName').textContent = `Ruang ${room.name}`;

    document.getElementById('modalPhoto').innerHTML = `
      <img
        src="images/rooms/room-${room.id.toLowerCase()}.jpg"
        alt="Foto Ruang ${room.name}"
        style="width:100%;height:100%;object-fit:cover;"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      />
      <div style="width:100%;height:100%;background:${room.gradient};display:none;align-items:center;justify-content:center;">
        <i class="ti ti-door" style="font-size:3rem;opacity:0.2;"></i>
      </div>`;

    document.getElementById('modalMeta').innerHTML = `
      <div class="modal-meta-item">
        <p class="modal-meta-item__label">Kapasitas</p>
        <p class="modal-meta-item__value">${room.capacity} orang</p>
      </div>
      <div class="modal-meta-item">
        <p class="modal-meta-item__label">Luas Ruangan</p>
        <p class="modal-meta-item__value">${room.size}</p>
      </div>
      <div class="modal-meta-item">
        <p class="modal-meta-item__label">Lokasi</p>
        <p class="modal-meta-item__value">${room.floor}</p>
      </div>
      <div class="modal-meta-item">
        <p class="modal-meta-item__label">Status</p>
        <p class="modal-meta-item__value">${statusLabel[room.status]}</p>
      </div>`;

    document.getElementById('modalFacilities').innerHTML = room.facilities
      .map(f => `<li class="modal-facility-item"><i class="ti ti-circle-check" aria-hidden="true"></i>${f}</li>`)
      .join('');

    document.getElementById('modalPricing').innerHTML = `
      <div class="modal-pricing-row">
        <span>Per Jam</span><strong>${rp(room.price.hourly)}</strong>
      </div>
      <div class="modal-pricing-row">
        <span>Half Day (4 jam)</span><strong>${rp(room.price.halfDay)}</strong>
      </div>
      <div class="modal-pricing-row modal-pricing-row--featured">
        <span>Full Day (8 jam)</span><strong>${rp(room.price.fullDay)}</strong>
      </div>`;

    document.getElementById('modalActions').innerHTML = isAvailable
      ? `<a href="booking.html?room=${room.id}" class="btn btn--primary btn--lg" style="flex:1;justify-content:center;">
           <i class="ti ti-calendar-plus" aria-hidden="true"></i> Booking Ruangan Ini
         </a>`
      : `<span class="btn btn--outline btn--lg" style="flex:1;justify-content:center;cursor:not-allowed;opacity:0.6;">
           <i class="ti ti-lock" aria-hidden="true"></i> ${statusLabel[room.status]}
         </span>`;

    modalOverlay.setAttribute('aria-hidden', 'false');
    modalOverlay.classList.add('modal-overlay--visible');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.setAttribute('aria-hidden', 'true');
    modalOverlay.classList.remove('modal-overlay--visible');
    document.body.style.overflow = '';
  }

  document.getElementById('modalClose').addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  renderCards();

  const params = new URLSearchParams(window.location.search);
  const preFilter = params.get('filter');
  if (preFilter && ['available', 'occupied', 'reserved'].includes(preFilter)) {
    activeFilter = preFilter;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('filter-tab--active'));
    document.querySelector(`[data-filter="${preFilter}"]`)?.classList.add('filter-tab--active');
    renderCards();
  }

})();