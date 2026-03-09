const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// ---------- In-memory mock data ----------
// Use recent dates so that the frontend's "Last 30 Days" filter can see data.
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

let users = [
  {
    id: 'u_1',
    name: 'ruiling tang',
    email: 'townraining@gmail.com',
    role: 'Admin',
    status: 'Active',
    joinedDate: '2024-01-10T00:00:00.000Z',
    avatar: 'https://ui-avatars.com/api/?name=ruilingtang&background=random',
  },
  {
    id: 'u_2',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'Editor',
    status: 'Active',
    joinedDate: '2024-02-05T00:00:00.000Z',
    avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=random',
  },
];

let sales = [
  {
    id: 's_1',
    customerName: 'Acme Inc.',
    productName: 'SaaS License Pro',
    amount: 149,
    currency: 'USD',
    status: 'Completed',
    date: daysAgo(3),
  },
  {
    id: 's_2',
    customerName: 'Globex',
    productName: 'SaaS License Enterprise',
    amount: 499,
    currency: 'USD',
    status: 'Pending',
    date: daysAgo(10),
  },
];

let currentUser = {
  id: 'u_1',
  name: 'ruiling tang',
  email: 'townraining@gmail.com',
};

let subscription = {
  plan: 'Pro',
  status: 'active',
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-02-01T00:00:00.000Z',
  isCanceled: false,
};

let invoices = [
  {
    id: 'inv_1',
    date: '2024-01-01T00:00:00.000Z',
    description: 'Pro Plan – January',
    amount: 29,
    currency: 'USD',
    status: 'paid',
  },
  {
    id: 'inv_2',
    date: '2024-02-01T00:00:00.000Z',
    description: 'Pro Plan – February',
    amount: 29,
    currency: 'USD',
    status: 'pending',
  },
];

// ---------- Simple auth middleware ----------

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized (mock)' });
  }
  next();
}

// ---------- 1. Auth ----------

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = users.find((u) => u.email === email) || currentUser;

  currentUser = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  res.json({
    token: 'mock-token-123',
    user: currentUser,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  const newUser = {
    id: `u_${uuid()}`,
    name,
    email,
    role: 'Viewer',
    status: 'Active',
    joinedDate: new Date().toISOString(),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name.replace(' ', '+'),
    )}&background=random`,
  };
  users.push(newUser);

  currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };

  res.status(201).json({
    token: 'mock-token-123',
    user: currentUser,
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(currentUser);
});

// ---------- 2. Users ----------

app.get('/api/users', authMiddleware, (req, res) => {
  res.json(users);
});

app.post('/api/users', authMiddleware, (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'name and email are required' });
  }
  const newUser = {
    id: `u_${uuid()}`,
    name,
    email,
    role: role || 'Viewer',
    status: 'Active',
    joinedDate: new Date().toISOString(),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name.replace(' ', '+'),
    )}&background=random`,
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });

  const { name, email, role, status } = req.body;
  users[idx] = {
    ...users[idx],
    ...(name && { name }),
    ...(email && { email }),
    ...(role && { role }),
    ...(status && { status }),
  };
  res.json(users[idx]);
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  users = users.filter((u) => u.id !== id);
  res.status(204).end();
});

// ---------- 3. Sales & Dashboard ----------

app.get('/api/sales', authMiddleware, (req, res) => {
  const { from, to, status, limit, sort } = req.query;
  let result = [...sales];

  if (status) {
    result = result.filter((s) => s.status === status);
  }
  if (from) {
    result = result.filter((s) => new Date(s.date) >= new Date(from));
  }
  if (to) {
    result = result.filter((s) => new Date(s.date) <= new Date(to));
  }

  if (sort === 'desc') {
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sort === 'asc') {
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  if (limit) {
    result = result.slice(0, Number(limit));
  }

  res.json(result);
});

app.post('/api/sales', authMiddleware, (req, res) => {
  const { customerName, productName, amount, status } = req.body;
  if (!customerName || !productName || !amount) {
    return res
      .status(400)
      .json({ message: 'customerName, productName and amount are required' });
  }
  const newSale = {
    id: `s_${uuid()}`,
    customerName,
    productName,
    amount,
    currency: 'USD',
    status: status || 'Pending',
    date: new Date().toISOString(),
  };
  sales.push(newSale);
  res.status(201).json(newSale);
});

app.put('/api/sales/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const idx = sales.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Sale not found' });

  const { customerName, productName, amount, status } = req.body;
  sales[idx] = {
    ...sales[idx],
    ...(customerName && { customerName }),
    ...(productName && { productName }),
    ...(amount && { amount }),
    ...(status && { status }),
  };
  res.json(sales[idx]);
});

app.delete('/api/sales/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  sales = sales.filter((s) => s.id !== id);
  res.status(204).end();
});

app.get('/api/dashboard/summary', authMiddleware, (req, res) => {
  const totalRevenue = sales
    .filter((s) => s.status === 'Completed')
    .reduce((sum, s) => sum + s.amount, 0);

  const totalSales = sales.length;
  const activeUsers = users.filter((u) => u.status === 'Active').length;
  const conversionRate = 3.2;

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  res.json({
    totalRevenue,
    totalSales,
    activeUsers,
    conversionRate,
    recentSales,
  });
});

// ---------- 4. Analytics ----------

app.get('/api/analytics/overview', authMiddleware, (req, res) => {
  res.json({
    revenueGrowthPercent: 12.5,
    deviceBreakdown: {
      labels: ['Desktop', 'Mobile', 'Tablet'],
      data: [62, 28, 10],
    },
    trafficSources: {
      labels: ['Organic', 'Paid', 'Referral', 'Direct'],
      data: [45, 25, 18, 12],
    },
    conversionFunnel: {
      labels: ['Visit', 'Sign Up', 'Trial', 'Converted'],
      data: [12000, 3000, 900, 360],
    },
    topProducts: {
      labels: ['SaaS License Basic', 'SaaS License Pro', 'SaaS License Enterprise'],
      data: [10000, 24000, 36000],
    },
    topCampaigns: {
      labels: ['Google Ads', 'LinkedIn', 'Newsletter'],
      data: [22000, 15000, 8000],
    },
    userGrowth: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      data: [100, 150, 230, 320, 450],
    },
  });
});

// ---------- 5. Billing & Subscription ----------

app.get('/api/billsubscription', authMiddleware, (req, res) => {
  res.json(subscription);
});

app.patch('/api/billsubscription', authMiddleware, (req, res) => {
  const { action } = req.body;

  if (action === 'upgrade') {
    if (subscription.plan === 'Free') subscription.plan = 'Pro';
    else if (subscription.plan === 'Pro') subscription.plan = 'Enterprise';
  } else if (action === 'downgrade') {
    if (subscription.plan === 'Enterprise') subscription.plan = 'Pro';
    else if (subscription.plan === 'Pro') subscription.plan = 'Free';
  } else if (action === 'cancel') {
    subscription.isCanceled = true;
    subscription.status = 'canceled';
    subscription.endDate = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
  } else if (action === 'reactivate') {
    subscription.isCanceled = false;
    subscription.status = 'active';
    subscription.endDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
  }

  res.json(subscription);
});

app.get('/api/billinvoice', authMiddleware, (req, res) => {
  res.json(invoices);
});

// ---------- Start server (skip when used as Vercel serverless) ----------

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Mock API server running at http://localhost:${PORT}`);
  });
}

module.exports = app;

