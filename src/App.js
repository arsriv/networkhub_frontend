import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Camera, Search, Heart, MessageCircle, UserPlus, UserMinus, Edit3, MapPin, Calendar, Send, Image as ImageIcon } from 'lucide-react';

const API_BASE = "https://web-production-6d7eb.up.railway.app";
// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  useEffect(() => {
    if (token) {
      // Verify token and get user data
      fetch(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          logout();
        } else {
          setUser(data);
        }
      })
      .catch(() => logout());
    }
  }, [token]);
  
  const login = (token, userData) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem('token', token);
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };
  
  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hooks
const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Components
const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
    <input
      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
      {...props}
    />
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-90vh overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="text-2xl">&times;</span>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
      {message}
    </div>
  );
};

// Auth Components
const SignupForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', bio: '', location: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: signup form, 2: OTP verification
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { login } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        credentials: "include", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep(2);
        setToast({ message: 'OTP sent to your email!', type: 'success' });
      } else {
        setToast({ message: data.error, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    
    setLoading(false);
  };
  
  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        login(data.access_token, data.user);
        setToast({ message: 'Account created successfully!', type: 'success' });
      } else {
        setToast({ message: data.error, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    
    setLoading(false);
  };
  
  if (step === 2) {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Verify Your Email</h2>
          <p className="text-gray-600">Enter the 6-digit code sent to {formData.email}</p>
        </div>
        
        <Input
          icon={Mail}
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength="6"
          required
        />
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Email'}
        </Button>
        
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full text-blue-600 hover:underline"
        >
          Back to signup
        </button>
        
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </form>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Join NetworkHub</h2>
        <p className="text-gray-600">Connect with professionals worldwide</p>
      </div>
      
      <div className="flex space-x-4">
        <Input
          icon={User}
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          required
        />
        <Input
          icon={User}
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          required
        />
      </div>
      
      <Input
        icon={Mail}
        type="email"
        placeholder="Email Address"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      
      <Input
        icon={Edit3}
        type="text"
        placeholder="Bio (optional)"
        value={formData.bio}
        onChange={(e) => setFormData({...formData, bio: e.target.value})}
      />
      
      <Input
        icon={MapPin}
        type="text"
        placeholder="Location (optional)"
        value={formData.location}
        onChange={(e) => setFormData({...formData, location: e.target.value})}
      />
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
      
      <p className="text-center text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:underline font-medium"
        >
          Sign In
        </button>
      </p>
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </form>
  );
};

const LoginForm = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        credentials: "include", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        login(data.access_token, data.user);
        setToast({ message: 'Welcome back!', type: 'success' });
      } else {
        setToast({ message: data.error, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    
    setLoading(false);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p className="text-gray-600">Sign in to your NetworkHub account</p>
      </div>
      
      <Input
        icon={Mail}
        type="email"
        placeholder="Email Address"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="text-right">
        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="text-blue-600 hover:underline text-sm"
        >
          Forgot Password?
        </button>
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In'}
      </Button>
      
      <p className="text-center text-gray-600">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-blue-600 hover:underline font-medium"
        >
          Sign Up
        </button>
      </p>
      
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </form>
  );
};

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep(2);
        setToast({ message: 'OTP sent to your email!', type: 'success' });
      } else {
        setToast({ message: data.error, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    
    setLoading(false);
  };
  
  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setToast({ message: 'Password reset successfully!', type: 'success' });
        setTimeout(() => {
          onClose();
          setStep(1);
          setEmail('');
          setOtp('');
          setNewPassword('');
        }, 2000);
      } else {
        setToast({ message: data.error, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    
    setLoading(false);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
      {step === 1 && (
        <form onSubmit={sendOtp} className="space-y-4">
          <p className="text-gray-600 mb-4">Enter your email to receive a reset code</p>
          <Input
            icon={Mail}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Code'}
          </Button>
        </form>
      )}
      
      {step === 2 && (
        <form onSubmit={resetPassword} className="space-y-4">
          <p className="text-gray-600 mb-4">Enter the code sent to {email} and your new password</p>
          <Input
            icon={Mail}
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength="6"
            required
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-blue-600 hover:underline text-sm"
          >
            Back
          </button>
        </form>
      )}
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </Modal>
  );
};

// Main App Components
const Header = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-blue-600">NetworkHub</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-medium">{user?.firstName} {user?.lastName}</span>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Navigate to profile - we'll implement this
                  }}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { token } = useAuth();
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, image })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setContent('');
        setImage('');
        setToast({ message: 'Post created successfully!', type: 'success' });
        onPostCreated();
      } else {
        setToast({ message: data.error, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    
    setLoading(false);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          rows="3"
          required
        />
        
        {image && (
          <div className="relative">
            <img src={image} alt="Preview" className="max-w-full h-48 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => setImage('')}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <label className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-blue-600">
            <ImageIcon className="w-5 h-5" />
            <span>Add Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          
          <Button type="submit" disabled={loading || !content.trim()}>
            {loading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

const Post = ({ post }) => {
  const { token } = useAuth();
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  
  const handleLike = async () => {
    // This would require implementing like/unlike endpoints in the backend
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <div className="flex items-start space-x-3">
        {post.author.profileImage ? (
          <img
            src={post.author.profileImage}
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">
              {post.author.firstName} {post.author.lastName}
            </h3>
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-500 text-sm">{formatDate(post.createdAt)}</span>
          </div>
          
          <p className="mt-2 text-gray-800">{post.content}</p>
          
          {post.image && (
            <img
              src={post.image}
              alt="Post"
              className="mt-4 max-w-full h-auto rounded-lg border"
            />
          )}
          
          <div className="flex items-center space-x-6 mt-4 pt-4 border-t">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 ${
                liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const { token } = useAuth();
  
  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPosts(data);
      } else {
        setToast({ message: 'Failed to load posts', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    
    setLoading(false);
  };
  
  useEffect(() => {
    fetchPosts();
  }, [token]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <CreatePost onPostCreated={fetchPosts} />
      
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No posts yet. Start following people or create your first post!</p>
        </div>
      ) : (
        posts.map(post => (
          <Post key={post.id} post={post} />
        ))
      )}
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { token } = useAuth();
  
  const searchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data);
      } else {
        setToast({ message: 'Search failed', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    
    setLoading(false);
  };
  
  const handleFollow = async (userId, isFollowing) => {
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`${API_BASE}/api/${endpoint}/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: !isFollowing }
            : user
        ));
        setToast({ 
          message: isFollowing ? 'Unfollowed successfully' : 'Following user', 
          type: 'success' 
        });
      }
    } catch (error) {
      setToast({ message: 'Action failed', type: 'error' });
    }
  };
  
  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(query);
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [query]);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Find People</h2>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search people..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>
      
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      <div className="space-y-4">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div>
                <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                {user.bio && <p className="text-gray-600 text-sm">{user.bio}</p>}
              </div>
            </div>
            
            <Button
              variant={user.isFollowing ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => handleFollow(user.id, user.isFollowing)}
            >
              {user.isFollowing ? (
                <>
                  <UserMinus className="w-4 h-4 mr-1" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
      
      {query && !loading && users.length === 0 && (
        <p className="text-center text-gray-500 py-4">No users found</p>
      )}
      
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

const Profile = () => {
  const { user, token, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    location: user?.location || ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch(`${API_BASE}/api/upload-profile-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUser({ ...user, profileImage: data.profileImage });
        setToast({ message: 'Profile image updated!', type: 'success' });
      } else {
        setToast({ message: data.error, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Upload failed', type: 'error' });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setUser({ ...user, ...formData });
        setIsEditing(false);
        setToast({ message: 'Profile updated successfully!', type: 'success' });
      } else {
        setToast({ message: 'Update failed', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error', type: 'error' });
    }
    
    setLoading(false);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Profile</h2>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h3>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex space-x-4 mt-2 text-sm text-gray-500">
              <span>{user?.followerCount || 0} followers</span>
              <span>{user?.followingCount || 0} following</span>
            </div>
          </div>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-4">
              <Input
                icon={User}
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
              <Input
                icon={User}
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
            
            <textarea
              placeholder="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows="3"
            />
            
            <Input
              icon={MapPin}
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {user?.bio && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Bio</h4>
                <p className="text-gray-600">{user.bio}</p>
              </div>
            )}
            
            {user?.location && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Location</h4>
                <p className="text-gray-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {user.location}
                </p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Member Since</h4>
              <p className="text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
        
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'feed', label: 'Feed', icon: Send },
    { id: 'search', label: 'Find People', icon: Search },
    { id: 'profile', label: 'Profile', icon: User }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <nav className="space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('feed');
  
  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <Feed />;
      case 'search':
        return <UserSearch />;
      case 'profile':
        return <Profile />;
      default:
        return <Feed />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {isLogin ? (
          <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
        ) : (
          <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

const NetworkHub = () => {
  const { user } = useAuth();
  
  return user ? <Dashboard /> : <AuthPage />;
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <NetworkHub />
    </AuthProvider>
  );
};

export default App;
