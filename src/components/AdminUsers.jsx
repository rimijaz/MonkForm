import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  IconButton,
  LinearProgress,
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as FormIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { formApi } from '../services/formApi';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForms, setUserForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedUserForMenu, setSelectedUserForMenu] = useState(null);

  // Get current user info
  const getUserInfo = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user info:', error);
        return null;
      }
    }
    return null;
  };

  const currentUserInfo = getUserInfo();
  const isAdmin = currentUserInfo?.role === 'admin';

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await formApi.getAllUsers();
      let allUsers = response.data || [];
      
      // Apply conditional logic based on user role
      console.log('🔍 AdminUsers - Conditional Logic Check:');
      console.log('  Current User:', currentUserInfo);
      console.log('  Is Admin:', isAdmin);
      console.log('  Total Users from API:', allUsers.length);
      
      if (!isAdmin && currentUserInfo) {
        // Regular user: Only show themselves
        const beforeFilter = allUsers.length;
        allUsers = allUsers.filter(user => user._id === currentUserInfo._id);
        console.log('  Regular User - Filtered from', beforeFilter, 'to', allUsers.length, 'users');
      } else {
        // Admin: Show all users (no filtering)
        console.log('  Admin - Showing all users:', allUsers.length);
      }
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserForms = async (userId) => {
    try {
      setLoadingForms(true);
      const response = await formApi.getFormsByUser(userId);
      setUserForms(response.data || []);
    } catch (error) {
      console.error('Error fetching user forms:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch user forms',
        severity: 'error'
      });
    } finally {
      setLoadingForms(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;

    try {
      await formApi.deleteUser(deleteDialog.user._id);
      setUsers(prev => prev.filter(user => user._id !== deleteDialog.user._id));
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete user',
        severity: 'error'
      });
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleDeleteForm = async (formId) => {
    try {
      await formApi.deleteForm(formId);
      setUserForms(prev => prev.filter(form => form._id !== formId));
      setSnackbar({
        open: true,
        message: 'Form deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete form',
        severity: 'error'
      });
    }
  };

  const handleMenuClick = (event, user) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUserForMenu(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUserForMenu(null);
  };

  const handleViewForms = (user) => {
    setSelectedUser(user);
    fetchUserForms(user._id);
    handleMenuClose();
  };

  const handleEditForm = (form) => {
    navigate(`/builder/${form._id}`);
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'moderator': return 'warning';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          User Management
        </Typography>
        <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search users by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Users Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Forms Count</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {user.firstName[0]}{user.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {user._id.slice(-8)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.formsCount || 0} forms
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, user)}
                      disabled={user.role === 'admin'} // Can't delete admin users
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewForms(selectedUserForMenu)}>
          <ViewIcon sx={{ mr: 1 }} />
          View Forms
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setDeleteDialog({ open: true, user: selectedUserForMenu });
            handleMenuClose();
          }}
          disabled={selectedUserForMenu?.role === 'admin'}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* User Forms Dialog */}
      <Dialog 
        open={Boolean(selectedUser)} 
        onClose={() => setSelectedUser(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Forms by {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          {loadingForms ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Form Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Responses</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userForms.map((form) => (
                    <TableRow key={form._id}>
                      <TableCell>{form.title}</TableCell>
                      <TableCell>
                        <Chip
                          label={form.isPublic ? 'Public' : 'Draft'}
                          color={form.isPublic ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{form.responses?.length || 0}</TableCell>
                      <TableCell>
                        {new Date(form.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEditForm(form)}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteForm(form._id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{deleteDialog.user?.firstName} {deleteDialog.user?.lastName}"?
            This will also delete all their forms and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminUsers;
