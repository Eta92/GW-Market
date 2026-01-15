// core depedencies
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
//const path = require('path');
import * as geoipLite from 'geoip-lite';
import rateLimit from 'express-rate-limit';
import { SocketService } from './src/services/socket.service';
import { ItemService } from './src/services/item.service';
import { ShopService } from './src/services/shop.service';

// Hey folks, let me promote the new player to player marketplace, ez sell your stashes and buy stuff on gwmarket dot net !
// I am not a bot so feel free to ask any question :)
// I am running a event now, 1 ecto for each friend shop opened (I am not so rich), check more on reddit ! (I'm not a bot)

// Function to detect crawlers
function isCrawler(userAgent) {
  if (!userAgent) return false;
  const bots = ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider'];
  return bots.some((bot) => userAgent.includes(bot));
}

// core init
const app = express();

// Rate limiting to prevent DoS and brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => isCrawler(req.headers['user-agent']), // Allow search engine bots
});

// Apply rate limiting to all requests
app.use(limiter);

app.get('/', (req, res) => {
  //console.log('bis', req.path, req.headers['user-agent'], isCrawler(req.headers['user-agent']));
  if (isCrawler(req.headers['user-agent'])) {
    console.log('bot detected on home page');
    res.sendFile(path.join(process.cwd(), '..', 'client', 'dist', 'GWTrade', 'prerendered', 'index.html'));
  } else {
    res.sendFile(path.join(process.cwd(), '..', 'client', 'dist', 'GWTrade', 'browser', 'index.html'));
  }
});

app.use(express.static(process.cwd() + '/../client/dist/GWTrade/browser/'));
app.set('trust proxy', true);
const server = createServer(app);

// disable server cache in dev
// app.use((req, res, next) => {
//   if (process.env.development) {
//     console.log('no cache');
//     res.set('Cache-Control', 'no-store');
//   }
//   next();
// });

// services init
SocketService.init(server);

app.get('/assets/*', function (req, res) {
  var reqpath = req.url.toString().split('?')[0].split('/').slice(2).join('/');
  res.sendFile(path.join(process.cwd(), '../assets', reqpath));
});

app.get('*', function (req, res) {
  // ignore maps logs
  if (!req.url.endsWith('.map')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    // try to log origin of call
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log('New GW Market connexion from : ' + ip + ' in ' + geoipLite.lookup(ip));
  }
  // serve the application
  //console.log(req.path, req.headers['user-agent'], isCrawler(req.headers['user-agent']));
  if (isCrawler(req.headers['user-agent'])) {
    const route = req.path === '/' ? 'index.html' : `${req.path}.html`;
    console.log('bot detected on ' + route);
    res.sendFile(path.join(process.cwd(), '..', 'client', 'dist', 'GWTrade', 'prerendered', route));
  } else {
    res.sendFile(path.join(process.cwd(), '..', 'client', 'dist', 'GWTrade', 'browser', 'index.html'));
  }
});

server.listen(+process.env.serverPort, function () {
  console.log('');
  console.log('╔═════════════════════════╗');
  console.log('║    GW1 MARKET STARTED   ║');
  console.log('╚═╦═════════════════════╦═╝');
  console.log('  ║ ' + new Date().toISOString().substring(0, 19) + ' ║');
  console.log('  ║ listening port ' + process.env.serverPort + ' ║');
  console.log('  ╚══════ V0.3.0 ═══════╝  ');
  console.log('');
});
