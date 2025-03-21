document.addEventListener("DOMContentLoaded", async function () {
    const userTable = document.getElementById("userTable");

    async function fetchUsers() {
        const response = await fetch("/api/admin/users", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });

        const users = await response.json();
        userTable.innerHTML = ""; // Clear table before adding rows

        users.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.nextBooking || "No upcoming booking"}</td>
                <td>
                    <button onclick="deleteUser('${user._id}')">Delete</button>
                    <button onclick="resetPassword('${user.email}')">Send Reset Email</button>
                </td>
            `;
            userTable.appendChild(row);
        });
    }

    window.deleteUser = async function (userId) {
        if (!confirm("Are you sure you want to delete this user?")) return;
        
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });

        if (response.ok) {
            alert("User deleted successfully");
            fetchUsers(); // Refresh user list
        } else {
            alert("Error deleting user");
        }
    };

    window.resetPassword = async function (email) {
        const response = await fetch(`/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            alert("Password reset email sent.");
        } else {
            alert("Error sending reset email.");
        }
    };

    fetchUsers(); // Load users on page load
}); 
