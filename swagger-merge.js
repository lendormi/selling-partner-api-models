const fs = require('node:fs');
const path = require('node:path');
const folderPath = 'models';
const baseFileNAme = 'models/base.json';

const truncate = (str, n) => {
    if (str.length <= n) return str; // Nothing to do
    if (n <= 1) return "…"; // Well... not much else we can return here!
    let dot = str.lastIndexOf("."); // Where the extension starts
    // How many characters from the end should remain:
    let after = dot < 0 ? 1 : Math.max(1, Math.min(n - 2, str.length - dot + 2));
    // How many characters from the start should remain:
    let before = n - after - 1; // Account for the ellipsis
    return str.slice(0, before) + "…" + str.slice(-after);
}

const isFile = fileName => {
  return fs.lstatSync(fileName).isFile() && fileName.includes('.json');
};

let swaggerData = {};
try {
  const data = fs.readFileSync(baseFileNAme, 'utf8');
  swaggerData = JSON.parse(data);
} catch (err) {
  console.error(err);
  process.exit(1)
}

fs.readdirSync(folderPath, { recursive: true, force: true })
  .map(fileName => {
    return path.join(folderPath, fileName);
  })
  .filter(isFile)
  .map(filePath => {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const dataJson = JSON.parse(data);
      const { title: titleInfo, description: descriptionInfo } = dataJson.info;

      if (dataJson.paths && Object.keys(dataJson.paths).length > 0) {
        swaggerData.paths = {
          ...swaggerData.paths,
          ...Object.keys(dataJson.paths).reduce((r, pathUrl) => {
            r[pathUrl] = Object.keys(dataJson.paths[pathUrl]).reduce((r2, method) => {
              if (method !== 'parameters') {
                r2[method] = {
                  ...dataJson.paths[pathUrl][method],
                  description: `${descriptionInfo}\n\n${dataJson.paths[pathUrl][method].description}`,
                  summary: truncate(titleInfo, 120),
                }
              } else {
                r2.parameters = dataJson.paths[pathUrl].parameters;
              }
            return r2;
            }, {});
            return r;
          }, {}),
        }
      }
      if (dataJson.definitions && Object.keys(dataJson.definitions).length > 0) {
        swaggerData.definitions = {
          ...swaggerData.definitions,
          ...dataJson.definitions,
        }
      }
      if (dataJson.parameters && Object.keys(dataJson.parameters).length > 0) {
        swaggerData.parameters = {
          ...swaggerData.parameters,
          ...dataJson.parameters,
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
try {
  fs.writeFileSync('swagger-spapi.json', JSON.stringify(swaggerData, null, 2));
  // file written successfully
} catch (err) {
  console.error(err);
}


process.exit(0)