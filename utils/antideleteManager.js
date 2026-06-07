const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../database/antidelete.json');

function loadData() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify({ enabled: false }, null, 2)
    );
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  loadData,
  saveData
};
