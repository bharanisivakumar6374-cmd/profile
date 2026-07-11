// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = this.loadCurrentUser();
        this.loginAttempts = {};
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    }

    loadCurrentUser() {
        const userJSON = sessionStorage.getItem('currentUser');
        return userJSON ? JSON.parse(userJSON) : null;
    }

    saveCurrentUser(user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser = user;
    }

    clearCurrentUser() {
        sessionStorage.removeItem('currentUser');
        this.currentUser = null;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password && password.length >= 6;
    }

    isLockedOut(email) {
        if (this.loginAttempts[email]) {
            const { attempts, lockedUntil } = this.loginAttempts[email];
            if (attempts >= this.maxLoginAttempts) {
                if (Date.now() < lockedUntil) {
                    return true;
                } else {
                    delete this.loginAttempts[email];
                    return false;
                }
            }
        }
        return false;
    }

    recordLoginAttempt(email) {
        if (!this.loginAttempts[email]) {
            this.loginAttempts[email] = { attempts: 0, lockedUntil: 0 };
        }
        this.loginAttempts[email].attempts++;
        if (this.loginAttempts[email].attempts >= this.maxLoginAttempts) {
            this.loginAttempts[email].lockedUntil = Date.now() + this.lockoutDuration;
        }
    }

    resetLoginAttempts(email) {
        delete this.loginAttempts[email];
    }

    login(email, password, role = null) {
        if (!email || !password) {
            return { success: false, message: 'Email and password are required' };
        }

        if (!this.validateEmail(email)) {
            return { success: false, message: 'Invalid email format' };
        }

        if (this.isLockedOut(email)) {
            const remaining = Math.ceil((this.loginAttempts[email].lockedUntil - Date.now()) / 1000);
            return { 
                success: false, 
                message: `Account locked. Try again in ${remaining} seconds` 
            };
        }

        if (email === 'bharani.sivakumar6374@gmail.com' && password === '24278957') {
            this.resetLoginAttempts(email);
            const adminUser = {
                id: 'admin-001',
                email: email,
                name: 'Bharani Sivakumar',
                role: 'admin',
                avatar: 'BS'
            };
            this.saveCurrentUser(adminUser);
            return { success: true, user: adminUser, message: 'Admin login successful' };
        }

        const user = db.getUserByEmail(email);

        if (!user) {
            this.recordLoginAttempt(email);
            return { 
                success: false, 
                message: 'User not found',
                newUser: true,
                email: email,
                role: role
            };
        }

        if (user.password !== password) {
            this.recordLoginAttempt(email);
            return { success: false, message: 'Invalid password' };
        }

        this.resetLoginAttempts(email);
        this.saveCurrentUser(user);
        return { success: true, user: user, message: 'Login successful' };
    }

    register(email, password, role, name = null) {
        if (!email || !password || !role) {
            return { success: false, message: 'All fields are required' };
        }

        if (!this.validateEmail(email)) {
            return { success: false, message: 'Invalid email format' };
        }

        if (!this.validatePassword(password)) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        if (!['student', 'staff'].includes(role)) {
            return { success: false, message: 'Invalid role selected' };
        }

        const existingUser = db.getUserByEmail(email);
        if (existingUser) {
            return { success: false, message: 'Email already registered' };
        }

        const newUser = {
            email: email,
            password: password,
            role: role,
            name: name || email.split('@')[0],
            avatar: this.generateAvatar(name || email),
        };

        const user = db.addUser(newUser);
        this.saveCurrentUser(user);

        return { success: true, user: user, message: 'Registration successful' };
    }

    generateAvatar(name) {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    logout() {
        this.clearCurrentUser();
        return { success: true, message: 'Logout successful' };
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    isStudent() {
        return this.currentUser && this.currentUser.role === 'student';
    }

    isStaff() {
        return this.currentUser && this.currentUser.role === 'staff';
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }
}

const auth = new AuthManager();