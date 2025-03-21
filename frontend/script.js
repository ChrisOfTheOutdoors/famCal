document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
        alert("Login successful!");
        localStorage.setItem('token', data.token); // Store token
        window.location.href = "/dashboard"; // Redirect to dashboard
    } else {
        alert(data.error || "Login failed");
    }
});

// Open Password Reset Dialog
document.getElementById('forgotPassword').addEventListener('click', function () {
    document.getElementById('resetDialog').style.display = 'flex';
});

// Close Password Reset Dialog
document.getElementById('closeDialog').addEventListener('click', function () {
    document.getElementById('resetDialog').style.display = 'none';
});

// Send Password Reset Email
document.getElementById('sendReset').addEventListener('click', async function () {
    const email = document.getElementById('resetEmail').value;

    const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    if (response.ok) {
        alert("If this email is in our system, a reset link has been sent.");
    }

    document.getElementById('resetDialog').style.display = 'none'; // Close dialog
}); 
