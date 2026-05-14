const fs = require('fs');
const path = require('path');

const DEFAULT_POINTS = 1000;

function normalizeName(name) {
  const value = String(name || '').trim().replace(/\s+/g, ' ');
  return value.slice(0, 20) || 'Player';
}

function readRanks(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return { accounts: {} };
  }
}

function writeRanks(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getAccount(filePath, rawName) {
  const name = normalizeName(rawName);
  const data = readRanks(filePath);
  if (!data.accounts) data.accounts = {};
  if (!data.accounts[name]) {
    data.accounts[name] = { name, rankPoints: DEFAULT_POINTS, wins: 0, losses: 0 };
    writeRanks(filePath, data);
  }
  return data.accounts[name];
}

function recordResult(filePath, winnerName, loserName, delta = 15) {
  const winner = getAccount(filePath, winnerName);
  const loser = getAccount(filePath, loserName);
  const data = readRanks(filePath);
  data.accounts[winner.name].rankPoints += delta;
  data.accounts[winner.name].wins += 1;
  data.accounts[loser.name].rankPoints = Math.max(0, data.accounts[loser.name].rankPoints - delta);
  data.accounts[loser.name].losses += 1;
  writeRanks(filePath, data);
  return { winner: data.accounts[winner.name], loser: data.accounts[loser.name] };
}

module.exports = {
  DEFAULT_POINTS,
  getAccount,
  normalizeName,
  readRanks,
  recordResult,
  writeRanks,
};
