import { Pool } from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

class DatabaseManager {
  constructor() {
    this.db = null;
    this.pool = null;
    this.isPostgres = false;
  }

  async connect() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (databaseUrl && databaseUrl.startsWith('postgresql://')) {
      await this.connectPostgres(databaseUrl);
    } else {
      this.connectSQLite();
    }
  }

  async connectPostgres(databaseUrl) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    this.isPostgres = true;
    console.log('Connected to PostgreSQL');
    
    try {
      await this.pool.query('SELECT NOW()');
      console.log('PostgreSQL connection verified');
      await this.createTables();
    } catch (err) {
      console.error('PostgreSQL connection failed:', err);
      throw err;
    }
  }

  connectSQLite() {
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const dbPath = path.join(dbDir, 'society.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.isPostgres = false;
    console.log('Connected to SQLite:', dbPath);
    this.createTables();
  }

  async createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        house_no VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'resident',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(50) NOT NULL,
        event_date DATE NOT NULL,
        event_time VARCHAR(10),
        location VARCHAR(255),
        status VARCHAR(20) DEFAULT 'open',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS event_participants (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'participating',
        male_count INTEGER DEFAULT 0,
        female_count INTEGER DEFAULT 0,
        children_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS contributions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        month VARCHAR(7) NOT NULL,
        amount DECIMAL(10,2) DEFAULT 0,
        paid INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        payment_date DATE,
        admin_notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS amenities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity_available INTEGER DEFAULT 1,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS amenity_requests (
        id SERIAL PRIMARY KEY,
        amenity_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        required_date DATE NOT NULL,
        return_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        return_status VARCHAR(20) DEFAULT 'none',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS event_contributions (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        amount DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        payment_date DATE,
        admin_notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    if (this.isPostgres) {
      for (const query of queries) {
        try {
          await this.pool.query(query);
        } catch (err) {
          console.error('Table creation error:', err.message);
        }
      }
    } else {
      queries.forEach(query => {
        this.db.exec(query);
      });
    }
  }

  convertToPostgresSql(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  prepare(sql, params) {
    if (this.isPostgres) {
      const convertedSql = this.convertToPostgresSql(sql);
      return {
        run: (...params) => Promise.resolve(this.pool.query(convertedSql, params.length === 1 ? params[0] : params)),
        get: (...params) => Promise.resolve(this.pool.query(convertedSql, params.length === 1 ? params[0] : params)).then(res => res.rows[0]),
        all: (...params) => Promise.resolve(this.pool.query(convertedSql, params.length === 1 ? params[0] : params)).then(res => res.rows),
      };
    } else {
      const stmt = this.db.prepare(sql);
      return {
        run: (...params) => Promise.resolve(stmt.run(...params)),
        get: (...params) => Promise.resolve(stmt.get(...params)),
        all: (...params) => Promise.resolve(stmt.all(...params)),
      };
    }
  }

  exec(sql) {
    if (this.isPostgres) {
      return Promise.resolve(this.pool.query(sql));
    } else {
      return Promise.resolve(this.db.exec(sql));
    }
  }
}

export const db = new DatabaseManager();
