// server.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Pool } = require('pg');
const axios = require('axios');
const path = require('path');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 2003;

// Database connection
const pool = new Pool({
  connectionString: config.postgresUrl,
});

// Set up absolute path to views directory
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configure session
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Configure GitHub OAuth only if credentials are available
if (config.github.clientID && config.github.clientSecret) {
  passport.use(new GitHubStrategy({
      clientID: config.github.clientID,
      clientSecret: config.github.clientSecret,
      callbackURL: config.github.callbackURL
    },
  function(accessToken, refreshToken, profile, done) {
    // Check if user is one of the three allowed users
    pool.query('SELECT * FROM users WHERE github_id = $1', [profile.id])
      .then(res => {
        if (res.rows.length > 0) {
          return done(null, res.rows[0]);
        } else {
          // Check if we have less than 3 users total
          pool.query('SELECT COUNT(*) FROM users')
            .then(countRes => {
              if (parseInt(countRes.rows[0].count) < 3) {
                // Create new user
                pool.query(
                  'INSERT INTO users(github_id, username, avatar) VALUES($1, $2, $3) RETURNING *',
                  [profile.id, profile.username, profile.photos[0].value]
                ).then(insertRes => {
                  return done(null, insertRes.rows[0]);
                }).catch(err => done(err));
              } else {
                return done(null, false, { message: 'Maximum user limit reached' });
              }
            });
        }
      })
      .catch(err => done(err));
  }
));
}

// Configure Google OAuth
passport.use(new GoogleStrategy({
    clientID: config.google.clientID,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    // Similar logic to GitHub strategy
    pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id])
      .then(res => {
        if (res.rows.length > 0) {
          return done(null, res.rows[0]);
        } else {
          pool.query('SELECT COUNT(*) FROM users')
            .then(countRes => {
              if (parseInt(countRes.rows[0].count) < 3) {
                pool.query(
                  'INSERT INTO users(google_id, username, avatar) VALUES($1, $2, $3) RETURNING *',
                  [profile.id, profile.displayName, profile.photos[0].value]
                ).then(insertRes => {
                  return done(null, insertRes.rows[0]);
                }).catch(err => done(err));
              } else {
                return done(null, false, { message: 'Maximum user limit reached' });
              }
            });
        }
      })
      .catch(err => done(err));
  }
));

app.get('/guest-login', function(req, res) {
  // Get the client IP
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Create a simple session for the guest user
  req.session.guestUser = {
    id: `guest-${clientIp}`,
    username: `Guest (${clientIp})`,
    isGuest: true
  };
  
  // Redirect to chat
  res.redirect('/chat');
});

// Serialize and deserialize user
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  pool.query('SELECT * FROM users WHERE id = $1', [id])
    .then(res => {
      done(null, res.rows[0]);
    })
    .catch(err => done(err));
});

// Fallback for IP-based identification
app.use((req, res, next) => {
  if (!req.isAuthenticated()) {
    req.clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
  next();
});

// Auth routes
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/chat');
  });

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/chat');
  });

app.get('/logout', function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Updated isAuthenticated middleware
function isAuthenticated(req, res, next) {
  // OAuth authenticated users
  if (req.isAuthenticated()) {
    return next();
  }
  
  // IP-based authentication if enabled
  if (config.ipBasedAuth) {
    // Get client IP
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Set a guest user
    req.user = {
      id: `guest-${clientIp}`,
      username: `Guest (${clientIp})`,
      isGuest: true
    };
    
    return next();
  }
  
  // Otherwise redirect to login
  res.redirect('/login');
}

// Routes
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/chat');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});


app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// In server.js, update or add this route
app.get('/chat', function(req, res, next) {
  // If already authenticated via OAuth, proceed
  if (req.isAuthenticated()) {
    return next();
  }
  
  // For guest users (IP-based identification)
  if (config.ipBasedAuth) {
    // Get the client IP
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Create a guest user object
    const guestUser = {
      id: `guest-${clientIp}`,
      username: `Guest (${clientIp})`,
      isGuest: true
    };
    
    // Set user in req object for templates
    req.user = guestUser;
    return next();
  }
  
  // If IP-based auth is disabled and not authenticated, redirect to login
  res.redirect('/login');
}, function(req, res) {
  // Render the chat page
  res.render('chat', { user: req.user });
});

// API routes for chat functionality
app.get('/api/conversations', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.clientIp;
    const result = await pool.query(
      'SELECT id, title, created_at FROM conversations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.post('/api/conversations', isAuthenticated, async (req, res) => {
  try {
    // Use guest ID format when handling guest users
    const userId = req.user.isGuest ? req.user.id : req.user.id;
    const { title } = req.body;
    const result = await pool.query(
      'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *',
      [userId, title || 'New Conversation']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/conversations/:id/messages', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : req.clientIp;
    
    // Verify user owns this conversation
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized access to conversation' });
    }
    
    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/conversations/:id/messages', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : req.clientIp;
    const { content } = req.body;
    
    // Verify user owns this conversation
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized access to conversation' });
    }
    
    // Save user message
    await pool.query(
      'INSERT INTO messages (conversation_id, content, is_user) VALUES ($1, $2, $3)',
      [id, content, true]
    );
    
    // Call n8n webhook for RAG processing
    const ragResponse = await axios.post(config.n8nWebhookUrl, {
      message: content,
      conversation_id: id,
      user_id: userId
    });
    
    // Save bot response
    const botMessageResult = await pool.query(
      'INSERT INTO messages (conversation_id, content, is_user) VALUES ($1, $2, $3) RETURNING *',
      [id, ragResponse.data.response, false]
    );
    
    res.json(botMessageResult.rows[0]);
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
