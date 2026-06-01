/* DASHBOARD LOGIC */

(function () {
  const rooms = [
    { id: 'R01', name: 'Dyna',     capacity: 4,  facilities: ['Proyektor', 'Whiteboard', 'AC'], gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
    { id: 'R02', name: 'Mebius',   capacity: 6,  facilities: ['Proyektor', 'TV 55"', 'AC', 'Soundsystem'], gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' },
    { id: 'R03', name: 'Cosmos',   capacity: 8,  facilities: ['Proyektor', 'Whiteboard', 'AC', 'Video Conference'], gradient: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)' },
    { id: 'R04', name: 'Hikari',   capacity: 10, facilities: ['Dual Proyektor', 'AC', 'Video Conference'], gradient: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)' },
    { id: 'R05', name: 'Saga',     capacity: 12, facilities: ['Proyektor', 'TV 75"', 'AC', 'Soundsystem'], gradient: 'linear-gradient(135deg, #fff1f2 0%, #fecdd3 100%)' },
    { id: 'R06', name: 'Ultra',    capacity: 20, facilities: ['Dual Proyektor', 'Stage', 'AC', 'Soundsystem'], gradient: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)' },
  ];
  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem('nexus-bookings') || '[]');
    } catch {
      return [];
    }
  }

  const bookings = getBookings();
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayBookings = bookings.filter(b => b.date === today);

  const nowMins = d.getHours() * 60 + d.getMinutes();

  const occupiedIds = new Set();
  const reservedIds = new Set();

  todayBookings.forEach(b => {
    const [h, m]   = b.startTime.split(':').map(Number);
    const startMin = h * 60 + m;
    const endMin   = startMin + (parseInt(b.duration) * 60);
    if (nowMins >= startMin && nowMins < endMin) {
      occupiedIds.add(b.roomId);
    } else if (nowMins < startMin) {
      reservedIds.add(b.roomId);
    }
  });

  const roomsWithStatus = rooms.map(r => {
    let status = 'available';
    if (occupiedIds.has(r.id)) {
      status = 'occupied';
    } else if (reservedIds.has(r.id)) {
      status = 'reserved';
    }
    return { ...r, status };
  });

  const available = roomsWithStatus.filter(r => r.status !== 'occupied').length;
  const occupied  = roomsWithStatus.filter(r => r.status === 'occupied').length;

  document.getElementById('roomAvailable').textContent = available;
  document.getElementById('roomOccupied').textContent  = occupied;
  document.getElementById('totalBooking').textContent  = todayBookings.length;
  document.getElementById('meterAvailable').value      = available;
  document.getElementById('meterOccupied').value       = occupied;

  const dateEl = document.getElementById('todayDate');
  if (dateEl) {
    dateEl.textContent = d.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function initDashboard() {
    const freshBookings = getBookings();
    const freshTodayBookings = freshBookings.filter(b => b.date === today);

    const freshOccupiedIds = new Set();
    const freshReservedIds = new Set();

    freshTodayBookings.forEach(b => {
      const [h, m]   = b.startTime.split(':').map(Number);
      const startMin = h * 60 + m;
      const endMin   = startMin + (parseInt(b.duration) * 60);
      if (nowMins >= startMin && nowMins < endMin) {
        freshOccupiedIds.add(b.roomId);
      } else if (nowMins < startMin) {
        freshReservedIds.add(b.roomId);
      }
    });

    const freshRoomsWithStatus = rooms.map(r => {
      let status = 'available';
      if (freshOccupiedIds.has(r.id)) {
        status = 'occupied';
      } else if (freshReservedIds.has(r.id)) {
        status = 'reserved';
      }
      return { ...r, status };
    });

    const freshAvailable = freshRoomsWithStatus.filter(r => r.status !== 'occupied').length;
    const freshOccupied  = freshRoomsWithStatus.filter(r => r.status === 'occupied').length;

    document.getElementById('roomAvailable').textContent = freshAvailable;
    document.getElementById('roomOccupied').textContent  = freshOccupied;
    document.getElementById('totalBooking').textContent  = freshTodayBookings.length;
    document.getElementById('meterAvailable').value      = freshAvailable;
    document.getElementById('meterOccupied').value       = freshOccupied;

    const roomGrid = document.getElementById('roomGrid');
    roomGrid.innerHTML = '';

    const statusLabel = { available: 'Tersedia', occupied: 'Digunakan', reserved: 'Direservasi' };
    const statusClass = { available: 'available', occupied: 'occupied', reserved: 'reserved' };
    const iconMap     = { available: 'ti-check', occupied: 'ti-user', reserved: 'ti-clock' };

    freshRoomsWithStatus.forEach((room, i) => {
      const div = document.createElement('div');
      div.setAttribute('role', 'listitem');
      div.className = 'room-item';
      div.style.animationDelay = `${i * 40}ms`;

      const facilitiesHTML = room.facilities
        .slice(0, 3)
        .map(f => `<span><i class="ti ti-circle-check" aria-hidden="true"></i> ${f}</span>`)
        .join('');

      const btnHTML = room.status === 'available'
        ? `<a href="booking.html?room=${room.id}" class="room-item__btn">
             <i class="ti ti-calendar-plus" aria-hidden="true"></i> Booking Ruangan
           </a>`
        : `<span class="room-item__btn room-item__btn--disabled">
             <i class="ti ti-lock" aria-hidden="true"></i> ${statusLabel[room.status]}
           </span>`;

      div.innerHTML = `
        <div class="room-item__photo">
          <img
            src="images/rooms/room-${room.id.toLowerCase()}.jpg"
            alt="Foto Ruang ${room.name}"
            class="room-item__img"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div class="room-item__photo-fallback" style="background:${room.gradient}; display:none;">
            <i class="ti ti-door" aria-hidden="true"></i>
          </div>
        </div>
        <div class="room-item__body">
          <div class="room-item__header">
            <div>
              <p class="room-item__name">Ruang ${room.name}</p>
              <p class="room-item__id">${room.id}</p>
            </div>
            <span class="room-item__badge room-item__badge--${statusClass[room.status]}">
              <i class="ti ${iconMap[room.status]}" aria-hidden="true"></i>
              ${statusLabel[room.status]}
            </span>
          </div>
          <div class="room-item__meta">
            <span><i class="ti ti-users" aria-hidden="true"></i> Kapasitas ${room.capacity} orang</span>
            ${facilitiesHTML}
          </div>
        </div>
        ${btnHTML}
      `;

      roomGrid.appendChild(div);
    });

    const myBookingsList = document.getElementById('myBookingsList');
    myBookingsList.innerHTML = '';
    
    document.getElementById('myBookingsCount').textContent = `${freshBookings.length} Pemesanan`;

    if (freshBookings.length === 0) {
      myBookingsList.innerHTML = `
        <div class="my-bookings-empty">
          <i class="ti ti-calendar-off" aria-hidden="true"></i>
          <p>Anda belum memiliki pemesanan aktif.</p>
          <a href="booking.html" class="btn btn--primary">Booking Sekarang</a>
        </div>`;
    } else {
      freshBookings.forEach(b => {
        const card = document.createElement('div');
        card.setAttribute('role', 'listitem');
        card.className = 'my-booking-card';

        const rp = n => 'Rp ' + n.toLocaleString('id-ID');
        const formattedDate = new Date(b.date + 'T00:00:00').toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric'
        });

        card.innerHTML = `
          <div class="my-booking-card__header">
            <span class="my-booking-card__room">${b.roomName}</span>
            <span class="my-booking-card__code">${b.code}</span>
          </div>
          <div class="my-booking-card__details">
            <div class="my-booking-card__detail-item">
              <i class="ti ti-calendar"></i>
              <span>${formattedDate}</span>
            </div>
            <div class="my-booking-card__detail-item">
              <i class="ti ti-clock"></i>
              <span>${b.startTime} WIB</span>
            </div>
            <div class="my-booking-card__detail-item">
              <i class="ti ti-hourglass"></i>
              <span>${b.duration} Jam</span>
            </div>
            <div class="my-booking-card__detail-item">
              <i class="ti ti-users"></i>
              <span>${b.attendees} Orang</span>
            </div>
          </div>
          <div class="my-booking-card__footer">
            <div class="my-booking-card__price">
              <span>Total Estimasi:</span>
              <p>${rp(b.total)}</p>
            </div>
            <button class="btn--danger-subtle btnCancel" data-code="${b.code}">
              Batalkan
            </button>
          </div>
        `;

        myBookingsList.appendChild(card);
      });

      myBookingsList.querySelectorAll('.btnCancel').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.dataset.code;
          askConfirmation(code);
        });
      });
    }

    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';

    const actIconMap   = {
      book: { cls: 'icon--book', icon: 'ti-calendar-plus' },
    };

    if (freshBookings.length === 0) {
      activityList.innerHTML = `
        <li class="activity-empty">
          <i class="ti ti-calendar-off" aria-hidden="true"></i>
          <p>Belum ada aktivitas pemesanan. <a href="booking.html">Buat booking pertama</a>.</p>
        </li>`;
    } else {
      const recent = [...freshBookings]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 6);

      recent.forEach((b, i) => {
        const { cls, icon } = actIconMap['book'];
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.style.animationDelay = `${i * 50}ms`;

        const timeLabel = new Date(b.createdAt).toLocaleTimeString('id-ID', {
          hour: '2-digit', minute: '2-digit'
        });

        li.innerHTML = `
          <div class="activity-item__icon ${cls}" aria-hidden="true">
            <i class="ti ${icon}"></i>
          </div>
          <div class="activity-item__info">
            <p class="activity-item__name">${b.name}</p>
            <p class="activity-item__detail">Booking ${b.roomName} — ${b.duration} jam</p>
          </div>
          <span class="activity-item__time">${timeLabel}</span>
        `;
        activityList.appendChild(li);
      });
    }
  }

  function cancelBooking(code) {
    try {
      const currentBookings = getBookings();
      const filtered = currentBookings.filter(b => b.code !== code);
      localStorage.setItem('nexus-bookings', JSON.stringify(filtered));
      initDashboard();
      showToast('Pemesanan berhasil dibatalkan.', 'danger');
    } catch (e) {
      console.error(e);
    }
  }

  // ---- Custom Confirmation Modal & Toast ----
  const confirmOverlay   = document.getElementById('confirmOverlay');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  const confirmYesBtn    = document.getElementById('confirmYesBtn');

  let activeCancelCode = null;

  function askConfirmation(code) {
    activeCancelCode = code;
    confirmOverlay.setAttribute('aria-hidden', 'false');
    confirmOverlay.classList.add('confirm-overlay--visible');
  }

  function closeConfirmation() {
    activeCancelCode = null;
    confirmOverlay.setAttribute('aria-hidden', 'true');
    confirmOverlay.classList.remove('confirm-overlay--visible');
  }

  confirmCancelBtn?.addEventListener('click', closeConfirmation);
  confirmOverlay?.addEventListener('click', (e) => {
    if (e.target === confirmOverlay) closeConfirmation();
  });

  confirmYesBtn?.addEventListener('click', () => {
    if (activeCancelCode) {
      cancelBooking(activeCancelCode);
      closeConfirmation();
    }
  });

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'info' ? 'toast--info' : type === 'danger' ? 'toast--danger' : ''}`;
    
    let iconClass = 'ti-circle-check-filled toast__icon--green';
    if (type === 'info') iconClass = 'ti-info-circle-filled toast__icon--blue';
    if (type === 'danger') iconClass = 'ti-circle-x-filled toast__icon--red';

    toast.innerHTML = `
      <i class="ti ${iconClass} toast__icon" aria-hidden="true"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast--out');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  initDashboard();

})();