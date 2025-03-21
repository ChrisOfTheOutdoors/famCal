document.addEventListener("DOMContentLoaded", function () {
    const resetForm = document.getElementById("resetForm");
    const message = document.getElementById("resetMessage");

    // Extract token from the URL path (e.g., /reset-password/TOKEN)
    const token = window.location.pathname.split("/").pop();

    resetForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            message.textContent = "Passwords do not match!";
            message.style.color = "red";
            return;
        }

        try {
            const response = await fetch(`/api/auth/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                message.textContent = "✅ Password reset successful! Redirecting to login...";
                message.style.color = "green";
                setTimeout(() => window.location.href = "/", 3000); // Redirect to login
            } else {
                message.textContent = data.error || "❌ Password reset failed.";
                message.style.color = "red";
            }
        } catch (err) {
            console.error("Reset Error:", err);
            message.textContent = "❌ Server error. Please try again later.";
            message.style.color = "red";
        }
    });
});
