// Fonction pour afficher les messages d'erreur
function showError(form, message) {
    // Supprimer les anciens messages d'erreur
    const oldAlert = form.querySelector('.alert');
    if (oldAlert) oldAlert.remove();
    
    if (!message) return;
    
    const alert = document.createElement('div');
    alert.className = 'alert error';
    alert.textContent = message;
    form.insertBefore(alert, form.firstChild);
    
    // Faire défiler jusqu'au message d'erreur
    alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Fonction pour gérer le chargement des boutons
function setLoading(button, isLoading) {
    if (isLoading) {
        button.setAttribute('data-original-text', button.innerHTML);
        button.disabled = true;
        button.innerHTML = `
            <span>Chargement...</span>
            <svg class="btn-icon spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
        `;
    } else {
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.innerHTML = originalText;
            button.removeAttribute('data-original-text');
        }
        button.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    // Gestion de la soumission du formulaire de connexion
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            setLoading(submitButton, true);
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Rediriger vers la page d'accueil après connexion réussie
                    window.location.href = '/';
                } else {
                    showError(loginForm, data.message || 'Erreur de connexion');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showError(loginForm, 'Une erreur est survenue lors de la connexion');
            } finally {
                setLoading(submitButton, false);
            }
        });
    }
    
    // Gestion de la soumission du formulaire d'inscription
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            setLoading(submitButton, true);
            
            const fullName = document.getElementById('signupName').value.trim();
            const [firstName, ...lastNameParts] = fullName.split(' ');
            const lastName = lastNameParts.join(' ');
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            
            // Validation simple
            if (!firstName || !email || !password) {
                showError(signupForm, 'Veuillez remplir tous les champs');
                setLoading(submitButton, false);
                return;
            }
            
            if (password.length < 6) {
                showError(signupForm, 'Le mot de passe doit contenir au moins 6 caractères');
                setLoading(submitButton, false);
                return;
            }
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        email, 
                        password,
                        firstName,
                        lastName: lastName || ' ' // Au moins un espace si vide
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Rediriger vers la page d'accueil après inscription réussie
                    window.location.href = '/';
                } else {
                    showError(signupForm, data.message || "Erreur lors de l'inscription");
                }
            } catch (error) {
                console.error('Erreur:', error);
                showError(signupForm, "Une erreur est survenue lors de l'inscription");
            } finally {
                setLoading(submitButton, false);
            }
        });
    }
    
    // Animation pour basculer entre les formulaires
    const toSignupBtn = document.getElementById('toSignup');
    const toLoginBtn = document.getElementById('toLogin');
    const authCard = document.querySelector('.auth-card');
    
    if (toSignupBtn && toLoginBtn && authCard) {
        toSignupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.auth-form.active')?.classList.remove('active');
            signupForm.classList.add('active');
            authCard.classList.add('has-signup');
        });
        
        toLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.auth-form.active')?.classList.remove('active');
            loginForm.classList.add('active');
            authCard.classList.remove('has-signup');
        });
    }
});
