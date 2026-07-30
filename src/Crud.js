import React, { useState, useEffect } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import 'bootstrap/dist/css/bootstrap.min.css';
// Remove the useNavigate import since we're using a different approach
// import { useNavigate } from "react-router-dom";

// Add a prop to receive the navigation function
const EmployeeCRUD = ({ onNavigateToTransactions }) => {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [editId, setEditId] = useState(null);
  // Remove this line: const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    incomeAmount: "", 
    inDate: "", 
    creditAccount: "", 
    debitAccount: "",
    accountents: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
//Localhost API URL
  //const API_BASE_URL = 'https://localhost:44357/api/Accout';

  //Live API URL
   const API_BASE_URL = 'https://homemanageapp.runasp.net/api/Accout';

  useEffect(() => {
    getdata();
  }, []);

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
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
        alert('Failed to fetch data. Please try again.');
      });
  };

  const handleShowModal = (type, id = null) => {
    setModalType(type);
    if (type === 'edit' && id) {
      setEditId(id);
      const itemToEdit = data.find((item) => item.id === id);
      if (itemToEdit) {
        setFormData({
          incomeAmount: itemToEdit.incomeAmount?.toString() || "",
          inDate: itemToEdit.inDate || "", 
          creditAccount: itemToEdit.creditAccount || "",
          debitAccount: itemToEdit.debitAccount || "",
          accountents: itemToEdit.accountents || ""
        });
      }
    } else {
      setFormData({ 
        incomeAmount: "", 
        inDate: "", 
        creditAccount: "", 
        debitAccount: "",
        accountents: ""
      });
      setEditId(null);
    }
    setShowModal(true);
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormErrors({});
    setEditId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.incomeAmount.trim()) {
      errors.incomeAmount = 'Income Amount is required';
    } else if (isNaN(parseFloat(formData.incomeAmount)) || parseFloat(formData.incomeAmount) <= 0) {
      errors.incomeAmount = 'Income Amount must be a valid positive number';
    }
    
    if (!formData.inDate) {
      errors.inDate = 'Date is required';
    }
    
    if (!formData.creditAccount?.trim()) {
      errors.creditAccount = 'Credit Account is required';
    }
    
    if (!formData.debitAccount?.trim()) {
      errors.debitAccount = 'Debit Account is required';
    }

    if (!formData.accountents?.trim()) {
      errors.accountents = 'Accountents is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const apiData = {
      incomeAmount: formData.incomeAmount,
      inDate: formData.inDate,
      creditAccount: formData.creditAccount.trim(),
      debitAccount: formData.debitAccount.trim(),
      accountents: formData.accountents.trim()
    };

    const requestOptions = {
      method: modalType === 'add' ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modalType === 'add' ? apiData : { ...apiData, id: editId })
    };

    const url = modalType === 'add' 
      ? API_BASE_URL 
      : `${API_BASE_URL}/${editId}`;

    setLoading(true);
    fetch(url, requestOptions)
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => { 
            throw new Error(text || 'Request failed'); 
          });
        }
        return response.json();
      })
      .then(() => {
        getdata();
        handleCloseModal();
      })
      .catch((error) => {
        console.error('Error submitting data:', error);
        try {
          const errorObj = JSON.parse(error.message);
          if (errorObj.errors) {
            const errorMessages = Object.values(errorObj.errors).flat().join('\n');
            alert('Validation Error:\n' + errorMessages);
          } else {
            alert('Error: ' + error.message);
          }
        } catch {
          alert('Error: ' + error.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      getdata();
    })
    .catch((error) => {
      console.error('Error deleting data:', error);
      alert('Error deleting record');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Handle navigation to transactions page
  const handleNavigateToTransactions = () => {
    if (onNavigateToTransactions) {
      onNavigateToTransactions();
    } else {
      // Fallback: Use window.location if prop is not provided
      window.location.href = '/transactions';
    }
  };

  return (
    <Container className="py-4">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.3/font/bootstrap-icons.css" />
      
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h1 style={{ 
              color: "#2c3e50", 
              fontWeight: "bold",
              margin: 0
            }}>
              <i className="bi bi-people-fill me-2"></i>
              Account Management System
            </h1>
            <Button 
              onClick={handleNavigateToTransactions}
              variant="outline-primary"
              style={{ 
                borderRadius: "20px",
                padding: "10px 20px",
                fontWeight: "bold"
              }}
            >
              <i className="bi bi-arrow-left-right me-2"></i>
              Switch to Transactions
            </Button>
          </div>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col className="text-end">
          <Button 
            onClick={() => handleShowModal('add')}
            disabled={loading}
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
            Add New Record
          </Button>
        </Col>
      </Row>
      
      <Card className="shadow" style={{ 
        border: "none", 
        borderRadius: "15px",
        overflow: "hidden"
      }}>
        <Card.Body className="p-0">
          {loading && !data.length ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading data...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr style={{ backgroundColor: "#7364f5ff", color: "white" }}>
                    <th className="ps-4">#</th>
                    <th>ID</th>
                    <th>Income Amount</th>
                    <th>Date</th>
                    <th>Credit Account</th>
                    <th>Debit Account</th>
                    <th>Accountents</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data && data.length > 0 ? (
                    data.map((item, index) => (
                      <tr key={item.id || index} style={{ 
                        backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white",
                        transition: "background-color 0.2s"
                      }}>
                        <td className="ps-4 fw-bold" style={{ color: "#2c3e50" }}>{index + 1}</td>
                        <td style={{ color: "#7f8c8d", fontSize: "0.9em" }}>{item.id}</td>
                        <td>
                          <span style={{ color: "#2c3e50", fontWeight: "500" }}>
                            ${Number(item.incomeAmount).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ color: "#2c3e50" }}>{formatDate(item.inDate)}</td>
                        <td style={{ color: "#2c3e50" }}>{item.creditAccount || 'N/A'}</td>
                        <td style={{ color: "#2c3e50" }}>{item.debitAccount || 'N/A'}</td>
                        <td style={{ color: "#2c3e50" }}>{item.accountents || 'N/A'}</td>
                        <td style={{ color: "#2c3e50" }}>{formatDate(item.createdAt)}</td>
                        <td style={{ color: "#2c3e50" }}>{formatDate(item.updatedAt)}</td>
                        <td>
                          <div className="d-flex justify-content-center gap-2 flex-wrap">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleShowModal('edit', item.id)}
                              disabled={loading}
                              style={{ 
                                borderRadius: "20px",
                                padding: "0.25em 1em"
                              }}
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              disabled={loading}
                              style={{ 
                                borderRadius: "20px",
                                padding: "0.25em 1em"
                              }}
                            >
                              <i className="bi bi-trash me-1"></i>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-4" style={{ color: "#7f8c8d" }}>
                        <i className="bi bi-inbox" style={{ fontSize: "2rem" }}></i>
                        <p className="mt-2">No records found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton style={{ 
          backgroundColor: "#8b80f3", 
          color: "white" 
        }}>
          <Modal.Title>
            <i className={modalType === 'add' ? "bi bi-plus-circle me-2" : "bi bi-pencil me-2"}></i>
            {modalType === 'add' ? 'Add New Record' : 'Edit Record'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Income Amount *</Form.Label>
              <Form.Control
                type="text"
                name="incomeAmount"
                value={formData.incomeAmount}
                onChange={handleInputChange}
                isInvalid={!!formErrors.incomeAmount}
                placeholder="Enter income amount (e.g., 1000.50)"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.incomeAmount}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Enter the amount as a number (e.g., 1000 or 1000.50)
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Date *</Form.Label>
              <Form.Control
                type="date"
                name="inDate"
                value={formData.inDate}
                onChange={handleInputChange}
                isInvalid={!!formErrors.inDate}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.inDate}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Credit Account *</Form.Label>
              <Form.Control
                type="text"
                name="creditAccount"
                value={formData.creditAccount}
                onChange={handleInputChange}
                isInvalid={!!formErrors.creditAccount}
                placeholder="Enter credit account name"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.creditAccount}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Debit Account *</Form.Label>
              <Form.Control
                type="text"
                name="debitAccount"
                value={formData.debitAccount}
                onChange={handleInputChange}
                isInvalid={!!formErrors.debitAccount}
                placeholder="Enter debit account name"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.debitAccount}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Accountents *</Form.Label>
              <Form.Control
                type="text"
                name="accountents"
                value={formData.accountents}
                onChange={handleInputChange}
                isInvalid={!!formErrors.accountents}
                placeholder="Enter accountents"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.accountents}
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={loading}>
              <i className="bi bi-x-circle me-1"></i>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              style={{ 
                backgroundColor: "#27ae60", 
                border: "none" 
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className={modalType === 'add' ? "bi bi-plus-circle me-1" : "bi bi-check-circle me-1"}></i>
                  {modalType === 'add' ? 'Add Record' : 'Save Changes'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      <div className="mt-4 text-center" style={{ color: "#7f8c8d" }}>
        <p>Showing {data.length} records</p>
      </div>
    </Container>
  );
};

export default EmployeeCRUD;