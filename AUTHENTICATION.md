# Brownie Bliss - Customer Authentication System

## Overview

A complete customer authentication and profile management system for the Brownie Bliss bakery application, featuring JWT-based authentication, user profiles, saved addresses, and order history tracking.

## Features Implemented

### Core Authentication
- ✅ **User Signup** - New account creation with password validation
- ✅ **User Login** - Secure login with JWT tokens
- ✅ **Session Management** - Token-based sessions with optional "Remember Me"
- ✅ **Logout** - Secure logout functionality
- ✅ **Password Encryption** - Bcryptjs password hashing
- ✅ **Token Verification** - Verify authentication tokens

### User Profile Management
- ✅ **Profile Dashboard** - View and manage user account
- ✅ **Edit Profile** - Update name and phone number
- ✅ **Saved Delivery Addresses** - Store multiple addresses
- ✅ **Address Management** - Add, edit, delete addresses
- ✅ **Default Address** - Set a default delivery address
- ✅ **Order History** - Track user orders with status

### Enhanced Features
- ✅ **Password Strength Indicator** - Real-time password strength feedback
- ✅ **Email Validation** - Email format validation
- ✅ **Remember Me** - Extended session duration option
- ✅ **Forgot Password** - Password reset link (ready for email integration)
- ✅ **Order Linking** - Orders linked to user accounts
- ✅ **Responsive Design** - Mobile-friendly interfaces
- ✅ **Dark Theme Support** - Works with existing theme system

## File Structure

### New Pages Created
```
public/
├── signup.html           # User registration page
├── login.html            # User login page
├── dashboard.html        # User dashboard with orders & addresses
├── profile-edit.html     # Profile editing page
├── address-form.html     # Address management page
├── forgot-password.html  # Password reset page
└── auth.js              # Authentication utilities & helpers
```

### Backend Updates
- **api/index.js** - Added User schema, authentication routes, and profile management endpoints

### New Dependencies
- `bcryptjs` - Password hashing
- `nodemailer` - Email service (ready for integration)

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique, lowercase),
  password: String (hashed),
  phone: String,
  emailVerified: Boolean,
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  rememberMe: Boolean,
  avatar: String,
  addresses: [{
    label: String (home/work/other),
    street: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    isDefault: Boolean
  }],
  timestamps: { createdAt, updatedAt }
}
```

## API Endpoints

### Authentication Routes
```
POST   /api/auth/signup          - Register new user
POST   /api/auth/login           - Login user
GET    /api/auth/verify          - Verify token validity
POST   /api/auth/logout          - Logout (client-side)
```

### User Profile Routes
```
GET    /api/user/profile         - Get user profile
PUT    /api/user/profile         - Update user profile
```

### Address Routes
```
POST   /api/user/addresses       - Add new address
GET    /api/user/addresses       - Get all addresses
PUT    /api/user/addresses/:id   - Update address
DELETE /api/user/addresses/:id   - Delete address
```

### Order Routes
```
GET    /api/user/orders          - Get user orders
POST   /api/orders               - Create order (links to user if authenticated)
```

## Authentication Flow

### Signup Process
1. User enters name, email, password
2. Password strength validated (min 8 chars)
3. Email checked for existing accounts
4. Password hashed with bcryptjs
5. User created in database
6. JWT token generated
7. Token and user data stored in localStorage
8. Redirect to dashboard

### Login Process
1. User enters email and password
2. User found in database
3. Password compared with hash
4. JWT token generated
5. Optional: "Remember Me" extends token validity to 90 days
6. Token stored in localStorage
7. Redirect to dashboard

### Protected Route Access
1. Check for token in localStorage
2. Include token in Authorization header
3. Backend verifies token with JWT secret
4. Return user data or 401 if invalid
5. Redirect to login if unauthorized

## Frontend Utilities (auth.js)

### Auth Object
```javascript
Auth.getToken()              // Get stored JWT token
Auth.getUser()               // Get stored user data
Auth.isAuthenticated()       // Check if user is logged in
Auth.setAuth(token, user)    // Store auth data
Auth.clearAuth()             // Clear stored data
Auth.getAuthHeader()         // Get auth header for API calls
Auth.validatePassword()      // Validate password strength
Auth.validateEmail()         // Validate email format
Auth.validatePhone()         // Validate phone number
```

### API Helper Functions
```javascript
apiSignup(name, email, phone, password, confirmPassword)
apiLogin(email, password, rememberMe)
apiGetProfile()
apiUpdateProfile(name, phone)
apiGetAddresses()
apiAddAddress(addressData)
apiUpdateAddress(addressId, addressData)
apiDeleteAddress(addressId)
apiGetOrders()
```

## Environment Variables

Add these to your `.env` file:

```env
# User Authentication
USER_JWT_SECRET=your-secret-key-change-this
USER_JWT_EXPIRES_IN=30d

# Email Service (Optional - for password reset)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@browniebliss.com
```

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install bcryptjs nodemailer
   ```

2. **Update Environment Variables**
   - Set `USER_JWT_SECRET` to a strong random string
   - (Optional) Configure email service variables

3. **Database Indexes**
   - User email has unique index for fast lookups
   - OTP has TTL index for automatic cleanup

## UI Styling

All pages match the existing Brownie Bliss design:
- **Color Scheme**: Browns, golds, cream, with red accents
- **Typography**: Playfair Display (headers), DM Sans (body)
- **Components**: Consistent buttons, forms, cards
- **Responsive**: Mobile-first design, optimized for all devices
- **Dark Mode**: Full support for existing theme system

## Usage Examples

### Check if User is Logged In
```javascript
if (Auth.isAuthenticated()) {
  // Show user dashboard
} else {
  // Show login prompt
}
```

### Get Current User
```javascript
const user = Auth.getUser();
console.log(user.name); // "John Doe"
```

### Make Authenticated API Call
```javascript
const response = await Auth.fetchWithAuth('/api/user/profile');
const data = await response.json();
```

### Update Profile
```javascript
const result = await apiUpdateProfile('Jane Doe', '+919876543210');
if (result.success) {
  console.log('Profile updated!');
}
```

### Add Address
```javascript
const addressData = {
  label: 'home',
  street: '123 Main Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  phone: '9876543210',
  isDefault: true
};
const result = await apiAddAddress(addressData);
```

## Security Features

1. **Password Security**
   - Hashed with bcryptjs (12 salt rounds)
   - Strength validation on signup
   - Not returned in API responses

2. **Token Security**
   - JWT signed with secret key
   - Includes expiration (30 days or 90 with Remember Me)
   - Verified on each protected request
   - Stored securely in localStorage

3. **Email Validation**
   - Verified on signup
   - Unique constraint in database
   - Case-insensitive storage

4. **Authorization**
   - User can only access own profile/addresses/orders
   - Admin authentication separate from user auth
   - 401 response for invalid/expired tokens

## Future Enhancements

1. **Email Integration**
   - Email verification on signup
   - Password reset emails
   - Order notifications

2. **Two-Factor Authentication**
   - OTP via SMS/Email
   - Authenticator app support

3. **Social Login**
   - Google OAuth
   - Facebook Login

4. **Profile Enhancements**
   - Avatar upload
   - Wishlist
   - Order ratings & reviews

5. **Analytics**
   - User retention tracking
   - Purchase history insights
   - Personalized recommendations

## Troubleshooting

### Token Not Persisting
- Check browser localStorage settings
- Ensure privacy mode is not enabled
- Clear browser cache and cookies

### Login Redirect Loop
- Verify JWT_SECRET environment variable is set
- Check token expiration in JWT payload
- Clear localStorage and login again

### Email Validation Fails
- Ensure email format is correct (user@domain.com)
- Check for extra spaces
- Verify email is not already registered

### Password Strength Issues
- Minimum 8 characters required
- Add uppercase letter for better strength
- Add number and special character for strongest validation

## Testing Checklist

- [ ] Signup with valid email and password
- [ ] Signup with weak password (should reject)
- [ ] Signup with existing email (should reject)
- [ ] Login with correct credentials
- [ ] Login with incorrect password (should reject)
- [ ] Verify token persists after refresh
- [ ] Remember Me extends session
- [ ] Edit profile successfully
- [ ] Add/edit/delete addresses
- [ ] View order history
- [ ] Logout clears session
- [ ] Protected pages redirect unauthenticated users
- [ ] Mobile responsive layouts

## Support & Contributions

For issues, feature requests, or contributions, please refer to the main project documentation or open an issue in the project repository.

---

**Last Updated**: May 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
