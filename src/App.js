// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EmployeeCRUD from './Crud';
import TransactionCRUD from './Trans';
import Login from './components/Login';
import Register from './components/Register';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Navbar, Nav, Row, Col, Button } from 'react-bootstrap';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('employees');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);

    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'transactions':
        return <TransactionCRUD onNavigateToAccounts={() => setCurrentPage('employees')} />;
      case 'employees':
      default:
        return <EmployeeCRUD onNavigateToTransactions={() => setCurrentPage('transactions')} />;
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const menuItems = [
    {
      key: 'employees',
      label: 'Account Management',
      icon: 'bi-people',
      description: 'Manage user accounts'
    },
    {
      key: 'transactions',
      label: 'Transaction Management',
      icon: 'bi-cash-stack',
      description: 'Track all transactions'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-text">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="App">
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div className="sidebar-overlay" onClick={closeSidebar}></div>
        )}

        {/* Navigation Bar */}
        <Navbar expand="lg" className="custom-navbar" sticky="top">
          <Container fluid>
            <div className="navbar-left">
              <Button 
                variant="link" 
                className="menu-toggle-btn"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
              >
                <i className={`bi ${isSidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
              </Button>
              <Navbar.Brand href="#" className="brand-logo">
                <div className="logo-wrapper">
                  <div className="logo-icon">
                    <i className="bi bi-house-heart"></i>
                  </div>
                  <span className="brand-text">Home Management</span>
                </div>
              </Navbar.Brand>
            </div>

            <div className="navbar-right">
              <div className="user-badge">
                <div className="user-badge-avatar">
                  <i className="bi bi-person-circle"></i>
                </div>
                <div className="user-badge-info d-none d-md-block">
                  <span className="user-badge-name">{user.username}</span>
                  <span className="user-badge-email">{user.email}</span>
                </div>
              </div>
              <Button 
                variant="outline-light" 
                size="sm"
                className="logout-btn"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span className="d-none d-sm-inline"> Logout</span>
              </Button>
            </div>
          </Container>
        </Navbar>

        {/* Main Container */}
        <Container fluid className="main-container">
          <Row className="h-100 g-0">
            {/* Sidebar */}
            <Col 
              xs={12}
              md={3}
              lg={2}
              className={`sidebar-col ${isSidebarOpen ? 'open' : 'closed'}`}
            >
              <div className="sidebar-wrapper">
                <div className="sidebar-header">
                  <div className="sidebar-title">
                    <div className="title-icon-wrapper">
                      <i className="bi bi-grid-3x3-gap-fill"></i>
                    </div>
                    <span>Navigation</span>
                  </div>
                </div>
                
                <Nav className="flex-column sidebar-nav">
                  {menuItems.map((item) => (
                    <Nav.Link
                      key={item.key}
                      className={`sidebar-nav-link ${currentPage === item.key ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPage(item.key);
                        closeSidebar();
                      }}
                    >
                      <div className="nav-link-content">
                        <div className="nav-icon-wrapper">
                          <i className={`bi ${item.icon} nav-icon`}></i>
                        </div>
                        <div className="nav-text-wrapper">
                          <span className="nav-label">{item.label}</span>
                          <span className="nav-description">{item.description}</span>
                        </div>
                      </div>
                      {currentPage === item.key && (
                        <div className="active-indicator">
                          <div className="indicator-dot"></div>
                        </div>
                      )}
                    </Nav.Link>
                  ))}
                </Nav>

                <div className="sidebar-footer">
                  <div className="user-profile-card">
                    <div className="user-profile-avatar">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${user.username}&background=667eea&color=fff&bold=true`}
                        alt={user.username}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<i class="bi bi-person-circle"></i>';
                        }}
                      />
                    </div>
                    <div className="user-profile-info">
                      <div className="user-profile-name">{user.username}</div>
                      <div className="user-profile-role">Administrator</div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* Content Area */}
            <Col 
              xs={12}
              md={9}
              lg={10}
              className="content-col"
            >
              <div className="content-wrapper">
                {/* Page Header */}
                <div className="page-header">
                  <div className="page-header-left">
                    <div className="page-icon-wrapper">
                      <i className={`bi ${
                        currentPage === 'employees' ? 'bi-people' : 'bi-cash-stack'
                      }`}></i>
                    </div>
                    <div>
                      <h2 className="page-title">
                        {currentPage === 'employees' ? 'Account Management' : 'Transaction Management'}
                      </h2>
                      <p className="page-subtitle">
                        {currentPage === 'employees' 
                          ? 'Manage and organize all user accounts' 
                          : 'Track and manage all financial transactions'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Page Content */}
                <div className="page-content">
                  <div className="content-card">
                    {renderPage()}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>

        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css" />
      </div>
    </Router>
  );
}

export default App;