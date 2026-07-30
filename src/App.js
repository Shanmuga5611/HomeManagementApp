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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setHoveredItem] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);

    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth < 992) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
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

  // const renderPage = () => {
  //   switch (currentPage) {
  //     case 'transactions':
  //       return <TransactionCRUD/>;
  //     case 'employees':
  //     default:
  //       return <EmployeeCRUD/>;
  //   }
  // };
  // In App.js, update the renderPage function:
const renderPage = () => {
  switch (currentPage) {
    case 'transactions':
      return <TransactionCRUD onNavigateToAccounts={() => setCurrentPage('employees')} />;
    case 'employees':
    default:
      return <EmployeeCRUD onNavigateToTransactions={() => setCurrentPage('transactions')} />;
  }
};

  const menuItems = [
    {
      key: 'employees',
      label: 'Account Management',
      icon: 'bi-people',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      hoverColor: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
      description: 'Manage user accounts'
    },
    {
      key: 'transactions',
      label: 'Transaction Management',
      icon: 'bi-cash-stack',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      hoverColor: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
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
        {/* Enhanced Navigation Bar */}
        <Navbar expand="lg" className="custom-navbar" sticky="top">
          <Container fluid>
            <Navbar.Brand href="#" className="brand-logo">
              <div className="logo-wrapper">
                <div className="logo-icon pulse-icon">
                  <i className="bi bi-house-heart"></i>
                </div>
                <span className="brand-text">Home Management System</span>
              </div>
            </Navbar.Brand>
            <div className="d-flex align-items-center gap-3">
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
                <i className="bi bi-box-arrow-right me-1"></i>
                Logout
              </Button>
              <Navbar.Toggle 
                aria-controls="basic-navbar-nav" 
                className="custom-toggler"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <div className="hamburger-wrapper">
                  <span className={`hamburger-line ${!isSidebarCollapsed ? 'active' : ''}`}></span>
                  <span className={`hamburger-line ${!isSidebarCollapsed ? 'active' : ''}`}></span>
                  <span className={`hamburger-line ${!isSidebarCollapsed ? 'active' : ''}`}></span>
                </div>
              </Navbar.Toggle>
            </div>
          </Container>
        </Navbar>

        {/* Main Container with Sidebar and Content */}
        <Container fluid className="main-container">
          <Row className="h-100 g-0">
            {/* Enhanced Sidebar */}
            <Col 
              xs={isSidebarCollapsed ? 'auto' : 3} 
              lg={isSidebarCollapsed ? 'auto' : 2} 
              className={`sidebar-col ${isSidebarCollapsed ? 'collapsed' : ''}`}
            >
              <div className="sidebar-wrapper">
                <div className="sidebar-header">
                  {!isSidebarCollapsed && (
                    <div className="sidebar-title animate-slide-in">
                      <div className="title-icon-wrapper">
                        <i className="bi bi-grid-3x3-gap-fill"></i>
                      </div>
                      <span>Navigation</span>
                    </div>
                  )}
                </div>
                
                <Nav className="flex-column sidebar-nav">
                  {menuItems.map((item, index) => (
                    <Nav.Link
                      key={item.key}
                      className={`sidebar-nav-link ${currentPage === item.key ? 'active' : ''} animate-slide-in`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => {
                        setCurrentPage(item.key);
                        if (isMobile) {
                          setIsSidebarCollapsed(true);
                        }
                      }}
                      onMouseEnter={() => setHoveredItem(item.key)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className="nav-link-content">
                        <div className="nav-icon-wrapper">
                          <i className={`bi ${item.icon} nav-icon`}></i>
                          {currentPage === item.key && (
                            <span className="nav-pulse"></span>
                          )}
                        </div>
                        {!isSidebarCollapsed && (
                          <div className="nav-text-wrapper">
                            <span className="nav-label">{item.label}</span>
                            <span className="nav-description">{item.description}</span>
                          </div>
                        )}
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="nav-tooltip-indicator"></div>
                      )}
                      {currentPage === item.key && !isSidebarCollapsed && (
                        <div className="active-indicator">
                          <div className="indicator-dot"></div>
                        </div>
                      )}
                    </Nav.Link>
                  ))}
                </Nav>

                {/* Enhanced Sidebar Footer */}
                {!isSidebarCollapsed && (
                  <div className="sidebar-footer animate-slide-up">
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
                )}
              </div>
            </Col>

            {/* Enhanced Content Area */}
            <Col 
              xs={isSidebarCollapsed ? 12 : 9} 
              lg={isSidebarCollapsed ? 11 : 10} 
              className="content-col"
            >
              <div className="content-wrapper">
                {/* Enhanced Page Header */}
                <div className="page-header animate-fade-in">
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
                  <div className="page-header-right">
                    <button 
                      className="btn toggle-sidebar-btn"
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    >
                      <i className={`bi ${isSidebarCollapsed ? 'bi-arrows-expand' : 'bi-arrows-collapse'}`}></i>
                      <span className="d-none d-md-inline">
                        {isSidebarCollapsed ? 'Expand' : 'Collapse'} Menu
                      </span>
                    </button>
                  </div>
                </div>

                {/* Enhanced Page Content */}
                <div className="page-content animate-fade-in">
                  <div className="content-card">
                    {renderPage()}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>

        {/* Bootstrap Icons */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css" />
      </div>
    </Router>
  );
}

export default App;