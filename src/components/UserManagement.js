import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { apiFetch, API_BASE_URL } from '../api';

// Shown only when logged-in user.role === 'Admin' (App.js gates the route)
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pwModalUser, setPwModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = () => {
    setLoading(true);
    apiFetch(`${API_BASE_URL}/User`)

      .then(res => {
        if (!res.ok) throw new Error('Failed to load users');
        return res.json();
      })
     
      .then(setUsers)
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  };
 
  const toggleRole = async (user) => {
    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    if (!window.confirm(`Make ${user.username} ${newRole}?`)) return;

    const res = await apiFetch(`${API_BASE_URL}/User/${user.id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    if (res.ok) loadUsers();
    else alert('Could not update role');
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;

    const res = await apiFetch(`${API_BASE_URL}/User/${user.id}`, { method: 'DELETE' });
    if (res.ok) loadUsers();
    else alert('Could not delete user');
  };

  const savePassword = async () => {
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    const res = await apiFetch(`${API_BASE_URL}/User/${pwModalUser.id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword })
    });
    if (res.ok) {
      setPwModalUser(null);
      setNewPassword('');
      alert('Password reset successfully');
    } else {
      alert('Could not reset password');
    }
  };

  if (loading) return <div className="text-center p-4"><Spinner animation="border" /></div>;

  return (
    <Card className="p-3">
      {error && <Alert variant="danger">{error}</Alert>}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>
                <Badge bg={u.role === 'Admin' ? 'danger' : 'secondary'}>{u.role}</Badge>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="d-flex gap-2">
                <Button size="sm" variant="outline-primary" onClick={() => toggleRole(u)}>
                  Make {u.role === 'Admin' ? 'User' : 'Admin'}
                </Button>
                <Button size="sm" variant="outline-warning" onClick={() => setPwModalUser(u)}>
                  Reset Password
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => deleteUser(u)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={!!pwModalUser} onHide={() => setPwModalUser(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password — {pwModalUser?.username}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPwModalUser(null)}>Cancel</Button>
          <Button variant="primary" onClick={savePassword}>Save</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default UserManagement;
