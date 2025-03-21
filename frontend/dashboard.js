document.addEventListener("DOMContentLoaded", function () {
    const calendar = document.getElementById("calendar");
    const modal = document.getElementById("bookingModal");
    const nightsSelect = document.getElementById("nightsSelect");
    const peopleSelect = document.getElementById("peopleSelect");
    const summary = document.getElementById("summary");
    const submitBtn = document.getElementById("submitReservation");
  
    let selectedDate = null;
    const user = JSON.parse(localStorage.getItem("user")); // name, email, color
    const token = localStorage.getItem("token");
  
    function getDaysInMonth(month, year) {
      return new Date(year, month + 1, 0).getDate();
    }
  
    function renderCalendar(bookings) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const days = getDaysInMonth(month, year);
      calendar.innerHTML = "";
  
      for (let day = 1; day <= days; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";
        dayDiv.dataset.date = dateStr;
        dayDiv.textContent = day;
  
        const reservation = bookings.find(r => r.startDate.startsWith(dateStr));
        if (reservation) {
          dayDiv.classList.add("booked");
          dayDiv.style.background = reservation.color || "#666";
          dayDiv.innerHTML = `<strong>${reservation.name}</strong>${reservation.people > 1 ? "<br>& Guests" : ""}`;
        }
  
        dayDiv.addEventListener("click", () => openModal(dateStr));
        calendar.appendChild(dayDiv);
      }
    }
  
    async function fetchReservations() {
      const res = await fetch("/api/reservations");
      const data = await res.json();
  
      // Add color for display if user is recognized
      const colors = {
        "Chris": "orange",
        "Russ": "red",
        "Karen": "purple",
        "Aaron": "blue",
        "Dorothy": "black"
      };
      const bookings = data.map(r => ({
        ...r,
        color: colors[r.name] || "gray"
      }));
  
      renderCalendar(bookings);
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
        <p>Check In: ${checkIn.toDateString()}</p>
        <p>Check Out: ${checkOut.toDateString()}</p>
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
        alert("Reservation created!");
        closeModal();
        fetchReservations();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to book reservation.");
      }
    });
  
    fetchReservations();
  });
  