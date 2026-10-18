import { BSON, Db } from 'mongodb';
import path from 'path';

const fs = require('fs');
const zlib = require('zlib');

// Daily dump of every collection of the market database.
// Each backup is a .zip holding one <collection>.json file per collection, in mongoexport format
// (canonical Extended JSON, one document per line), so it can be imported back with Studio 3T
// ("Import > JSON") or `mongoimport --db=GWTrade --collection=<name> --file=<name>.json`.
export class BackupService {
  private static readonly CHECK_INTERVAL = 60 * 60 * 1000; // 1h
  private static readonly BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24h
  private static readonly KEEP_COUNT = 30;
  private static backupDir = process.env.backupDir || path.join(process.cwd(), 'backups');
  private static mongoDB: Db;
  private static running = false;

  public static init(mongoDB: Db): void {
    this.mongoDB = mongoDB;
    // checking hourly instead of a plain 24h timer so server restarts don't delay or skip a backup
    this.checkBackup();
    setInterval(() => this.checkBackup(), this.CHECK_INTERVAL);
  }

  private static async checkBackup(): Promise<void> {
    try {
      const lastBackup = this.listBackups()[0];
      if (lastBackup && Date.now() - fs.statSync(path.join(this.backupDir, lastBackup)).mtimeMs < this.BACKUP_INTERVAL) {
        return;
      }
      await this.backup();
    } catch (err) {
      console.log('Error during database backup:', err);
    }
  }

  public static async backup(): Promise<string | null> {
    if (this.running) {
      return null;
    }
    this.running = true;
    try {
      fs.mkdirSync(this.backupDir, { recursive: true });
      const files: Array<{ name: string; data: Buffer }> = [];
      const collections = await this.mongoDB.listCollections({}, { nameOnly: true }).toArray();
      for (const collection of collections) {
        const lines: Array<string> = [];
        for await (const doc of this.mongoDB.collection(collection.name).find()) {
          lines.push(BSON.EJSON.stringify(doc, { relaxed: false }));
        }
        files.push({ name: `${collection.name}.json`, data: Buffer.from(lines.join('\n') + '\n', 'utf8') });
      }

      const date = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
      const fileName = `${this.mongoDB.databaseName}-${date}.zip`;
      const tmpPath = path.join(this.backupDir, fileName + '.tmp');
      fs.writeFileSync(tmpPath, this.createZip(files));
      fs.renameSync(tmpPath, path.join(this.backupDir, fileName));

      this.listBackups()
        .slice(this.KEEP_COUNT)
        .forEach((oldBackup) => fs.unlinkSync(path.join(this.backupDir, oldBackup)));

      console.log(`Database backup written: ${fileName} (${collections.length} collections)`);
      return fileName;
    } finally {
      this.running = false;
    }
  }

  // newest first
  private static listBackups(): Array<string> {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }
    const prefix = `${this.mongoDB.databaseName}-`;
    return fs
      .readdirSync(this.backupDir)
      .filter((file: string) => file.startsWith(prefix) && file.endsWith('.zip'))
      .sort()
      .reverse();
  }

  // minimal zip writer (deflate, no zip64) so backups open with the Windows explorer without extra tools
  private static createZip(files: Array<{ name: string; data: Buffer }>): Buffer {
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const localParts: Array<Buffer> = [];
    const centralParts: Array<Buffer> = [];
    let offset = 0;

    for (const file of files) {
      const name = Buffer.from(file.name, 'utf8');
      const compressed: Buffer = zlib.deflateRawSync(file.data, { level: 9 });
      const crc: number = zlib.crc32(file.data);

      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0);
      local.writeUInt16LE(20, 4); // version needed
      local.writeUInt16LE(0x0800, 6); // utf-8 names
      local.writeUInt16LE(8, 8); // deflate
      local.writeUInt16LE(dosTime, 10);
      local.writeUInt16LE(dosDate, 12);
      local.writeUInt32LE(crc, 14);
      local.writeUInt32LE(compressed.length, 18);
      local.writeUInt32LE(file.data.length, 22);
      local.writeUInt16LE(name.length, 26);
      localParts.push(local, name, compressed);

      const central = Buffer.alloc(46);
      central.writeUInt32LE(0x02014b50, 0);
      central.writeUInt16LE(20, 4); // version made by
      central.writeUInt16LE(20, 6); // version needed
      central.writeUInt16LE(0x0800, 8);
      central.writeUInt16LE(8, 10);
      central.writeUInt16LE(dosTime, 12);
      central.writeUInt16LE(dosDate, 14);
      central.writeUInt32LE(crc, 16);
      central.writeUInt32LE(compressed.length, 20);
      central.writeUInt32LE(file.data.length, 24);
      central.writeUInt16LE(name.length, 28);
      central.writeUInt32LE(offset, 42);
      centralParts.push(central, name);

      offset += local.length + name.length + compressed.length;
    }

    const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(files.length, 8);
    end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(centralSize, 12);
    end.writeUInt32LE(offset, 16);
    return Buffer.concat([...localParts, ...centralParts, end]);
  }
}
