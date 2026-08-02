// MonthlyIncomeExpenseManager.js
import React, { useState, useEffect, useMemo } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import 'bootstrap/dist/css/bootstrap.min.css';
import './MonthlyIncomeExpenseManager.css';

const MonthlyIncomeExpenseManager = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    transactionDate: "", 
    description: "",
    debitAmount: "",
    category: "food",
    isMonthlyIncome: false
  });
  const [incomeFormData, setIncomeFormData] = useState({
    transactionDate: "",
    incomeAmount: "",
    description: "Monthly Income"
  });
  const [reportFilters, setReportFilters] = useState({
    startDate: "",
    endDate: "",
    month: "",
    year: new Date().getFullYear().toString(),
    category: "all",
    transactionType: "all"
  });
  const [formErrors, setFormErrors] = useState({});
  const [incomeFormErrors, setIncomeFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [reportSummary, setReportSummary] = useState(null);
  const [activeView, setActiveView] = useState('transactions');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [viewMode, setViewMode] = useState('current');
  const [expandedRows, setExpandedRows] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const API_BASE_URL = 'https://homemanageapp.runasp.net/api/Transaction';
  const categories = ["food", "transport", "utilities", "entertainment", "shopping", "healthcare", "education", "other"];

  // Helper functions
  function getCurrentMonth() {
    const now = new Date();
    return now.toISOString().slice(0, 7);
  }

  function formatMonthDisplay(month) {
    const [year, monthNum] = month.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function getCategoryColor(category) {
    const colors = {
      food: '#e74c3c',
      transport: '#3498db',
      utilities: '#f39c12',
      entertainment: '#9b59b6',
      shopping: '#1abc9c',
      healthcare: '#e67e22',
      education: '#2ecc71',
      income: '#27ae60',
      other: '#95a5a6'
    };
    return colors[category] || '#95a5a6';
  }

  // API Calls
  useEffect(() => {
    getdata();
    getMonthlySummary();
    getCurrentBalance();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (viewMode === 'current') {
      setSelectedMonth(getCurrentMonth());
    }
  }, [viewMode]);

  const getdata = () => {
    setLoading(true);
    fetch(API_BASE_URL)
      .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((result) => {
        setData(result);
        setFilteredData(result);
        setLoading(false);
      })
      .catch((error) => {
        console.log('Error fetching data:', error);
        setLoading(false);
      });
  };

  const getMonthlySummary = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    fetch(`${API_BASE_URL}/monthly-summary/${year}/${month}`)
      .then((response) => response.json())
      .then((summary) => setMonthlySummary(summary))
      .catch((error) => console.log('Error fetching monthly summary:', error));
  };

  const getCurrentBalance = () => {
    fetch(`${API_BASE_URL}/current-balance`)
      .then((response) => response.json())
      .then((balance) => setCurrentBalance(balance))
      .catch((error) => console.log('Error fetching current balance:', error));
  };

  // CRUD Operations
  const handleShowModal = (type, id = null) => {
    setModalType(type);
    if (type === 'edit' && id) {
      setEditId(id);
      const itemToEdit = data.find((item) => item.id === id);
      setFormData({
        transactionDate: itemToEdit?.transactionDate?.split('T')[0] || "",
        description: itemToEdit?.description || "",
        debitAmount: itemToEdit?.debitAmount || 0,
        category: itemToEdit?.category || "food",
        isMonthlyIncome: itemToEdit?.isMonthlyIncome || false
      });
    } else {
      setFormData({ 
        transactionDate: new Date().toISOString().split('T')[0],
        description: "",
        debitAmount: 0,
        category: "food",
        isMonthlyIncome: false
      });
    }
    setShowModal(true);
    setFormErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const apiData = {
      transactionDate: formData.transactionDate,
      incomeAmount: formData.isMonthlyIncome ? formData.debitAmount : 0,
      creditAmount: 0,
      debitAmount: formData.isMonthlyIncome ? 0 : formData.debitAmount,
      description: formData.description,
      category: formData.category,
      isMonthlyIncome: formData.isMonthlyIncome
    };

    if (modalType === 'edit') apiData.id = editId;

    const requestOptions = {
      method: modalType === 'add' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData)
    };

    const url = modalType === 'add' ? API_BASE_URL : `${API_BASE_URL}/${editId}`;

    fetch(url, requestOptions)
      .then((response) => {
        if (!response.ok) return response.text().then(text => { throw new Error(text) });
        return response.json();
      })
      .then(() => {
        getdata();
        getMonthlySummary();
        getCurrentBalance();
        handleCloseModal();
      })
      .catch((error) => {
        console.log('Error submitting data:', error);
        alert('Error: ' + error.message);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' })
        .then((response) => {
          if (!response.ok) throw new Error('Network response was not ok');
          getdata();
          getMonthlySummary();
          getCurrentBalance();
        })
        .catch((error) => {
          console.log('Error deleting data:', error);
          alert('Error deleting transaction');
        });
    }
  };

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    if (!validateIncomeForm()) return;

    const apiData = {
      transactionDate: incomeFormData.transactionDate,
      incomeAmount: incomeFormData.incomeAmount,
      creditAmount: 0,
      debitAmount: 0,
      description: incomeFormData.description,
      category: "income",
      isMonthlyIncome: true
    };

    fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData)
    })
      .then((response) => {
        if (!response.ok) return response.text().then(text => { throw new Error(text) });
        return response.json();
      })
      .then(() => {
        getdata();
        getMonthlySummary();
        getCurrentBalance();
        handleCloseIncomeModal();
      })
      .catch((error) => {
        console.log('Error submitting income data:', error);
        alert('Error: ' + error.message);
      });
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.transactionDate) errors.transactionDate = 'Transaction Date is required';
    if (formData.debitAmount <= 0 && !formData.isMonthlyIncome) errors.debitAmount = 'Expense Amount must be greater than 0';
    if (!formData.description.trim()) errors.description = 'Description is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateIncomeForm = () => {
    const errors = {};
    if (!incomeFormData.transactionDate) errors.transactionDate = 'Transaction Date is required';
    if (incomeFormData.incomeAmount <= 0) errors.incomeAmount = 'Income Amount must be greater than 0';
    setIncomeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Report Generation
  const generateReport = () => {
    let filtered = [...data];
    if (reportFilters.startDate && reportFilters.endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.transactionDate);
        const startDate = new Date(reportFilters.startDate);
        const endDate = new Date(reportFilters.endDate);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
    if (reportFilters.month && reportFilters.year) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.transactionDate);
        return itemDate.getMonth() + 1 === parseInt(reportFilters.month) && 
               itemDate.getFullYear() === parseInt(reportFilters.year);
      });
    }
    if (reportFilters.year && !reportFilters.month) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.transactionDate);
        return itemDate.getFullYear() === parseInt(reportFilters.year);
      });
    }
    if (reportFilters.category !== "all") {
      filtered = filtered.filter(item => item.category === reportFilters.category);
    }
    if (reportFilters.transactionType === "income") {
      filtered = filtered.filter(item => item.isMonthlyIncome === true);
    } else if (reportFilters.transactionType === "expense") {
      filtered = filtered.filter(item => item.isMonthlyIncome === false);
    }

    setFilteredData(filtered);

    const incomeTransactions = filtered.filter(item => item.isMonthlyIncome);
    const expenseTransactions = filtered.filter(item => !item.isMonthlyIncome);

    const summary = {
      totalIncome: incomeTransactions.reduce((sum, item) => sum + (item.incomeAmount || 0), 0),
      totalExpenses: expenseTransactions.reduce((sum, item) => sum + (item.debitAmount || 0), 0),
      totalTransactions: filtered.length,
      netBalance: incomeTransactions.reduce((sum, item) => sum + (item.incomeAmount || 0), 0) - 
                 expenseTransactions.reduce((sum, item) => sum + (item.debitAmount || 0), 0),
      categoryBreakdown: categories.reduce((acc, category) => {
        acc[category] = expenseTransactions
          .filter(item => item.category === category)
          .reduce((sum, item) => sum + item.debitAmount, 0);
        return acc;
      }, {}),
      monthlyIncomeCount: incomeTransactions.length,
      monthlyExpenseCount: expenseTransactions.length
    };

    setReportSummary(summary);
    setShowReportModal(false);
  };

  const resetReportFilters = () => {
    setReportFilters({
      startDate: "",
      endDate: "",
      month: "",
      year: new Date().getFullYear().toString(),
      category: "all",
      transactionType: "all"
    });
    setFilteredData(data);
    setReportSummary(null);
    setViewMode('current');
    setSelectedMonth(getCurrentMonth());
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : 
              name === 'debitAmount' ? parseFloat(value) || 0 : value
    });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handleIncomeInputChange = (e) => {
    const { name, value } = e.target;
    setIncomeFormData({
      ...incomeFormData,
      [name]: name === 'incomeAmount' ? parseFloat(value) || 0 : value
    });
    if (incomeFormErrors[name]) {
      setIncomeFormErrors({ ...incomeFormErrors, [name]: '' });
    }
  };

  const handleReportFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilters({ ...reportFilters, [name]: value });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormErrors({});
  };

  const handleCloseIncomeModal = () => {
    setShowIncomeModal(false);
    setIncomeFormErrors({});
  };

  const handleShowIncomeModal = () => {
    setIncomeFormData({
      transactionDate: new Date().toISOString().split('T')[0],
      incomeAmount: "",
      description: "Monthly Income"
    });
    setShowIncomeModal(true);
    setIncomeFormErrors({});
  };

  // Calculate cumulative balance
  const calculateCumulativeBalance = (transactions) => {
    let balance = 0;
    return transactions.map(transaction => {
      if (transaction.isMonthlyIncome) {
        balance += transaction.incomeAmount || 0;
      } else {
        balance -= transaction.debitAmount || 0;
      }
      return { ...transaction, cumulativeBalance: balance };
    });
  };

  // Generate available months
  const availableMonths = useMemo(() => {
    if (!data || data.length === 0) {
      return [{ value: getCurrentMonth(), label: formatMonthDisplay(getCurrentMonth()) }];
    }
    const monthsSet = new Set();
    data.forEach(item => {
      if (item.transactionDate) {
        const month = item.transactionDate.slice(0, 7);
        monthsSet.add(month);
      }
    });
    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map(month => ({ value: month, label: formatMonthDisplay(month) }));
  }, [data]);

  // Filter data
  const filteredDatas = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (viewMode === 'all') return data;
    const monthToFilter = viewMode === 'current' ? getCurrentMonth() : selectedMonth;
    return data.filter(item => {
      if (!item.transactionDate) return false;
      return item.transactionDate.slice(0, 7) === monthToFilter;
    });
  }, [data, viewMode, selectedMonth]);

  const summary = useMemo(() => {
    if (filteredDatas.length === 0) return { income: 0, expense: 0, net: 0 };
    return filteredDatas.reduce(
      (acc, item) => {
        if (item.isMonthlyIncome) {
          acc.income += item.incomeAmount || 0;
        } else {
          acc.expense += item.debitAmount || 0;
        }
        acc.net = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, net: 0 }
    );
  }, [filteredDatas]);

  const sortedData = activeView === 'transactions' 
    ? [...filteredDatas].sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate))
    : [...filteredData].sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));

  const dataWithCumulative = calculateCumulativeBalance(sortedData);

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Render mobile card view
  const renderMobileCard = (item, index) => {
    const isExpanded = expandedRows[item.id];
    return (
      <div 
        key={item.id || index} 
        className="mobile-transaction-card"
        onClick={() => toggleRowExpansion(item.id)}
      >
        <div className="card-header-section">
          <div className="card-header-left">
            <span className="card-index">#{index + 1}</span>
            <span className={`badge ${item.isMonthlyIncome ? 'bg-success' : 'bg-warning'}`}>
              {item.isMonthlyIncome ? 'Income' : 'Expense'}
            </span>
            <span className="card-category-badge" style={{ 
              backgroundColor: getCategoryColor(item.category),
              color: 'white'
            }}>
              {item.category}
            </span>
          </div>
          <div className="card-header-right">
            <span className="card-amount" style={{ 
              color: item.isMonthlyIncome ? "#27ae60" : "#e74c3c"
            }}>
              {formatCurrency(item.isMonthlyIncome ? item.incomeAmount : item.debitAmount)}
            </span>
            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} card-toggle-icon`}></i>
          </div>
        </div>
        
        <div className="card-body-section">
          <div className="card-detail-row">
            <span className="detail-label">Date</span>
            <span className="detail-value">{formatDate(item.transactionDate)}</span>
          </div>
          <div className="card-detail-row">
            <span className="detail-label">Description</span>
            <span className="detail-value">{item.description || 'N/A'}</span>
          </div>
          {activeView === 'transactions' && (
            <div className="card-detail-row">
              <span className="detail-label">Balance</span>
              <span className="detail-value" style={{ 
                color: item.cumulativeBalance >= 0 ? "#27ae60" : "#e74c3c",
                fontWeight: "bold"
              }}>
                {formatCurrency(item.cumulativeBalance)}
              </span>
            </div>
          )}
        </div>
        
        {isExpanded && activeView === 'transactions' && (
          <div className="card-actions-section">
            <Button
              variant="outline-primary"
              size="sm"
              className="card-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleShowModal('edit', item.id);
              }}
            >
              <i className="bi bi-pencil me-1"></i> Edit
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              className="card-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
            >
              <i className="bi bi-trash me-1"></i> Delete
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Export functions
  const exportToCSV = () => {
    const exportData = reportFilters.transactionType === 'expense' 
      ? sortedData.filter(item => !item.isMonthlyIncome)
      : sortedData;

    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const csvData = exportData.map(item => [
      formatDate(item.transactionDate),
      item.isMonthlyIncome ? 'Income' : 'Expense',
      item.category,
      item.description,
      item.isMonthlyIncome ? item.incomeAmount : item.debitAmount
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const exportData = reportFilters.transactionType === 'expense' 
      ? sortedData.filter(item => !item.isMonthlyIncome)
      : sortedData;

    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Financial Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; text-align: center; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
            .summary-card { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; }
            .table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background-color: #8b80f3; color: white; }
            .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .badge-income { background: #27ae60; color: white; }
            .badge-expense { background: #f39c12; color: white; }
            .income-color { color: #27ae60; }
            .expense-color { color: #e74c3c; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Financial Report</h1>
          <p style="text-align: center;">Generated on: ${new Date().toLocaleString()}</p>
          ${reportSummary ? `
            <div class="summary-grid">
              <div class="summary-card"><h3>Total Income</h3><span class="income-color">${formatCurrency(reportSummary.totalIncome)}</span></div>
              <div class="summary-card"><h3>Total Expenses</h3><span class="expense-color">${formatCurrency(reportSummary.totalExpenses)}</span></div>
              <div class="summary-card"><h3>Net Balance</h3><span style="color: ${reportSummary.netBalance >= 0 ? '#27ae60' : '#e74c3c'}">${formatCurrency(reportSummary.netBalance)}</span></div>
              <div class="summary-card"><h3>Transactions</h3><span>${reportSummary.totalTransactions}</span></div>
            </div>
          ` : ''}
          <h2>Transaction Details</h2>
          <table class="table">
            <thead><tr><th>#</th><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              ${exportData.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${formatDate(item.transactionDate)}</td>
                  <td><span class="badge ${item.isMonthlyIncome ? 'badge-income' : 'badge-expense'}">${item.isMonthlyIncome ? 'Income' : 'Expense'}</span></td>
                  <td>${item.category}</td>
                  <td>${item.description || 'N/A'}</td>
                  <td style="font-weight: bold; color: ${item.isMonthlyIncome ? '#27ae60' : '#e74c3c'}">${formatCurrency(item.isMonthlyIncome ? item.incomeAmount : item.debitAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Generated from Monthly Income & Expense Manager</div>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Container fluid className="finance-manager-container">
      {/* Header */}
      <Row className="mb-3 mb-md-4">
        <Col xs={12}>
          <div className="finance-header">
            <div className="finance-header-left">
              <div className="finance-header-icon">
                <i className="bi bi-cash-stack"></i>
              </div>
              <div>
                <h1 className="finance-header-title">
                  <span className="d-none d-sm-inline">Monthly Income & Expense Manager</span>
                  <span className="d-inline d-sm-none">Finance Manager</span>
                </h1>
                <p className="finance-header-subtitle d-none d-sm-block">
                  Track and manage your financial transactions
                </p>
              </div>
            </div>
            <div className="finance-header-actions">
              <Button 
                variant={activeView === 'transactions' ? 'primary' : 'outline-primary'}
                className="header-action-btn"
                onClick={() => {
                  setActiveView('transactions');
                  setViewMode('current');
                  setSelectedMonth(getCurrentMonth());
                }}
              >
                <i className="bi bi-list-ul me-1"></i>
                <span className="d-none d-sm-inline">Transactions</span>
                <span className="d-inline d-sm-none">Txns</span>
              </Button>
              <Button 
                variant={activeView === 'report' ? 'primary' : 'outline-primary'}
                className="header-action-btn"
                onClick={() => setActiveView('report')}
              >
                <i className="bi bi-graph-up me-1"></i>
                <span className="d-none d-sm-inline">Reports</span>
                <span className="d-inline d-sm-none">Reports</span>
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Balance Card */}
      {activeView === 'transactions' && (
        <Row className="mb-3 mb-md-4">
          <Col xs={12}>
            <Card className="balance-card">
              <Card.Body className="balance-card-body">
                <div className="balance-card-header">
                  <h5 className="balance-card-title">
                    <i className="bi bi-wallet2 me-2"></i>
                    <span className="d-none d-sm-inline">Current Financial Status</span>
                    <span className="d-inline d-sm-none">Financial Status</span>
                  </h5>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={handleShowIncomeModal}
                    className="add-income-btn"
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    <span className="d-none d-sm-inline">Add Monthly Income</span>
                    <span className="d-inline d-sm-none">Add Income</span>
                  </Button>
                </div>
                
                <div className="balance-grid">
                  <div className="balance-item">
                    <span className="balance-item-label">Balance</span>
                    <span className="balance-item-value" style={{ 
                      color: currentBalance >= 0 ? '#27ae60' : '#e74c3c'
                    }}>
                      {formatCurrency(currentBalance)}
                    </span>
                  </div>
                  {monthlySummary && (
                    <>
                      <div className="balance-item">
                        <span className="balance-item-label">Income</span>
                        <span className="balance-item-value" style={{ color: '#27ae60' }}>
                          {formatCurrency(monthlySummary.totalIncome)}
                        </span>
                      </div>
                      <div className="balance-item">
                        <span className="balance-item-label">Expenses</span>
                        <span className="balance-item-value" style={{ color: '#e74c3c' }}>
                          {formatCurrency(monthlySummary.totalDebit)}
                        </span>
                      </div>
                      <div className="balance-item">
                        <span className="balance-item-label">Remaining</span>
                        <span className="balance-item-value" style={{ 
                          color: (monthlySummary.totalIncome - monthlySummary.totalDebit) >= 0 ? '#27ae60' : '#e74c3c'
                        }}>
                          {formatCurrency(monthlySummary.totalIncome - monthlySummary.totalDebit)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Report Summary */}
      {activeView === 'report' && reportSummary && (
        <Row className="mb-3 mb-md-4">
          <Col xs={12}>
            <Card className="report-summary-card">
              <Card.Body className="report-summary-body">
                <div className="report-summary-header">
                  <h5 className="report-summary-title">
                    <i className="bi bi-bar-chart me-2"></i>
                    Report Summary
                  </h5>
                  <div className="report-export-actions">
                    <Button variant="outline-success" size="sm" onClick={exportToCSV}>
                      <i className="bi bi-file-earmark-excel me-1"></i>
                      <span className="d-none d-sm-inline">CSV</span>
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={exportToPDF}>
                      <i className="bi bi-file-earmark-pdf me-1"></i>
                      <span className="d-none d-sm-inline">PDF</span>
                    </Button>
                  </div>
                </div>
                
                <div className="report-summary-grid">
                  <div className="report-summary-item">
                    <span className="report-summary-label">Total Income</span>
                    <span className="report-summary-value income-color">{formatCurrency(reportSummary.totalIncome)}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="report-summary-label">Total Expenses</span>
                    <span className="report-summary-value expense-color">{formatCurrency(reportSummary.totalExpenses)}</span>
                  </div>
                  <div className="report-summary-item">
                    <span className="report-summary-label">Net Balance</span>
                    <span className={`report-summary-value ${reportSummary.netBalance >= 0 ? 'net-positive' : 'net-negative'}`}>
                      {formatCurrency(reportSummary.netBalance)}
                    </span>
                  </div>
                  <div className="report-summary-item">
                    <span className="report-summary-label">Transactions</span>
                    <span className="report-summary-value" style={{ color: '#3498db' }}>{reportSummary.totalTransactions}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      {/* Action Buttons */}
      <Row className="mb-3 mb-md-4">
        <Col xs={12}>
          <div className="action-buttons-container">
            {activeView === 'transactions' ? (
              <>
                <Button 
                  onClick={() => handleShowModal('add')}
                  className="action-btn action-btn-primary"
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  <span className="d-none d-sm-inline">Add Transaction</span>
                  <span className="d-inline d-sm-none">Add</span>
                </Button>
                <Button 
                  variant="info"
                  onClick={() => {
                    getdata();
                    getMonthlySummary();
                    getCurrentBalance();
                  }}
                  className="action-btn action-btn-info"
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  <span className="d-none d-sm-inline">Refresh</span>
                  <span className="d-inline d-sm-none">Refresh</span>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => setShowReportModal(true)}
                  variant="primary"
                  className="action-btn action-btn-primary"
                >
                  <i className="bi bi-funnel me-2"></i>
                  <span className="d-none d-sm-inline">Filter Report</span>
                  <span className="d-inline d-sm-none">Filter</span>
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={resetReportFilters}
                  className="action-btn action-btn-secondary"
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  <span className="d-none d-sm-inline">Reset Filters</span>
                  <span className="d-inline d-sm-none">Reset</span>
                </Button>
              </>
            )}
          </div>
        </Col>
      </Row>
      
      {/* Main Card */}
      <Card className="main-content-card">
        {/* Filter Controls */}
        {activeView === 'transactions' && (
          <Card.Header className="filter-controls-header">
            <div className="filter-controls-wrapper">
              <div className="filter-controls-left">
                <h5 className="filter-controls-title">
                  {viewMode === 'current' ? 'Current Month' : 
                   viewMode === 'select' ? formatMonthDisplay(selectedMonth) : 
                   'All Transactions'}
                </h5>
                
                {filteredDatas.length > 0 && (
                  <div className="filter-controls-badges">
                    <span className="badge bg-success filter-badge">
                      <span className="d-none d-sm-inline">Income: </span>
                      {formatCurrency(summary.income)}
                    </span>
                    <span className="badge bg-warning filter-badge">
                      <span className="d-none d-sm-inline">Expense: </span>
                      {formatCurrency(summary.expense)}
                    </span>
                    <span className={`badge ${summary.net >= 0 ? 'bg-info' : 'bg-danger'} filter-badge`}>
                      <span className="d-none d-sm-inline">Net: </span>
                      {formatCurrency(summary.net)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="filter-controls-right">
                <DropdownButton
                  variant="outline-primary"
                  title={<span><i className="bi bi-calendar me-1"></i>{viewMode === 'current' ? 'Current' : viewMode === 'select' ? 'Select' : 'All'}</span>}
                  onSelect={(eventKey) => setViewMode(eventKey)}
                  size="sm"
                  className="filter-dropdown"
                >
                  <Dropdown.Item eventKey="current" active={viewMode === 'current'}>
                    <i className="bi bi-calendar-check me-2"></i>Current Month
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="select" active={viewMode === 'select'}>
                    <i className="bi bi-calendar-month me-2"></i>Select Month
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="all" active={viewMode === 'all'}>
                    <i className="bi bi-calendar-range me-2"></i>All Months
                  </Dropdown.Item>
                </DropdownButton>
                
                {viewMode === 'select' && (
                  <DropdownButton
                    variant="outline-secondary"
                    title={<span className="d-none d-sm-inline">{formatMonthDisplay(selectedMonth)}</span>}
                    onSelect={(month) => setSelectedMonth(month)}
                    size="sm"
                    className="filter-dropdown"
                  >
                    {availableMonths.map((month) => (
                      <Dropdown.Item 
                        key={month.value} 
                        eventKey={month.value}
                        active={selectedMonth === month.value}
                      >
                        {month.label}
                      </Dropdown.Item>
                    ))}
                  </DropdownButton>
                )}
              </div>
            </div>
          </Card.Header>
        )}

        <Card.Body className="main-content-body p-0">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading transactions...</p>
            </div>
          ) : (
            <>
              {/* Summary Info */}
              {activeView === 'transactions' && viewMode !== 'all' && filteredDatas.length > 0 && (
                <div className="summary-info-bar">
                  <span className="summary-info-text">
                    Showing {filteredDatas.length} transaction{filteredDatas.length !== 1 ? 's' : ''} 
                    <span className="d-none d-sm-inline"> for {viewMode === 'current' ? 'this month' : formatMonthDisplay(selectedMonth)}</span>
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setViewMode('all')}
                    className="summary-view-all-btn"
                  >
                    View All
                  </Button>
                </div>
              )}

              {/* Desktop Table */}
              <div className="d-none d-md-block table-responsive">
                <Table hover className="transactions-table mb-0">
                  <thead>
                    <tr>
                      <th className="ps-4">#</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Category</th>
                      <th>Description</th>
                      {activeView === 'transactions' && <th>Balance</th>}
                      {activeView === 'transactions' && <th>Created</th>}
                      {activeView === 'transactions' && <th className="text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {dataWithCumulative && dataWithCumulative.length > 0 ? (
                      dataWithCumulative
                        .filter(item => {
                          if (activeView === 'report' && reportFilters.transactionType === 'expense') {
                            return !item.isMonthlyIncome;
                          }
                          return true;
                        })
                        .map((item, index) => (
                          <tr 
                            key={item.id || index} 
                            className="transaction-row"
                            onClick={() => activeView === 'transactions' && handleShowModal('edit', item.id)}
                          >
                            <td className="ps-4 fw-bold">{index + 1}</td>
                            <td>{formatDate(item.transactionDate)}</td>
                            <td>
                              <span className={`badge ${item.isMonthlyIncome ? 'bg-success' : 'bg-warning'}`}>
                                {item.isMonthlyIncome ? 'Income' : 'Expense'}
                              </span>
                            </td>
                            <td style={{ 
                              color: item.isMonthlyIncome ? "#27ae60" : "#e74c3c", 
                              fontWeight: "bold" 
                            }}>
                              {formatCurrency(item.isMonthlyIncome ? item.incomeAmount : item.debitAmount)}
                            </td>
                            <td>
                              <span className="category-badge" style={{ 
                                backgroundColor: getCategoryColor(item.category)
                              }}>
                                {item.category}
                              </span>
                            </td>
                            <td>{item.description || 'N/A'}</td>
                            {activeView === 'transactions' && (
                              <>
                                <td style={{ 
                                  color: item.cumulativeBalance >= 0 ? "#27ae60" : "#e74c3c", 
                                  fontWeight: "bold" 
                                }}>
                                  {formatCurrency(item.cumulativeBalance)}
                                </td>
                                <td style={{ fontSize: "0.9em" }}>{formatDate(item.createdAt)}</td>
                                <td>
                                  <div className="action-buttons-cell" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="action-cell-btn me-2"
                                      onClick={() => handleShowModal('edit', item.id)}
                                    >
                                      <i className="bi bi-pencil me-1"></i>
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="action-cell-btn"
                                      onClick={() => handleDelete(item.id)}
                                    >
                                      <i className="bi bi-trash me-1"></i>
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={activeView === 'transactions' ? "9" : "6"} className="text-center py-5">
                          <i className="bi bi-calendar-x empty-state-icon"></i>
                          <p className="mt-3">No transactions found</p>
                          {activeView === 'transactions' && (
                            <Button 
                              onClick={() => handleShowModal('add')}
                              variant="primary"
                              className="mt-2"
                            >
                              <i className="bi bi-plus-lg me-2"></i>
                              Add Your First Transaction
                            </Button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="d-block d-md-none">
                {dataWithCumulative && dataWithCumulative.length > 0 ? (
                  dataWithCumulative
                    .filter(item => {
                      if (activeView === 'report' && reportFilters.transactionType === 'expense') {
                        return !item.isMonthlyIncome;
                      }
                      return true;
                    })
                    .map((item, index) => renderMobileCard(item, index))
                ) : (
                  <div className="empty-state-mobile">
                    <i className="bi bi-calendar-x empty-state-icon"></i>
                    <p className="mt-3">No transactions found</p>
                    {activeView === 'transactions' && (
                      <Button 
                        onClick={() => handleShowModal('add')}
                        variant="primary"
                        className="mt-2"
                      >
                        <i className="bi bi-plus-lg me-2"></i>
                        Add Transaction
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </Card.Body>

        {/* Footer */}
        {activeView === 'transactions' && filteredDatas.length > 0 && viewMode !== 'all' && (
          <Card.Footer className="table-footer">
            <div className="table-footer-content">
              <span className="table-footer-info">
                <i className="bi bi-info-circle me-1"></i>
                <span className="d-none d-sm-inline">Click on a row to edit transaction</span>
                <span className="d-inline d-sm-none">Tap card to expand</span>
              </span>
              <div className="table-footer-nav">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    const currentMonthIndex = availableMonths.findIndex(m => m.value === selectedMonth);
                    if (currentMonthIndex < availableMonths.length - 1) {
                      setSelectedMonth(availableMonths[currentMonthIndex + 1].value);
                    }
                  }}
                  disabled={!availableMonths.find(m => m.value === selectedMonth) || 
                    availableMonths.findIndex(m => m.value === selectedMonth) >= availableMonths.length - 1}
                  className="footer-nav-btn"
                >
                  <i className="bi bi-chevron-left"></i> Prev
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    const currentMonthIndex = availableMonths.findIndex(m => m.value === selectedMonth);
                    if (currentMonthIndex > 0) {
                      setSelectedMonth(availableMonths[currentMonthIndex - 1].value);
                    }
                  }}
                  disabled={!availableMonths.find(m => m.value === selectedMonth) || 
                    availableMonths.findIndex(m => m.value === selectedMonth) <= 0}
                  className="footer-nav-btn"
                >
                  Next <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>
      
      {/* Footer Info */}
      <div className="finance-footer">
        <p className="finance-footer-text">
          <span className="d-none d-sm-inline">
            Showing {activeView === 'transactions' ? filteredDatas.length : filteredData.length} of {data.length} transaction records
          </span>
          <span className="d-inline d-sm-none">
            {activeView === 'transactions' ? filteredDatas.length : filteredData.length}/{data.length}
          </span>
          <span className="d-none d-sm-inline"> | </span>
          <span className="d-inline d-sm-none"> • </span>
          Balance: {formatCurrency(currentBalance)}
          <span className="d-none d-sm-inline"> | View: {activeView === 'transactions' ? 'Transactions' : 'Reports'}</span>
        </p>
      </div>

      {/* Modals */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom">
            <i className={modalType === 'add' ? "bi bi-plus-circle me-2" : "bi bi-pencil me-2"}></i>
            {modalType === 'add' ? 'Add Transaction' : 'Edit Transaction'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="modal-body-custom">
            <Row>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="transactionDate"
                    value={formData.transactionDate}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.transactionDate}
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.transactionDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    size="sm"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isMonthlyIncome"
                label="Monthly income"
                checked={formData.isMonthlyIncome}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                isInvalid={!!formErrors.description}
                placeholder={formData.isMonthlyIncome ? "Income source" : "What did you spend on?"}
                size="sm"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>
                {formData.isMonthlyIncome ? 'Income Amount *' : 'Expense Amount *'}
              </Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0.01"
                name="debitAmount"
                value={formData.debitAmount}
                onChange={handleInputChange}
                isInvalid={!!formErrors.debitAmount}
                placeholder="0.00"
                size="sm"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.debitAmount}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="modal-footer-custom">
            <Button variant="secondary" onClick={handleCloseModal} size="sm">
              <i className="bi bi-x-circle me-1"></i> Cancel
            </Button>
            <Button type="submit" className="btn-submit" size="sm">
              <i className={modalType === 'add' ? "bi bi-plus-circle me-1" : "bi bi-check-circle me-1"}></i>
              {modalType === 'add' ? 'Add' : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showIncomeModal} onHide={handleCloseIncomeModal} centered>
        <Modal.Header closeButton className="modal-header-income">
          <Modal.Title className="modal-title-custom">
            <i className="bi bi-cash-coin me-2"></i>
            Add Monthly Income
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleIncomeSubmit}>
          <Modal.Body className="modal-body-custom">
            <Form.Group className="mb-3">
              <Form.Label>Income Date *</Form.Label>
              <Form.Control
                type="date"
                name="transactionDate"
                value={incomeFormData.transactionDate}
                onChange={handleIncomeInputChange}
                isInvalid={!!incomeFormErrors.transactionDate}
                size="sm"
              />
              <Form.Control.Feedback type="invalid">
                {incomeFormErrors.transactionDate}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Income Amount *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0.01"
                name="incomeAmount"
                value={incomeFormData.incomeAmount}
                onChange={handleIncomeInputChange}
                isInvalid={!!incomeFormErrors.incomeAmount}
                placeholder="0.00"
                size="sm"
              />
              <Form.Control.Feedback type="invalid">
                {incomeFormErrors.incomeAmount}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={incomeFormData.description}
                onChange={handleIncomeInputChange}
                placeholder="Income source description"
                size="sm"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="modal-footer-custom">
            <Button variant="secondary" onClick={handleCloseIncomeModal} size="sm">
              Cancel
            </Button>
            <Button type="submit" className="btn-submit-income" size="sm">
              <i className="bi bi-check-circle me-1"></i> Add Income
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered size="lg">
        <Modal.Header closeButton className="modal-header-report">
          <Modal.Title className="modal-title-custom">
            <i className="bi bi-funnel me-2"></i>
            Generate Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <Form>
            <Row>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Transaction Type</Form.Label>
                  <Form.Select
                    name="transactionType"
                    value={reportFilters.transactionType}
                    onChange={handleReportFilterChange}
                    size="sm"
                  >
                    <option value="all">All Transactions</option>
                    <option value="income">Income Only</option>
                    <option value="expense">Expense Only</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={reportFilters.category}
                    onChange={handleReportFilterChange}
                    size="sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={reportFilters.startDate}
                    onChange={handleReportFilterChange}
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={reportFilters.endDate}
                    onChange={handleReportFilterChange}
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Month</Form.Label>
                  <Form.Select
                    name="month"
                    value={reportFilters.month}
                    onChange={handleReportFilterChange}
                    size="sm"
                  >
                    <option value="">All Months</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Year</Form.Label>
                  <Form.Control
                    type="number"
                    name="year"
                    value={reportFilters.year}
                    onChange={handleReportFilterChange}
                    min="2000"
                    max="2030"
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={() => setShowReportModal(false)} size="sm">
            Cancel
          </Button>
          <Button variant="primary" onClick={generateReport} size="sm">
            <i className="bi bi-graph-up me-1"></i> Generate
          </Button>
        </Modal.Footer>
      </Modal>

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css" />
    </Container>
  );
};

export default MonthlyIncomeExpenseManager;