import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET || 'sentosa-green-secret-key';

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const ensureSingleAdmin = async () => {
  try {
    const adminExists = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
    if (adminExists.count === 0) {
      const hashedPassword = bcrypt.hashSync('pass123', 10);
      try {
        await db.prepare('INSERT INTO users (house_no, name, phone, password, role) VALUES (?, ?, ?, ?, ?)')
          .run('ADMIN', 'Admin', '0000000000', hashedPassword, 'admin');
        console.log('Default admin user created: phone=0000000000, password=pass123');
      } catch (err) {
        console.log('Admin initialization note:', err.message);
      }
    }
  } catch (err) {
    console.error('Error ensuring admin:', err);
  }
};

const startServer = async () => {
  await db.connect();
  await ensureSingleAdmin();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${db.isPostgres ? 'PostgreSQL' : 'SQLite'}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { house_no, name, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminExists = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
    const role = adminExists.count === 0 ? 'admin' : 'resident';
    
    await db.prepare('INSERT INTO users (house_no, name, phone, email, password, role) VALUES (?, ?, ?, ?, ?, ?)')
      .run(house_no, name, phone, email, hashedPassword, role);
    
    res.json({ message: 'Registered successfully', role });
  } catch (err) {
    if (err.message.includes('house_no')) {
      res.status(400).json({ error: 'House number already registered. Please use a different house number.' });
    } else if (err.message.includes('phone')) {
      res.status(400).json({ error: 'Mobile number already registered. Please use a different mobile number.' });
    } else {
      res.status(400).json({ error: 'Registration failed. Please try again.' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, house_no: user.house_no, name: user.name, role: user.role, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, house_no: user.house_no, name: user.name, role: user.role, phone: user.phone, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await db.prepare('SELECT id, house_no, name, phone, email, role FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

app.get('/api/residents', authMiddleware, async (req, res) => {
  const { search, house_no } = req.query;
  let query = 'SELECT id, house_no, name, phone, email FROM users WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (name LIKE ? OR phone LIKE ? OR house_no LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (house_no) {
    query += ' AND house_no = ?';
    params.push(house_no);
  }
  
  query += ' ORDER BY house_no';
  const residents = await db.prepare(query).all(...params);
  res.json(residents);
});

app.put('/api/residents/me', authMiddleware, async (req, res) => {
  const { name, phone, email } = req.body;
  const updates = [];
  const params = [];
  
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  params.push(req.user.id);
  await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ message: 'Profile updated' });
});

app.post('/api/residents', authMiddleware, async (req, res) => {
  return res.status(403).json({ error: 'Admin cannot create residents' });
});

app.put('/api/residents/:id', authMiddleware, async (req, res) => {
  return res.status(403).json({ error: 'Admin cannot edit residents' });
});

app.delete('/api/residents/:id', authMiddleware, async (req, res) => {
  return res.status(403).json({ error: 'Admin cannot delete residents' });
});

app.post('/api/events', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, event_type, event_date, event_time, location } = req.body;
  const result = db.prepare('INSERT INTO events (title, description, event_type, event_date, event_time, location, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(title, description, event_type, event_date, event_time, location, 'open', req.user.id);
  res.json({ id: result.lastInsertRowid, message: 'Event created' });
});

app.put('/api/events/:id', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, event_type, event_date, event_time, location } = req.body;
  const updates = [];
  const params = [];
  
  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (event_type !== undefined) { updates.push('event_type = ?'); params.push(event_type); }
  if (event_date !== undefined) { updates.push('event_date = ?'); params.push(event_date); }
  if (event_time !== undefined) { updates.push('event_time = ?'); params.push(event_time); }
  if (location !== undefined) { updates.push('location = ?'); params.push(location); }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  params.push(req.params.id);
  await db.prepare(`UPDATE events SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ message: 'Event updated' });
});

app.put('/api/events/:id/close', authMiddleware, adminOnly, async (req, res) => {
  await db.prepare('UPDATE events SET status = ? WHERE id = ?').run('closed', req.params.id);
  res.json({ message: 'Event closed' });
});

app.put('/api/events/:id/open', authMiddleware, adminOnly, async (req, res) => {
  await db.prepare('UPDATE events SET status = ? WHERE id = ?').run('open', req.params.id);
  res.json({ message: 'Event reopened' });
});

app.get('/api/events', authMiddleware, async (req, res) => {
  const events = await db.prepare('SELECT * FROM events ORDER BY event_date DESC').all();
  const eventsWithParticipants = events.map(async (event) => {
    const participants = await db.prepare('SELECT ep.status, ep.male_count, ep.female_count, ep.children_count, u.name, u.house_no FROM event_participants ep JOIN users u ON ep.user_id = u.id WHERE ep.event_id = ?').all(event.id);
    const myParticipation = await db.prepare('SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?').get(event.id, req.user.id);
    return { ...event, participants, myParticipation: myParticipation || null };
  });
  res.json(eventsWithParticipants);
});

app.put('/api/events/:id/participate', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Admin cannot participate in events' });
  }
  
  const { status, male_count, female_count, children_count } = req.body;
  const eventId = req.params.id;
  
  db.prepare('INSERT OR REPLACE INTO event_participants (event_id, user_id, status, male_count, female_count, children_count) VALUES (?, ?, ?, ?, ?, ?)')
    .run(eventId, req.user.id, status, male_count || 0, female_count || 0, children_count || 0);
  
  res.json({ message: 'Participation updated' });
});

app.delete('/api/events/:id/participate', authMiddleware, async (req, res) => {
  await db.prepare('DELETE FROM event_participants WHERE event_id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Participation removed' });
});

app.get('/api/contributions', authMiddleware, async (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { month, search } = req.query;
  let query = `
    SELECT c.*, u.name, u.house_no 
    FROM contributions c 
    JOIN users u ON c.user_id = u.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (month) {
    query += ' AND c.month = ?';
    params.push(month);
  }
  
  if (search) {
    query += ' AND (u.name LIKE ? OR u.house_no LIKE ? OR u.phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY c.month DESC, u.house_no';
  
  const contributions = await db.prepare(query).all(...params);
  
  const contributionsWithAccess = contributions.map(c => ({
    ...c,
    canEdit: c.user_id === req.user.id
  }));
  
  res.json(contributionsWithAccess);
});

app.put('/api/contributions/:id', authMiddleware, async (req, res) => {
  const contribution = await db.prepare('SELECT * FROM contributions WHERE id = ?').get(req.params.id);
  
  if (!contribution) return res.status(404).json({ error: 'Contribution not found' });
  
  if (contribution.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Cannot modify this contribution' });
  }
  
  const { amount, payment_date } = req.body;
  db.prepare('UPDATE contributions SET amount = ?, payment_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(amount, payment_date || null, 'pending', req.params.id);
  
  res.json({ message: 'Contribution submitted for approval' });
});

app.post('/api/contributions/seed', authMiddleware, adminOnly, async (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const users = await db.prepare('SELECT id FROM users').all();
  
  const insert = db.prepare('INSERT OR IGNORE INTO contributions (user_id, month) VALUES (?, ?)');
  users.forEach(user => {
    insert.run(user.id, currentMonth);
  });
  
  res.json({ message: 'Monthly contributions seeded' });
});

app.post('/api/contributions/add', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Admin cannot add contributions' });
  }
  
  const { month, amount, payment_date } = req.body;
  
  db.prepare('INSERT INTO contributions (user_id, month, amount, paid, status, payment_date, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
    .run(req.user.id, month, amount, 0, 'pending', payment_date || null);
  
  res.json({ message: 'Contribution submitted for approval' });
});

app.put('/api/contributions/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  const { admin_notes } = req.body;
  await db.prepare('UPDATE contributions SET status = ?, paid = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', 1, admin_notes, req.params.id);
  res.json({ message: 'Contribution approved' });
});

app.put('/api/contributions/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  const { admin_notes } = req.body;
  await db.prepare('UPDATE contributions SET status = ?, paid = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('rejected', 0, admin_notes, req.params.id);
  res.json({ message: 'Contribution rejected' });
});

app.get('/api/events/:event_id/contributions', authMiddleware, async (req, res) => {
  const eventId = req.params.event_id;
  
  const contributions = db.prepare(`
    SELECT ec.*, u.name, u.house_no 
    FROM event_contributions ec 
    JOIN users u ON ec.user_id = u.id 
    WHERE ec.event_id = ?
    ORDER BY ec.updated_at DESC
  `).all(eventId);
  
  res.json(contributions);
});

app.post('/api/events/:event_id/contributions', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Admin cannot contribute to events' });
  }
  
  const eventId = req.params.event_id;
  const { amount, payment_date } = req.body;
  
  db.prepare('INSERT INTO event_contributions (event_id, user_id, amount, status, payment_date, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
    .run(eventId, req.user.id, amount, 'pending', payment_date || null);
  
  res.json({ message: 'Event contribution submitted for approval' });
});

app.put('/api/event-contributions/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  const { admin_notes } = req.body;
  await db.prepare('UPDATE event_contributions SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', admin_notes, req.params.id);
  res.json({ message: 'Event contribution approved' });
});

app.put('/api/event-contributions/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  const { admin_notes } = req.body;
  await db.prepare('UPDATE event_contributions SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('rejected', admin_notes, req.params.id);
  res.json({ message: 'Event contribution rejected' });
});

app.get('/api/events/:event_id/total-contributions', authMiddleware, async (req, res) => {
  const eventId = req.params.event_id;
  
  const total = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM event_contributions 
    WHERE event_id = ? AND status = 'approved'
  `).get(eventId);
  
  res.json({ total: total.total });
});

app.get('/api/amenities', authMiddleware, async (req, res) => {
  const amenities = await db.prepare('SELECT * FROM amenities').all();
  const amenitiesWithAvailability = amenities.map(amenity => {
    const approvedRequests = db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total 
      FROM amenity_requests 
      WHERE amenity_id = ? 
      AND status IN ('approved', 'returned', 'returned_approved')
    `).get(amenity.id);
    
    return {
      ...amenity,
      available_quantity: amenity.quantity_available - approvedRequests.total,
      total_quantity: amenity.quantity_available,
      taken_quantity: approvedRequests.total
    };
  });
  res.json(amenitiesWithAvailability);
});

app.get('/api/amenities/:id/availability', authMiddleware, async (req, res) => {
  const amenity = await db.prepare('SELECT * FROM amenities WHERE id = ?').get(req.params.id);
  
  if (!amenity) {
    return res.status(404).json({ error: 'Amenity not found' });
  }
  
  const approvedRequests = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total 
    FROM amenity_requests 
    WHERE amenity_id = ? 
    AND status IN ('approved', 'returned')
  `).get(req.params.id);
  
  const availableQuantity = amenity.quantity_available - approvedRequests.total;
  
  res.json({
    id: amenity.id,
    name: amenity.name,
    total_quantity: amenity.quantity_available,
    taken_quantity: approvedRequests.total,
    available_quantity: availableQuantity
  });
});

app.post('/api/amenities', authMiddleware, adminOnly, async (req, res) => {
  const { name, category, quantity_available, description } = req.body;
  const result = await db.prepare('INSERT INTO amenities (name, category, quantity_available, description) VALUES (?, ?, ?, ?)').run(name, category, quantity_available, description);
  res.json({ id: result.lastInsertRowid, message: 'Amenity added' });
});

app.post('/api/amenity-requests', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Admin cannot request amenities' });
  }
  
  const { amenity_id, quantity, required_date, return_date } = req.body;
  
  const amenity = await db.prepare('SELECT * FROM amenities WHERE id = ?').get(amenity_id);
  if (!amenity) {
    return res.status(404).json({ error: 'Amenity not found' });
  }
  
  const approvedRequests = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total 
    FROM amenity_requests 
    WHERE amenity_id = ? 
    AND status IN ('approved', 'returned')
  `).get(amenity_id);
  
  const availableQuantity = amenity.quantity_available - approvedRequests.total;
  
  if (quantity > availableQuantity) {
    return res.status(400).json({ 
      error: `Only ${availableQuantity} items available. ${approvedRequests.total} already taken.` 
    });
  }
  
  const result = db.prepare('INSERT INTO amenity_requests (amenity_id, user_id, quantity, required_date, return_date, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(amenity_id, req.user.id, quantity, required_date, return_date || null, 'pending');
  
  res.json({ id: result.lastInsertRowid, message: 'Request submitted', availableQuantity });
});

app.put('/api/amenity-requests/:id/return', authMiddleware, async (req, res) => {
  const request = await db.prepare('SELECT * FROM amenity_requests WHERE id = ?').get(req.params.id);
  
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Cannot mark this request as returned' });
  }
  
  await db.prepare('UPDATE amenity_requests SET return_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('returned', 'returned', req.params.id);
  res.json({ message: 'Amenity marked as returned' });
});

app.put('/api/amenity-requests/:id/approve-return', authMiddleware, adminOnly, async (req, res) => {
  const { admin_notes } = req.body;
  await db.prepare('UPDATE amenity_requests SET return_status = ?, status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('returned_approved', 'returned_approved', admin_notes, req.params.id);
  res.json({ message: 'Return approved' });
});

app.put('/api/amenity-requests/:id/reject-return', authMiddleware, adminOnly, async (req, res) => {
  const { admin_notes } = req.body;
  await db.prepare('UPDATE amenity_requests SET return_status = ?, status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('returned_rejected', 'approved', admin_notes, req.params.id);
  res.json({ message: 'Return rejected, status reverted to approved' });
});

app.get('/api/amenity-requests', authMiddleware, async (req, res) => {
  let query = `
    SELECT ar.*, a.name as amenity_name, u.name as user_name, u.house_no, u.phone
    FROM amenity_requests ar
    JOIN amenities a ON ar.amenity_id = a.id
    JOIN users u ON ar.user_id = u.id
  `;
  
  if (req.user.role !== 'admin') {
    query += ' WHERE ar.user_id = ?';
  }
  
  query += ' ORDER BY ar.created_at DESC';
  
  const requests = req.user.role !== 'admin' 
    ? await db.prepare(query).all(req.user.id)
    : await db.prepare(query).all();
  
  res.json(requests);
});

app.put('/api/amenity-requests/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  const { admin_notes } = req.body;
  await db.prepare('UPDATE amenity_requests SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', admin_notes, req.params.id);
  res.json({ message: 'Request approved' });
});

app.put('/api/amenity-requests/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  const { admin_notes } = req.body;
  await db.prepare('UPDATE amenity_requests SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('rejected', admin_notes, req.params.id);
  res.json({ message: 'Request rejected' });
});

app.get('/api/admin/stats', authMiddleware, adminOnly, async (req, res) => {
  const totalResidents = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('resident').count;
  const totalEvents = await db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  const pendingRequests = await db.prepare('SELECT COUNT(*) as count FROM amenity_requests WHERE status = ?').get('pending').count;
  const totalContributions = await db.prepare('SELECT SUM(amount) as total FROM contributions').get().total;
  
  res.json({
    totalResidents,
    totalEvents,
    pendingRequests,
    totalContributions: totalContributions || 0
  });
});
