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
    transactionType: "all" // 'all', 'income', 'expense'
  });
  const [formErrors, setFormErrors] = useState({});
  const [incomeFormErrors, setIncomeFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [reportSummary, setReportSummary] = useState(null);
  const [activeView, setActiveView] = useState('transactions');
  
  // Month filtering states
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [viewMode, setViewMode] = useState('current'); // 'current', 'select', 'all'

  const API_BASE_URL = 'https://localhost:44357/api/Transaction';
  const categories = ["food", "transport", "utilities", "entertainment", "shopping", "healthcare", "education", "other"];

  // Helper function to get current month in YYYY-MM format
  function getCurrentMonth() {
    const now = new Date();
    return now.toISOString().slice(0, 7); // "YYYY-MM"
  }

  // Helper function to format month display
  function formatMonthDisplay(month) {
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  }

  useEffect(() => {
    getdata();
    getMonthlySummary();
    getCurrentBalance();
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
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
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
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((summary) => {
        setMonthlySummary(summary);
      })
      .catch((error) => {
        console.log('Error fetching monthly summary:', error);
      });
  };

  const getCurrentBalance = () => {
    fetch(`${API_BASE_URL}/current-balance`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((balance) => {
        setCurrentBalance(balance);
      })
      .catch((error) => {
        console.log('Error fetching current balance:', error);
      });
  };

  const generateReport = () => {
    let filtered = [...data];

    // Filter by date range
    if (reportFilters.startDate && reportFilters.endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.transactionDate);
        const startDate = new Date(reportFilters.startDate);
        const endDate = new Date(reportFilters.endDate);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Filter by month and year
    if (reportFilters.month && reportFilters.year) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.transactionDate);
        return itemDate.getMonth() + 1 === parseInt(reportFilters.month) && 
               itemDate.getFullYear() === parseInt(reportFilters.year);
      });
    }

    // Filter by year only
    if (reportFilters.year && !reportFilters.month) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.transactionDate);
        return itemDate.getFullYear() === parseInt(reportFilters.year);
      });
    }

    // Filter by category
    if (reportFilters.category !== "all") {
      filtered = filtered.filter(item => item.category === reportFilters.category);
    }

    // Filter by transaction type
    if (reportFilters.transactionType === "income") {
      filtered = filtered.filter(item => item.isMonthlyIncome === true);
    } else if (reportFilters.transactionType === "expense") {
      filtered = filtered.filter(item => item.isMonthlyIncome === false);
    }

    setFilteredData(filtered);

    // Calculate report summary
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
    // Reset month view to default
    setViewMode('current');
    setSelectedMonth(getCurrentMonth());
  };

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

  const handleShowIncomeModal = () => {
    setIncomeFormData({
      transactionDate: new Date().toISOString().split('T')[0],
      incomeAmount: "",
      description: "Monthly Income"
    });
    setShowIncomeModal(true);
    setIncomeFormErrors({});
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormErrors({});
  };

  const handleCloseIncomeModal = () => {
    setShowIncomeModal(false);
    setIncomeFormErrors({});
  };

  const handleReportFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilters({
      ...reportFilters,
      [name]: value
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : 
              name === 'debitAmount' ? parseFloat(value) || 0 : value
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleIncomeInputChange = (e) => {
    const { name, value } = e.target;
    setIncomeFormData({
      ...incomeFormData,
      [name]: name === 'incomeAmount' ? parseFloat(value) || 0 : value
    });
    
    if (incomeFormErrors[name]) {
      setIncomeFormErrors({
        ...incomeFormErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.transactionDate) {
      errors.transactionDate = 'Transaction Date is required';
    }
    
    if (formData.debitAmount <= 0 && !formData.isMonthlyIncome) {
      errors.debitAmount = 'Expense Amount must be greater than 0';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateIncomeForm = () => {
    const errors = {};
    
    if (!incomeFormData.transactionDate) {
      errors.transactionDate = 'Transaction Date is required';
    }
    
    if (incomeFormData.incomeAmount <= 0) {
      errors.incomeAmount = 'Income Amount must be greater than 0';
    }
    
    setIncomeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const apiData = {
      transactionDate: formData.transactionDate,
      incomeAmount: formData.isMonthlyIncome ? formData.debitAmount : 0,
      creditAmount: 0,
      debitAmount: formData.isMonthlyIncome ? 0 : formData.debitAmount,
      description: formData.description,
      category: formData.category,
      isMonthlyIncome: formData.isMonthlyIncome
    };

    if (modalType === 'edit') {
      apiData.id = editId;
    }

    const requestOptions = {
      method: modalType === 'add' ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData)
    };

    const url = modalType === 'add' 
      ? API_BASE_URL 
      : `${API_BASE_URL}/${editId}`;

    fetch(url, requestOptions)
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text) });
        }
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

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    
    if (!validateIncomeForm()) {
      return;
    }

    const apiData = {
      transactionDate: incomeFormData.transactionDate,
      incomeAmount: incomeFormData.incomeAmount,
      creditAmount: 0,
      debitAmount: 0,
      description: incomeFormData.description,
      category: "income",
      isMonthlyIncome: true
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData)
    };

    fetch(API_BASE_URL, requestOptions)
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text) });
        }
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

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCategoryColor = (category) => {
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
  };

  // Calculate cumulative balance for display
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

  // Generate list of available months from data
  const availableMonths = useMemo(() => {
    if (!data || data.length === 0) {
      return [{ value: getCurrentMonth(), label: formatMonthDisplay(getCurrentMonth()) }];
    }
    
    const monthsSet = new Set();
    data.forEach(item => {
      if (item.transactionDate) {
        const month = item.transactionDate.slice(0, 7); // Extract YYYY-MM
        monthsSet.add(month);
      }
    });
    
    // Sort months descending (newest first)
    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map(month => ({
        value: month,
        label: formatMonthDisplay(month)
      }));
  }, [data]);

  // Filter data based on selected view mode
  const filteredDatas = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    if (viewMode === 'all') {
      return data;
    }
    
    const monthToFilter = viewMode === 'current' ? getCurrentMonth() : selectedMonth;
    
    return data.filter(item => {
      if (!item.transactionDate) return false;
      return item.transactionDate.slice(0, 7) === monthToFilter;
    });
  }, [data, viewMode, selectedMonth]);

  // Calculate summary for current view
  const summary = useMemo(() => {
    if (filteredDatas.length === 0) {
      return { income: 0, expense: 0, net: 0 };
    }
    
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
    ? [...filteredDatas].sort((a, b) => 
        new Date(a.transactionDate) - new Date(b.transactionDate)
      )
    : [...filteredData].sort((a, b) => 
        new Date(a.transactionDate) - new Date(b.transactionDate)
      );

  const dataWithCumulative = calculateCumulativeBalance(sortedData);

  // Simple CSV Export
  const exportToCSV = () => {
    // Filter out income rows if transactionType is 'expense'
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

  // Simple PDF-like export using print functionality
  const exportToPDF = () => {
    // Filter out income rows if transactionType is 'expense'
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
            .summary-container { 
              max-width: 1200px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin: 30px 0;
            }
            .summary-card {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .summary-card h3 {
              margin: 0;
              color: #6c757d;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-card .amount {
              font-size: 24px;
              font-weight: bold;
              margin-top: 10px;
              display: block;
            }
            .income-color { color: #27ae60; }
            .expense-color { color: #e74c3c; }
            .net-positive { color: #27ae60; }
            .net-negative { color: #e74c3c; }
            .table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            .table th, .table td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            .table th { 
              background-color: #8b80f3; 
              color: white; 
              font-weight: 600;
            }
            .table tr:nth-child(even) { background-color: #f8f9fa; }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px;
              border-top: 1px solid #dee2e6;
              color: #6c757d;
              font-size: 12px;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            }
            .badge-income { background: #27ae60; color: white; }
            .badge-expense { background: #f39c12; color: white; }
            @media print {
              .no-print { display: none; }
              .summary-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="summary-container">
            <h1>Financial Report</h1>
            <p style="text-align: center; color: #6c757d;">
              Generated on: ${new Date().toLocaleString()}
            </p>
            
            ${reportSummary ? `
              <div class="summary-grid">
                <div class="summary-card">
                  <h3>Total Income</h3>
                  <span class="amount income-color">${formatCurrency(reportSummary.totalIncome)}</span>
                </div>
                <div class="summary-card">
                  <h3>Total Expenses</h3>
                  <span class="amount expense-color">${formatCurrency(reportSummary.totalExpenses)}</span>
                </div>
                <div class="summary-card">
                  <h3>Net Balance</h3>
                  <span class="amount ${reportSummary.netBalance >= 0 ? 'net-positive' : 'net-negative'}">
                    ${formatCurrency(reportSummary.netBalance)}
                  </span>
                </div>
                <div class="summary-card">
                  <h3>Total Transactions</h3>
                  <span class="amount" style="color: #3498db;">${reportSummary.totalTransactions}</span>
                </div>
              </div>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;">
                  <strong>Income Transactions:</strong> ${reportSummary.monthlyIncomeCount} | 
                  <strong>Expense Transactions:</strong> ${reportSummary.monthlyExpenseCount}
                </p>
              </div>
            ` : ''}
            
            <h2 style="margin-top: 40px;">Transaction Details</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${exportData.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${formatDate(item.transactionDate)}</td>
                    <td>
                      <span class="badge ${item.isMonthlyIncome ? 'badge-income' : 'badge-expense'}">
                        ${item.isMonthlyIncome ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td>${item.category}</td>
                    <td>${item.description || 'N/A'}</td>
                    <td style="font-weight: bold; color: ${item.isMonthlyIncome ? '#27ae60' : '#e74c3c'};">
                      ${formatCurrency(item.isMonthlyIncome ? item.incomeAmount : item.debitAmount)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>This report was generated automatically from the Monthly Income & Expense Manager</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1 style={{ 
              color: "#2c3e50", 
              fontWeight: "bold",
              margin: 0
            }}>
              <i className="bi bi-cash-stack me-2"></i>
              Monthly Income & Expense Manager
            </h1>
            <div>
              <Button 
                variant={activeView === 'transactions' ? 'primary' : 'outline-primary'}
                className="me-2"
                onClick={() => {
                  setActiveView('transactions');
                  // Reset to current month view when switching to transactions
                  setViewMode('current');
                  setSelectedMonth(getCurrentMonth());
                }}
              >
                <i className="bi bi-list-ul me-1"></i>
                Transactions
              </Button>
              <Button 
                variant={activeView === 'report' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveView('report')}
              >
                <i className="bi bi-graph-up me-1"></i>
                Reports
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Current Balance Card */}
      {activeView === 'transactions' && (
        <Row className="mb-4">
          <Col>
            <Card className="shadow" style={{ backgroundColor: "#e2cce0ff" }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-wallet2 me-2"></i>
                    Current Financial Status
                  </h5>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={handleShowIncomeModal}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Add Monthly Income
                  </Button>
                </div>
                <Row className="mt-3">
                  <Col md={3}>
                    <strong>Current Balance:</strong> 
                    <span style={{ 
                      color: currentBalance >= 0 ? '#27ae60' : '#e74c3c', 
                      fontWeight: 'bold',
                      fontSize: '1.2em'
                    }}>
                      {formatCurrency(currentBalance)}
                    </span>
                  </Col>
                  {monthlySummary && (
                    <>
                      <Col md={3}>
                        <strong>Monthly Income:</strong> 
                        <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                          {formatCurrency(monthlySummary.totalIncome)}
                        </span>
                      </Col>
                      <Col md={3}>
                        <strong>Monthly Expenses:</strong> 
                        <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                          {formatCurrency(monthlySummary.totalDebit)}
                        </span>
                      </Col>
                      <Col md={3}>
                        <strong>Remaining:</strong> 
                        <span style={{ 
                          color: (monthlySummary.totalIncome - monthlySummary.totalDebit) >= 0 ? '#27ae60' : '#e74c3c',
                          fontWeight: 'bold'
                        }}>
                          {formatCurrency(monthlySummary.totalIncome - monthlySummary.totalDebit)}
                        </span>
                      </Col>
                    </>
                  )}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Report Summary Card - Original Design with all details */}
      {activeView === 'report' && reportSummary && (
        <Row className="mb-4">
          <Col>
            <Card className="shadow" style={{ backgroundColor: "#e8f4fd" }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title">
                    <i className="bi bi-bar-chart me-2"></i>
                    Report Summary
                  </h5>
                  <div>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={exportToCSV}
                    >
                      <i className="bi bi-file-earmark-excel me-1"></i>
                      CSV
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="ms-1"
                      onClick={exportToPDF}
                    >
                      <i className="bi bi-file-earmark-pdf me-1"></i>
                      PDF
                    </Button>
                  </div>
                </div>
                <Row>
                  <Col md={3}>
                    <strong>Total Income:</strong> 
                    <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                      {formatCurrency(reportSummary.totalIncome)}
                    </span>
                  </Col>
                  <Col md={3}>
                    <strong>Total Expenses:</strong> 
                    <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                      {formatCurrency(reportSummary.totalExpenses)}
                    </span>
                  </Col>
                  <Col md={3}>
                    <strong>Net Balance:</strong> 
                    <span style={{ 
                      color: reportSummary.netBalance >= 0 ? '#27ae60' : '#e74c3c', 
                      fontWeight: 'bold'
                    }}>
                      {formatCurrency(reportSummary.netBalance)}
                    </span>
                  </Col>
                  <Col md={3}>
                    <strong>Transactions:</strong> 
                    <span style={{ fontWeight: 'bold' }}>
                      {reportSummary.totalTransactions}
                    </span>
                  </Col>
                </Row>
                {reportSummary.totalTransactions > 0 && (
                  <Row className="mt-3">
                    <Col>
                      <h6>Category Breakdown:</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {categories.map(category => (
                          reportSummary.categoryBreakdown[category] > 0 && (
                            <span key={category} className="badge" style={{ 
                              backgroundColor: getCategoryColor(category),
                              fontSize: '0.8em'
                            }}>
                              {category}: {formatCurrency(reportSummary.categoryBreakdown[category])}
                            </span>
                          )
                        ))}
                      </div>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      <Row className="mb-4">
        <Col className="text-end">
          {activeView === 'transactions' ? (
            <>
              <Button 
                onClick={() => handleShowModal('add')}
                style={{ 
                  backgroundColor: "#27ae60", 
                  border: "none",
                  borderRadius: "20px",
                  padding: "10px 20px",
                  fontWeight: "bold",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Transaction
              </Button>
              <Button 
                variant="info"
                className="ms-2"
                onClick={() => {
                  getdata();
                  getMonthlySummary();
                  getCurrentBalance();
                }}
                style={{ 
                  borderRadius: "20px",
                  padding: "10px 20px",
                  fontWeight: "bold"
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => setShowReportModal(true)}
                variant="primary"
                style={{ 
                  borderRadius: "20px",
                  padding: "10px 20px",
                  fontWeight: "bold"
                }}
              >
                <i className="bi bi-funnel me-2"></i>
                Filter Report
              </Button>
              <Button 
                variant="outline-secondary"
                className="ms-2"
                onClick={resetReportFilters}
                style={{ 
                  borderRadius: "20px",
                  padding: "10px 20px",
                  fontWeight: "bold"
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset Filters
              </Button>
            </>
          )}
        </Col>
      </Row>
      
      <Card className="shadow" style={{ 
        border: "none", 
        borderRadius: "15px",
        overflow: "hidden"
      }}>
        {/* Filter Controls - Only show in transactions view */}
        {activeView === 'transactions' && (
          <Card.Header style={{ 
            backgroundColor: "#f8f9fa", 
            borderBottom: "1px solid #e9ecef",
            padding: "1rem 1.5rem"
          }}>
            <div className="d-flex flex-wrap align-items-center justify-content-between">
              <div className="d-flex align-items-center mb-2 mb-md-0">
                <h5 className="mb-0 me-3" style={{ color: "#2c3e50" }}>
                  {viewMode === 'current' ? 'Current Month' : 
                   viewMode === 'select' ? formatMonthDisplay(selectedMonth) : 
                   'All Transactions'}
                </h5>
                
                {filteredDatas.length > 0 && (
                  <div className="d-flex gap-3">
                    <span className="badge bg-success" style={{ fontSize: '0.85rem' }}>
                      Income: {formatCurrency(summary.income)}
                    </span>
                    <span className="badge bg-warning" style={{ fontSize: '0.85rem' }}>
                      Expense: {formatCurrency(summary.expense)}
                    </span>
                    <span className={`badge ${summary.net >= 0 ? 'bg-info' : 'bg-danger'}`} style={{ fontSize: '0.85rem' }}>
                      Net: {formatCurrency(summary.net)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="d-flex gap-2">
                <DropdownButton
                  variant="outline-primary"
                  title={
                    <span>
                      <i className="bi bi-calendar me-1"></i>
                      {viewMode === 'current' ? 'Current Month' : 
                      viewMode === 'select' ? 'Select Month' : 
                      'All Months'}
                    </span>
                  }
                  onSelect={(eventKey) => setViewMode(eventKey)}
                  size="sm"
                >
                  <Dropdown.Item eventKey="current" active={viewMode === 'current'}>
                    <i className="bi bi-calendar-check me-2"></i>
                    Current Month
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="select" active={viewMode === 'select'}>
                    <i className="bi bi-calendar-month me-2"></i>
                    Select Month
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="all" active={viewMode === 'all'}>
                    <i className="bi bi-calendar-range me-2"></i>
                    All Months
                  </Dropdown.Item>
                </DropdownButton>
                
                {viewMode === 'select' && (
                  <DropdownButton
                    variant="outline-secondary"
                    title={formatMonthDisplay(selectedMonth)}
                    onSelect={(month) => setSelectedMonth(month)}
                    size="sm"
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

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading transactions...</p>
            </div>
          ) : (
            <>
              {/* Summary Info - Only for transactions view with month filter */}
              {activeView === 'transactions' && viewMode !== 'all' && filteredDatas.length > 0 && (
                <div className="p-3 bg-light border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Showing {filteredDatas.length} transaction{filteredDatas.length !== 1 ? 's' : ''} for {viewMode === 'current' ? 'this month' : formatMonthDisplay(selectedMonth)}
                    </small>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setViewMode('all')}
                      className="text-decoration-none"
                    >
                      View All Transactions
                    </Button>
                  </div>
                </div>
              )}

              {/* Table - Show in both views, but hide income rows in report view when filtered */}
              <Table hover responsive className="mb-0">
                <thead>
                  <tr style={{ backgroundColor: "#8b80f3ff", color: "white" }}>
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
                      // Filter out income rows in report view if transactionType is 'expense'
                      .filter(item => {
                        if (activeView === 'report' && reportFilters.transactionType === 'expense') {
                          return !item.isMonthlyIncome;
                        }
                        return true;
                      })
                      .map((item, index) => (
                        <tr 
                          key={index} 
                          style={{ 
                            backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white",
                            transition: "background-color 0.2s",
                            cursor: activeView === 'transactions' ? 'pointer' : 'default'
                          }}
                          onClick={() => activeView === 'transactions' && handleShowModal('edit', item.id)}
                        >
                          <td className="ps-4 fw-bold" style={{ color: "#2c3e50" }}>{index + 1}</td>
                          <td style={{ color: "#2c3e50" }}>{formatDate(item.transactionDate)}</td>
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
                            <span 
                              className="badge"
                              style={{ 
                                backgroundColor: getCategoryColor(item.category),
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '15px'
                              }}
                            >
                              {item.category}
                            </span>
                          </td>
                          <td style={{ color: "#7f8c8d" }}>{item.description || 'N/A'}</td>
                          {activeView === 'transactions' && (
                            <>
                              <td style={{ 
                                color: item.cumulativeBalance >= 0 ? "#27ae60" : "#e74c3c", 
                                fontWeight: "bold" 
                              }}>
                                {formatCurrency(item.cumulativeBalance)}
                              </td>
                              <td style={{ color: "#7f8c8d", fontSize: "0.9em" }}>{formatDate(item.createdAt)}</td>
                              <td>
                                <div className="d-flex justify-content-center" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleShowModal('edit', item.id)}
                                    style={{ borderRadius: "20px", padding: "0.25em 1em" }}
                                  >
                                    <i className="bi bi-pencil me-1"></i>
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDelete(item.id)}
                                    style={{ borderRadius: "20px", padding: "0.25em 1em" }}
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
                      <td colSpan={activeView === 'transactions' ? "9" : "6"} className="text-center py-5" style={{ color: "#7f8c8d" }}>
                        <i className="bi bi-calendar-x" style={{ fontSize: "3rem", opacity: 0.5 }}></i>
                        <p className="mt-3">
                          {activeView === 'transactions' && viewMode === 'select' 
                            ? `No transactions found for ${formatMonthDisplay(selectedMonth)}`
                            : activeView === 'transactions' && viewMode === 'current'
                            ? 'No transactions for the current month'
                            : activeView === 'report' 
                              ? 'No transactions match your filter criteria' 
                              : 'No transactions recorded yet'}
                        </p>
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
            </>
          )}
        </Card.Body>

        {/* Footer with quick navigation - Only for transactions view with month filter */}
        {activeView === 'transactions' && filteredDatas.length > 0 && viewMode !== 'all' && (
          <Card.Footer className="bg-light py-2">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Click on a row to edit transaction
              </small>
              <div>
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
                  className="text-decoration-none"
                >
                  <i className="bi bi-chevron-left"></i> Previous
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
                  className="text-decoration-none"
                >
                  Next <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>
      
      {/* Add/Edit Transaction Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton style={{ backgroundColor: "#8b80f3", color: "white" }}>
          <Modal.Title>
            <i className={modalType === 'add' ? "bi bi-plus-circle me-2" : "bi bi-pencil me-2"}></i>
            {modalType === 'add' ? 'Add Transaction' : 'Edit Transaction'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Transaction Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="transactionDate"
                    value={formData.transactionDate}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.transactionDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.transactionDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
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
                label="This is a monthly income transaction"
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
                placeholder={formData.isMonthlyIncome ? "Income source description" : "What did you spend on?"}
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
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.debitAmount}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              <i className="bi bi-x-circle me-1"></i>
              Cancel
            </Button>
            <Button type="submit" style={{ backgroundColor: "#27ae60", border: "none" }}>
              <i className={modalType === 'add' ? "bi bi-plus-circle me-1" : "bi bi-check-circle me-1"}></i>
              {modalType === 'add' ? 'Add Transaction' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add Monthly Income Modal */}
      <Modal show={showIncomeModal} onHide={handleCloseIncomeModal} centered>
        <Modal.Header closeButton style={{ backgroundColor: "#27ae60", color: "white" }}>
          <Modal.Title>
            <i className="bi bi-cash-coin me-2"></i>
            Add Monthly Income
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleIncomeSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Income Date *</Form.Label>
              <Form.Control
                type="date"
                name="transactionDate"
                value={incomeFormData.transactionDate}
                onChange={handleIncomeInputChange}
                isInvalid={!!incomeFormErrors.transactionDate}
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
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseIncomeModal}>
              Cancel
            </Button>
            <Button type="submit" style={{ backgroundColor: "#27ae60", border: "none" }}>
              <i className="bi bi-check-circle me-1"></i>
              Add Income
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Report Filter Modal - Enhanced with Transaction Type */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: "#3498db", color: "white" }}>
          <Modal.Title>
            <i className="bi bi-funnel me-2"></i>
            Generate Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Transaction Type</Form.Label>
                  <Form.Select
                    name="transactionType"
                    value={reportFilters.transactionType}
                    onChange={handleReportFilterChange}
                  >
                    <option value="all">All Transactions</option>
                    <option value="income">Income Only</option>
                    <option value="expense">Expense Only</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={reportFilters.category}
                    onChange={handleReportFilterChange}
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={reportFilters.startDate}
                    onChange={handleReportFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={reportFilters.endDate}
                    onChange={handleReportFilterChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Month</Form.Label>
                  <Form.Select
                    name="month"
                    value={reportFilters.month}
                    onChange={handleReportFilterChange}
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Year</Form.Label>
                  <Form.Control
                    type="number"
                    name="year"
                    value={reportFilters.year}
                    onChange={handleReportFilterChange}
                    min="2000"
                    max="2030"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={generateReport}>
            <i className="bi bi-graph-up me-1"></i>
            Generate Report
          </Button>
        </Modal.Footer>
      </Modal>
      
      <div className="mt-4 text-center" style={{ color: "#7f8c8d" }}>
        <p>
          Showing {activeView === 'transactions' ? filteredDatas.length : filteredData.length} of {data.length} transaction records | 
          Current Balance: {formatCurrency(currentBalance)} | 
          View: {activeView === 'transactions' ? 'Transactions' : 'Reports'}
        </p>
      </div>

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css" />
    </Container>
  );
};

export default MonthlyIncomeExpenseManager;