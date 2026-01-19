// core depedencies
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import * as geoipLite from 'geoip-lite';
import { SocketService } from './src/services/socket.service';

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

app.get('/', (req, res) => {
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

// services init
SocketService.init(server);

app.get('/assets/*', function (req, res) {
  const requestedPath = req.params[0];
  // Sanitize path to prevent path traversal attacks
  const safePath = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.resolve(process.cwd(), '../assets', safePath);
  const assetsDir = path.resolve(process.cwd(), '../assets');

  // Ensure the resolved path is within the assets directory
  if (!fullPath.startsWith(assetsDir + path.sep) && fullPath !== assetsDir) {
    return res.status(403).send('Forbidden');
  }
  res.sendFile(fullPath);
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
