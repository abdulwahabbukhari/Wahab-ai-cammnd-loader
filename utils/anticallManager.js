const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/anticall.json');

function ensureFile() {
  if (!fs.existsSync(dataPath)) {
    // Agar data folder nahi hai tou bana lein
    const dataDir = path.dirname(dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(
      dataPath,
      JSON.stringify(
        {
          enabled: false,
          warnings: {},
          blocked: {}
        },
        null,
        2
      )
    );
  }
}

function loadData() {
  ensureFile();
  return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
  loadData,
  saveData
};
