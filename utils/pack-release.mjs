import AdmZip from 'adm-zip';
import {exec} from "child_process";
import * as fs from "fs";

const dir = '.packs';
const manifests = {
    beta:    'manifest-beta.json',
    release: 'manifest.json'
};

const type = process.argv[2] ?? 'beta';

(async () => {
    try {
        if (!manifests[type]) {
            throw new Error(`Type must be one of ${Object.keys(manifests).join(',')}, got ${type}`);
        }

        await new Promise(r => exec('npm run build', r));

        const { id, version } = JSON.parse(fs.readFileSync(manifests[type], 'utf8'));

        const releaseName = `${id}-${version}`;
        const releaseDir = `${dir}/${releaseName}`;

        for (const d of [dir, releaseDir]) {
            if (!fs.existsSync(d)) {
                fs.mkdirSync(d);
            }
        }

        const zip = new AdmZip();

        for (const file of new Set(['main.js', 'styles.css', manifests.release, manifests[type]])) {
            zip.addLocalFile(file);
            fs.copyFileSync(file, `${releaseDir}/${file}`);
        }

        return new Promise(r => zip.writeZip(`${releaseDir}/${releaseName}.zip`, r));
    } catch (e) {
        console.error(e.message);
    }
})();