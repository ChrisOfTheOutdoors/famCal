document.addEventListener("DOMContentLoaded", function () {
  const calendar = document.getElementById("calendar");
  const modal = document.getElementById("bookingModal");
  const nightsSelect = document.getElementById("nightsSelect");
  const peopleSelect = document.getElementById("peopleSelect");
  const summary = document.getElementById("summary");
  const submitBtn = document.getElementById("submitReservation");
  const title = document.querySelector("h2");
  const modalTop = document.getElementById("modalTop");

  let selectedDate = null;
  const user = JSON.parse(localStorage.getItem("user")); // name, email, color
  const token = localStorage.getItem("token");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString("default", { month: "long" });

  if (title) {
    title.textContent = `${monthName} ${year}`;
  }

  function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getStartDayOfWeek(month, year) {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust so Monday = 0, Sunday = 6
  }

  function renderCalendarGrid() {
    calendar.innerHTML = "";

    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    daysOfWeek.forEach(day => {
      const header = document.createElement("div");
      header.className = "calendar-day";
      header.style.fontWeight = "bold";
      header.style.background = "#f0f0f0";
      header.textContent = day;
      calendar.appendChild(header);
    });

    const daysInMonth = getDaysInMonth(month, year);
    const startOffset = getStartDayOfWeek(month, year);

    for (let i = 0; i < startOffset; i++) {
      const blank = document.createElement("div");
      blank.className = "calendar-day";
      calendar.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayDiv = document.createElement("div");
      dayDiv.className = "calendar-day";
      dayDiv.dataset.date = dateStr;
      dayDiv.textContent = day;

      dayDiv.addEventListener("click", () => openModal(dateStr));
      calendar.appendChild(dayDiv);
    }
  }

  function populateBookings(bookings) {
    const dayElements = document.querySelectorAll(".calendar-day");
    const colors = {
      "Chris": "orange",
      "Russ": "red",
      "Karen": "purple",
      "Aaron": "blue",
      "Dorothy": "black"
    };

    bookings.forEach(r => {
      const startDate = new Date(r.startDate);
      for (let i = 0; i < r.nights; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        const day = Array.from(dayElements).find(el => el.dataset.date === dateStr);
        if (day) {
          day.classList.add("booked");
          day.style.background = colors[r.name] || "gray";
          day.innerHTML = `<strong>${r.name}</strong>${r.people > 1 ? "<br>& Guests" : ""}`;
        }
      }
    });
  }

  async function fetchReservations() {
    try {
      const res = await fetch("/api/reservations");
      const data = await res.json();
      populateBookings(data);
    } catch (e) {
      console.error("Failed to fetch reservations", e);
    }
  }

  function openModal(date) {
    selectedDate = date;
    modal.style.display = "flex";
    updateSummary();
  }

  function closeModal() {
    modal.style.display = "none";
    selectedDate = null;
  }

  function updateSummary() {
    const nights = parseInt(nightsSelect.value);
    const people = parseInt(peopleSelect.value);
    const checkIn = new Date(selectedDate);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);

    summary.innerHTML = `
      <p><strong>Check In:</strong> ${checkIn.toDateString()}</p>
      <p><strong>Check Out:</strong> ${checkOut.toDateString()}</p>
      <p>${nights} Night(s)</p>
      <p>${people} People Total</p>
    `;
  }

  nightsSelect.addEventListener("change", updateSummary);
  peopleSelect.addEventListener("change", updateSummary);

  submitBtn.addEventListener("click", async () => {
    const nights = parseInt(nightsSelect.value);
    const people = parseInt(peopleSelect.value);

    const res = await fetch("/api/reservations/reserve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        startDate: selectedDate,
        nights,
        people
      })
    });

    if (res.ok) {
      if (modalTop) {
        modalTop.innerHTML = `
          <h2>All Set! We hope you enjoy your trip!</h2>
          <p>You'll get an email the day before you arrive with the address, front door code, alarm code, and Russ' phone number.</p>
          <button onclick="document.getElementById('bookingModal').style.display='none'">Close</button>
        `;
      }
      fetchReservations();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to book reservation.");
    }
  });

  const cancelBtn = document.getElementById("cancelBookingBtn");
  cancelBtn.addEventListener("click", closeModal);

  renderCalendarGrid();
  fetchReservations();
});
