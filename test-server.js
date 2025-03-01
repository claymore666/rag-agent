// test-server.js
const express = require('express');
const path = require('path');
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('chat', { user: { username: 'Test' } });
});

app.listen(2003, () => {
  console.log('Test server running on port 2003');
});
