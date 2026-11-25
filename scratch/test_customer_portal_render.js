const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Simple mock of apiRequest
global.window = {};

// Let's test importing compiled React or checking components
console.log('React version:', React.version);
