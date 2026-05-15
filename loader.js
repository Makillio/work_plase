// Всплывающее окно входа и регистрации
(function() {
    class User {
        constructor(id, username, email, password, createdAt) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.password = password;
            this.createdAt = createdAt;
            this.lastLogin = null;
        }
    }

    class AuthModalManager {
        constructor() {
            this.users = [];
            this.currentUser = null;
            this.modal = document.getElementById('authModalOverlay');
            if (!this.modal) return;

            this.loadFromStorage();
            this.loadSampleData();
            this.bindEvents();
            this.updateUserCount();
            this.setupMessageClear();
            this.checkRememberedUser();
        }

        loadSampleData() {
            if (this.users.length === 0) {
                this.users.push(new User(
                    Date.now(),
                    'Смотритель Убежища',
                    'overseer@vault111.com',
                    'pipboy2024',
                    new Date().toISOString()
                ));
                this.saveToStorage();
            }
        }

        saveToStorage() {
            localStorage.setItem('pipboy_users', JSON.stringify(this.users));
            if (this.currentUser) {
                localStorage.setItem('pipboy_current_user', JSON.stringify(this.currentUser));
            } else {
                localStorage.removeItem('pipboy_current_user');
            }
        }

        loadFromStorage() {
            const storedUsers = localStorage.getItem('pipboy_users');
            const storedCurrentUser = localStorage.getItem('pipboy_current_user');
            this.users = storedUsers ? JSON.parse(storedUsers) : [];
            this.currentUser = storedCurrentUser ? JSON.parse(storedCurrentUser) : null;
        }

        checkRememberedUser() {
            const rememberMe = localStorage.getItem('pipboy_remember_me');
            if (rememberMe === 'true' && this.currentUser) {
                this.closeModal();
            }
        }

        register(username, email, password, confirmPassword) {
            if (!username || !email || !password || !confirmPassword) {
                this.showMessage('register', 'Заполните все поля!', 'error');
                return false;
            }

            if (password !== confirmPassword) {
                this.showMessage('register', 'Пароли не совпадают!', 'error');
                return false;
            }

            if (password.length < 6) {
                this.showMessage('register', 'Пароль должен быть не менее 6 символов!', 'error');
                return false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showMessage('register', 'Введите корректный email!', 'error');
                return false;
            }

            if (this.users.find(user => user.email === email)) {
                this.showMessage('register', 'Пользователь с таким email уже существует!', 'error');
                return false;
            }

            if (this.users.find(user => user.username === username)) {
                this.showMessage('register', 'Пользователь с таким именем уже существует!', 'error');
                return false;
            }

            if (!document.getElementById('acceptTerms').checked) {
                this.showMessage('register', 'Необходимо принять правила убежища!', 'error');
                return false;
            }

            const newUser = new User(Date.now(), username, email, password, new Date().toISOString());
            this.users.push(newUser);
            this.currentUser = newUser;
            this.saveToStorage();
            this.updateUserCount();
            this.showMessage('register', 'Регистрация успешна! Доступ разрешен.', 'success');

            setTimeout(() => this.closeModal(), 700);
            return true;
        }

        login(email, password, rememberMe) {
            if (!email || !password) {
                this.showMessage('login', 'Введите email и пароль!', 'error');
                return false;
            }

            const user = this.users.find(item => item.email === email && item.password === password);
            if (!user) {
                this.showMessage('login', 'Неверный email или пароль!', 'error');
                return false;
            }

            this.currentUser = user;
            user.lastLogin = new Date().toISOString();

            if (rememberMe) {
                localStorage.setItem('pipboy_remember_me', 'true');
            } else {
                localStorage.removeItem('pipboy_remember_me');
            }

            this.saveToStorage();
            this.showMessage('login', `Добро пожаловать, ${user.username}!`, 'success');
            setTimeout(() => this.closeModal(), 700);
            return true;
        }

        closeModal() {
            this.modal.classList.add('hidden');
        }

        showMessage(formType, message, type) {
            const messageDiv = document.getElementById(`${formType}Message`);
            if (!messageDiv) return;

            messageDiv.textContent = message;
            messageDiv.className = `auth-info-message ${type}`;

            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'auth-info-message';
            }, 3000);
        }

        setupMessageClear() {
            document.querySelectorAll('.auth-input').forEach(input => {
                input.addEventListener('focus', () => {
                    ['loginMessage', 'registerMessage'].forEach(id => {
                        const message = document.getElementById(id);
                        if (message) {
                            message.textContent = '';
                            message.className = 'auth-info-message';
                        }
                    });
                });
            });
        }

        updateUserCount() {
            const userCount = document.getElementById('userCount');
            if (userCount) {
                userCount.textContent = `[ ЗАРЕГИСТРИРОВАНО ПОЛЬЗОВАТЕЛЕЙ: ${this.users.length} ]`;
            }
        }

        bindEvents() {
            document.getElementById('authCloseBtn').addEventListener('click', () => this.closeModal());

            document.getElementById('loginModeBtn').addEventListener('click', () => {
                document.getElementById('loginForm').classList.remove('hidden');
                document.getElementById('registerForm').classList.add('hidden');
                document.getElementById('loginModeBtn').classList.add('active');
                document.getElementById('registerModeBtn').classList.remove('active');
                this.showMessage('login', '', '');
            });

            document.getElementById('registerModeBtn').addEventListener('click', () => {
                document.getElementById('registerForm').classList.remove('hidden');
                document.getElementById('loginForm').classList.add('hidden');
                document.getElementById('registerModeBtn').classList.add('active');
                document.getElementById('loginModeBtn').classList.remove('active');
                this.showMessage('register', '', '');
            });

            document.getElementById('registerBtn').addEventListener('click', () => {
                this.register(
                    document.getElementById('regUsername').value.trim(),
                    document.getElementById('regEmail').value.trim(),
                    document.getElementById('regPassword').value,
                    document.getElementById('regConfirmPassword').value
                );
            });

            document.getElementById('loginBtn').addEventListener('click', () => {
                this.login(
                    document.getElementById('loginEmail').value.trim(),
                    document.getElementById('loginPassword').value,
                    document.getElementById('rememberMe').checked
                );
            });

            document.getElementById('loginPassword').addEventListener('keypress', event => {
                if (event.key === 'Enter') document.getElementById('loginBtn').click();
            });

            document.getElementById('regConfirmPassword').addEventListener('keypress', event => {
                if (event.key === 'Enter') document.getElementById('registerBtn').click();
            });
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        window.authModalManager = new AuthModalManager();
    });
})();
