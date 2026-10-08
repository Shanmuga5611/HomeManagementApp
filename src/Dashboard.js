// Dashboard.js — first screen for Admin and User after login
import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Form, Spinner } from 'react-bootstrap';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { apiFetch } from './api';

const API_BASE_URL = 'https://homemanageapp.runasp.net/api/Transaction';
//const API_BASE_URL = 'https://localhost:7215/api/Transaction';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    apiFetch(API_BASE_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load data');
        return res.json();
      })
      .then(setData)
      .catch(() => setError('Unable to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  // Years that actually have data (+ current year)
  const years = useMemo(() => {
    const set = new Set([new Date().getFullYear().toString()]);
    data.forEach((t) => t.transactionDate && set.add(t.transactionDate.slice(0, 4)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [data]);

  // Month-wise totals for the selected year (all 12 months, so the flow line is continuous)
  const chartData = useMemo(() => {
    const months = MONTHS.map((m) => ({ month: m, income: 0, expense: 0, net: 0 }));

    data.forEach((t) => {
      if (!t.transactionDate || t.transactionDate.slice(0, 4) !== year) return;
      const idx = parseInt(t.transactionDate.slice(5, 7), 10) - 1;
      if (t.isMonthlyIncome) months[idx].income += t.incomeAmount || 0;
      else months[idx].expense += t.debitAmount || 0;
    });

    months.forEach((m) => { m.net = m.income - m.expense; });
    return months;
  }, [data, year]);

  const totals = useMemo(() => {
    const income = chartData.reduce((s, m) => s + m.income, 0);
    const expense = chartData.reduce((s, m) => s + m.expense, 0);
    return { income, expense, net: income - expense };
  }, [chartData]);

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      {/* Summary cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Total Income ({year})</div>
              <div className="fs-4 fw-bold" style={{ color: '#10b981' }}>{formatCurrency(totals.income)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Total Expense ({year})</div>
              <div className="fs-4 fw-bold" style={{ color: '#ef4444' }}>{formatCurrency(totals.expense)}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Net Balance ({year})</div>
              <div className="fs-4 fw-bold" style={{ color: totals.net >= 0 ? '#2563eb' : '#ef4444' }}>
                {formatCurrency(totals.net)}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Month-wise flow chart */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h5 className="mb-0">Income vs Expense — Month Wise</h5>
            <Form.Select
              size="sm"
              style={{ width: 'auto' }}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </Form.Select>
          </div>

          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={55} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeFill)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseFill)" />
                <Line type="monotone" dataKey="net" name="Net" stroke="#2563eb" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;