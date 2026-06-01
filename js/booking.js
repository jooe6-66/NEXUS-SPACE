/* BOOKING LOGIC */

(function () {
  const roomData = {
    R01: { name: 'Ruang Dyna',     capacity: 4,  price: 150000 },
    R02: { name: 'Ruang Mebius',   capacity: 6,  price: 200000 },
    R03: { name: 'Ruang Cosmos',   capacity: 8,  price: 250000 },
    R04: { name: 'Ruang Hikari',   capacity: 10, price: 350000 },
    R05: { name: 'Ruang Saga',     capacity: 12, price: 450000 },
    R06: { name: 'Ruang Ultra',    capacity: 20, price: 600000 },
  };
  const form      = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('submitBtn');

  const fields = {
    fullName:    document.getElementById('fullName'),
    email:       document.getElementById('email'),
    phone:       document.getElementById('phone'),
    roomSelect:  document.getElementById('roomSelect'),
    bookingDate: document.getElementById('bookingDate'),
    startTime:   document.getElementById('startTime'),
    duration:    document.getElementById('duration'),
    attendees:   document.getElementById('attendees'),
  };
  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const today = getLocalDateString();
  fields.bookingDate.setAttribute('min', today);
  const params = new URLSearchParams(window.location.search);
  const preRoom = params.get('room');
  if (preRoom && fields.roomSelect.querySelector(`option[value="${preRoom}"]`)) {
    fields.roomSelect.value = preRoom;
  }

  const validators = {
    fullName(v)    { return v.trim().length >= 3 ? '' : 'Nama minimal 3 karakter.'; },
    email(v)       { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Format email tidak valid.'; },
    phone(v)       { return /^(\+62|0)[0-9]{9,12}$/.test(v) ? '' : 'Nomor telepon tidak valid (cth: 08123456789).'; },
    roomSelect(v)  { return v ? '' : 'Pilih ruangan terlebih dahulu.'; },
    bookingDate(v) {
      if (!v) return 'Tanggal wajib diisi.';
      return v >= today ? '' : 'Tanggal tidak boleh di masa lalu.';
    },
    startTime(v) {
      if (!v) return 'Waktu mulai wajib diisi.';
      const [h] = v.split(':').map(Number);
      return h >= 8 && h <= 20 ? '' : 'Waktu operasional 08:00 – 20:00.';
    },
    duration(v) {
      const n = parseInt(v);
      if (!v) return 'Durasi wajib diisi.';
      return n >= 1 && n <= 8 ? '' : 'Durasi antara 1 hingga 8 jam.';
    },
    attendees(v) {
      const n    = parseInt(v);
      const room = fields.roomSelect.value;
      const max  = room && roomData[room] ? roomData[room].capacity : 50;
      if (!v || n < 1) return 'Minimal 1 peserta.';
      if (room && n > max) return `Kapasitas ruangan maksimal ${max} orang.`;
      return '';
    },
  };

  function showError(fieldName, message) {
    const input = fields[fieldName];
    const error = document.getElementById(`${fieldName}-error`);
    if (!input || !error) return;
    input.classList.toggle('field__input--error', !!message);
    error.textContent = message;
  }

  function validateField(fieldName) {
    const val = fields[fieldName]?.value || '';
    const msg = validators[fieldName] ? validators[fieldName](val) : '';
    showError(fieldName, msg);
    return msg === '';
  }

  Object.keys(validators).forEach(name => {
    fields[name]?.addEventListener('blur', () => validateField(name));
    fields[name]?.addEventListener('input', () => {
      if (fields[name].classList.contains('field__input--error')) validateField(name);
    });
  });

  const rp = n => 'Rp ' + n.toLocaleString('id-ID');

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function updateSummary() {
    const roomId   = fields.roomSelect.value;
    const date     = fields.bookingDate.value;
    const time     = fields.startTime.value;
    const duration = parseInt(fields.duration.value) || 0;
    const persons  = fields.attendees.value;

    const summaryRoom = document.getElementById('summaryRoom');
    if (roomId && roomData[roomId]) {
      const r = roomData[roomId];
      summaryRoom.innerHTML = `
        <div class="summary-room__selected">
          <p class="summary-room__name">${r.name}</p>
          <p class="summary-room__cap"><i class="ti ti-users"></i> Kapasitas ${r.capacity} orang</p>
        </div>`;
    } else {
      summaryRoom.innerHTML = `
        <div class="summary-room__placeholder">
          <i class="ti ti-door"></i>
          <p>Pilih ruangan untuk melihat detail</p>
        </div>`;
    }

    document.getElementById('sumDate').textContent      = date ? formatDate(date) : '—';
    document.getElementById('sumTime').textContent      = time || '—';
    document.getElementById('sumDuration').textContent  = duration ? `${duration} jam` : '—';
    document.getElementById('sumAttendees').textContent = persons ? `${persons} orang` : '—';

    if (roomId && roomData[roomId] && duration > 0) {
      const price = roomData[roomId].price;
      document.getElementById('pricePerHour').textContent  = rp(price);
      document.getElementById('priceDuration').textContent = `${duration} jam`;
      document.getElementById('priceTotal').textContent    = rp(price * duration);
    } else {
      ['pricePerHour', 'priceDuration', 'priceTotal'].forEach(id => {
        document.getElementById(id).textContent = '—';
      });
    }
  }

  const visualizerContainer = document.getElementById('visualizerField');
  const timeGridVisualizer   = document.getElementById('timeGridVisualizer');
  const visualizerError      = document.getElementById('visualizer-error');

  const OPERATIONAL_START = 8;
  const OPERATIONAL_END   = 20;

  function updateVisualizer() {
    const roomId = fields.roomSelect.value;
    const date   = fields.bookingDate.value;

    if (!roomId || !date) {
      visualizerContainer.style.display = 'none';
      return;
    }

    visualizerContainer.style.display = 'block';
    visualizerError.textContent = '';

    let bookedHours = new Set();
    try {
      const bookings = JSON.parse(localStorage.getItem('nexus-bookings') || '[]');
      bookings
        .filter(b => b.roomId === roomId && b.date === date)
        .forEach(b => {
          const [h] = b.startTime.split(':').map(Number);
          const dur = parseInt(b.duration) || 1;
          for (let i = 0; i < dur; i++) {
            bookedHours.add(h + i);
          }
        });
    } catch (e) {
      console.error(e);
    }

    timeGridVisualizer.innerHTML = '';
    
    const userStartVal = fields.startTime.value;
    const userStartHour = userStartVal ? parseInt(userStartVal.split(':')[0]) : null;
    const userDuration = parseInt(fields.duration.value) || 0;

    let overlaps = false;

    for (let hour = OPERATIONAL_START; hour < OPERATIONAL_END; hour++) {
      const block = document.createElement('div');
      block.className = 'time-block';
      const label = `${String(hour).padStart(2, '0')}.00`;
      block.innerHTML = `<span class="time-block__hour">${label}</span>`;
      
      const isBooked = bookedHours.has(hour);
      
      let isSelected = false;
      if (userStartHour !== null && userDuration > 0) {
        if (hour >= userStartHour && hour < userStartHour + userDuration) {
          isSelected = true;
          if (isBooked) overlaps = true;
        }
      }

      if (isBooked) {
        block.classList.add('time-block--booked');
        block.setAttribute('title', 'Sudah dipesan');
      } else if (isSelected) {
        block.classList.add('time-block--selected');
      } else {
        block.classList.add('time-block--available');
      }

      block.addEventListener('click', () => {
        if (isBooked) return;
        
        fields.startTime.value = `${String(hour).padStart(2, '0')}:00`;
        if (!fields.duration.value) {
          fields.duration.value = 1;
        }
        
        updateVisualizer();
        updateSummary();
        
        showError('startTime', '');
        showError('duration', '');
      });

      timeGridVisualizer.appendChild(block);
    }

    if (overlaps) {
      visualizerError.textContent = 'Jadwal yang Anda pilih bentrok dengan pesanan lain.';
    } else {
      visualizerError.textContent = '';
    }
  }

  Object.values(fields).forEach(el => {
    el?.addEventListener('input', () => {
      updateSummary();
      updateVisualizer();
    });
    el?.addEventListener('change', () => {
      updateSummary();
      updateVisualizer();
    });
  });
  if (preRoom) {
    updateSummary();
    updateVisualizer();
  }

  function saveBooking() {
    const roomId   = fields.roomSelect.value;
    const room     = roomData[roomId];
    const duration = parseInt(fields.duration.value);
    const bookingCode = 'NX-' + Date.now().toString().slice(-6);

    const entry = {
      code:      bookingCode,
      name:      fields.fullName.value.trim(),
      email:     fields.email.value.trim(),
      phone:     fields.phone.value.trim(),
      roomId,
      roomName:  room?.name || roomId,
      date:      fields.bookingDate.value,
      startTime: fields.startTime.value,
      duration,
      attendees: parseInt(fields.attendees.value),
      total:     (room?.price || 0) * duration,
      createdAt: Date.now(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('nexus-bookings') || '[]');
      existing.unshift(entry);
      localStorage.setItem('nexus-bookings', JSON.stringify(existing));
    } catch {
      console.error('Gagal menyimpan booking ke localStorage.');
    }

    return entry;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const valid = Object.keys(validators).map(name => validateField(name));
    
    const hasOverlap = !!visualizerError.textContent;
    if (hasOverlap) {
      visualizerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (valid.includes(false)) {
      form.querySelector('.field__input--error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ti ti-loader-2 ti-spin"></i> Memproses...';

    setTimeout(() => {
      const entry = saveBooking();
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="ti ti-calendar-check"></i> Konfirmasi Pemesanan';
      showSuccessNotif(entry);
    }, 1200);
  });

  function showSuccessNotif(entry) {
    document.getElementById('notifDesc').textContent =
      `Halo ${entry.name}, pemesanan kamu telah dikonfirmasi. Detail telah dikirim ke ${entry.email}.`;

    document.getElementById('notifDetail').innerHTML = `
      <div class="notif-detail-row"><span>Ruangan</span><span>${entry.roomName}</span></div>
      <div class="notif-detail-row"><span>Tanggal</span><span>${new Date(entry.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
      <div class="notif-detail-row"><span>Waktu</span><span>${entry.startTime} WIB</span></div>
      <div class="notif-detail-row"><span>Durasi</span><span>${entry.duration} jam</span></div>
      <div class="notif-detail-row"><span>Kode Booking</span><span>${entry.code}</span></div>
    `;

    const overlay = document.getElementById('notifOverlay');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('notif-overlay--visible');
  }

  document.getElementById('notifClose')?.addEventListener('click', () => {
    const overlay = document.getElementById('notifOverlay');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('notif-overlay--visible');
    form.reset();
    updateSummary();
    updateVisualizer();
    Object.keys(validators).forEach(name => showError(name, ''));
  });

})();
