import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formApi } from '../services/formApi';
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
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as FormIcon,
  Assessment as ResponseIcon,
  DashboardCustomize as TemplateIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Logout as LogoutIcon,
  Share as ShareIcon,
  ContentCopy as DuplicateIcon,
  Brightness7 as LightModeIcon,
  Brightness4 as DarkModeIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

// API base URL
const isLocal = window.location.hostname === 'localhost';
const API_BASE_URL = isLocal 
        ? 'http://localhost:5000/api'  
        : 'https://monk-form-backend.vercel.app/api';

const Dashboard = ({ }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [forms, setForms] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch users data from API
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('🔍 Dashboard - Fetching users...');
      
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      console.log('✅ Dashboard - Users fetched:', data);
      setUsers(data);
    } catch (error) {
      console.error('❌ Dashboard - Error fetching users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch users',
        severity: 'error'
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch forms when Dashboard loads
  useEffect(() => {
    const fetchFormsOnLoad = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }

        // Check if user is admin from localStorage
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = userInfo?.role === 'admin';
        console.log('🔍 Dashboard - Initial load - User role check:', userInfo?.role, 'Is Admin:', isAdmin);

        let response;
        if (isAdmin) {
          // Admin: Fetch all forms from admin endpoint
          console.log('🔍 Dashboard - Initial load - Fetching all forms (admin)');
          response = await fetch(`${API_BASE_URL}/admin/forms`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Regular user: Fetch their own forms
          console.log('🔍 Dashboard - Initial load - Fetching user forms');
          response = await formApi.getForms();
        }

        if (isAdmin) {
          if (!response.ok) {
            throw new Error('Failed to fetch forms');
          }
          const data = await response.json();
          console.log('✅ Dashboard - Initial load - Admin forms fetched:', data);
          setForms(data);
        } else {
          if (response.success) {
            setForms(response?.data);
          } else {
            console.error('Failed to fetch forms');
            setSnackbar({
              open: true,
              message: response.message,
              severity: 'error'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching forms on dashboard load:', error);
        setSnackbar({
          open: true,
          message: 'Failed to fetch forms',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFormsOnLoad();
  }, []);

  // Fetch users when users section is activated
  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers();
    }
  }, [activeSection]);

  // Fetch forms when forms section is activated
  useEffect(() => {
    if (activeSection === 'forms') {
      const fetchForms = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/auth');
            return;
          }

          // Check if user is admin from localStorage
          const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
          const isAdmin = userInfo?.role === 'admin';
          console.log('🔍 Dashboard - Forms section activated');
          console.log('👤 Dashboard - User role check:', userInfo?.role, 'Is Admin:', isAdmin);

          let response;
          if (isAdmin) {
            // Admin: Fetch all forms from admin endpoint
            console.log('🔍 Dashboard - Fetching all forms (admin)');
            response = await fetch(`${API_BASE_URL}/admin/forms`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          } else {
            // Regular user: Fetch their own forms
            console.log('🔍 Dashboard - Fetching user forms');
            response = await formApi.getForms();
          }

          if (isAdmin) {
            if (!response.ok) {
              throw new Error('Failed to fetch forms');
            }
            const data = await response.json();
            console.log('✅ Dashboard - Admin forms fetched:', data);
            setForms(data);
          } else {
            if (response.success) {
              setForms(response?.data);
            } else {
              console.error('Failed to fetch forms');
              setSnackbar({
                open: true,
                message: response.message,
                severity: 'error'
              });
            }
          }
        } catch (error) {
          console.error('Error fetching forms:', error);
          setSnackbar({
            open: true,
            message: 'Failed to fetch forms',
            severity: 'error'
          });
        } finally {
          setLoading(false);
        }
      };

      fetchForms();
    }
  }, [activeSection]);

  // Mock responses data for responses section
  const mockResponses = [
    {
      _id: 'resp1',
      formId: '1',
      formTitle: 'Customer Satisfaction Survey',
      respondentName: 'John Doe',
      email: 'john@example.com',
      submittedAt: '2024-01-15T10:30:00Z',
      status: 'completed',
      responses: [
        { question: 'What is your name?', answer: 'John Doe' },
        { question: 'How satisfied are you?', answer: 'Very Satisfied' }
      ]
    },
    {
      _id: 'resp2',
      formId: '2',
      formTitle: 'Employee Feedback Form',
      respondentName: 'Jane Smith',
      email: 'jane@example.com',
      submittedAt: '2024-01-14T14:20:00Z',
      status: 'completed',
      responses: [
        { question: 'Department', answer: 'Engineering' },
        { question: 'Experience level', answer: 'Senior' }
      ]
    },
    {
      _id: 'resp3',
      formId: '1',
      formTitle: 'Customer Satisfaction Survey',
      respondentName: 'Mike Johnson',
      email: 'mike@example.com',
      submittedAt: '2024-01-13T09:15:00Z',
      status: 'completed',
      responses: [
        { question: 'What is your name?', answer: 'Mike Johnson' },
        { question: 'How satisfied are you?', answer: 'Satisfied' }
      ]
    }
  ];
  const formTemplates = [
  {
    id: "template_1",
    title: "Contact Information Form",
    description: "Collect contact details from your customers or leads.",
    category: "Business",
    fields: [
      {
        type: "text",
        question: "Full Name",
        required: true,
        options: [],
        order: 0
      },
      {
        type: "email",
        question: "Email Address",
        required: true,
        options: [],
        order: 1
      },
      {
        type: "phone",
        question: "Phone Number",
        required: false,
        options: [],
        order: 2
      },
      {
        type: "textarea",
        question: "Your Message",
        required: false,
        options: [],
        order: 3
      }
    ]
  },
  {
    id: "template_2",
    title: "Customer Feedback Survey",
    description: "Gather valuable feedback to improve your products or services.",
    category: "Feedback",
    fields: [
      {
        type: "text",
        question: "Your Name",
        required: false,
        options: [],
        order: 0
      },
      {
        type: "rating",
        question: "How would you rate our service? (1-5 Stars)",
        required: true,
        options: [],
        order: 1
      },
      {
        type: "radio",
        question: "Would you recommend us to others?",
        required: true,
        options: ["Yes, definitely", "Maybe", "No"],
        order: 2
      },
      {
        type: "textarea",
        question: "Any suggestions for improvement?",
        required: false,
        options: [],
        order: 3
      }
    ]
  },
  {
    id: "template_3",
    title: "Job Application Form",
    description: "Standard job application form for hiring candidates.",
    category: "HR",
    fields: [
      {
        type: "text",
        question: "Full Name",
        required: true,
        options: [],
        order: 0
      },
      {
        type: "email",
        question: "Email Address",
        required: true,
        options: [],
        order: 1
      },
      {
        type: "phone",
        question: "Phone Number",
        required: true,
        options: [],
        order: 2
      },
      {
        type: "dropdown",
        question: "Select Department",
        required: true,
        options: ["Engineering", "Marketing", "Sales", "Human Resources"],
        order: 3
      },
      // {
      //   type: "file",
      //   question: "Upload Resume (PDF)",
      //   required: true,
      //   options: [],
      //   order: 4
      // }
    ]
  },
  {
    id: "template_4",
    title: "Event Registration Form",
    description: "Register participants for your upcoming event or webinar.",
    category: "Events",
    fields: [
      {
        type: "text",
        question: "Participant Name",
        required: true,
        options: [],
        order: 0
      },
      {
        type: "email",
        question: "Email Address",
        required: true,
        options: [],
        order: 1
      },
      {
        type: "dropdown",
        question: "Select Ticket Type",
        required: true,
        options: ["General Admission", "VIP", "Student"],
        order: 2
      },
      {
        type: "checkbox",
        question: "Dietary Requirements",
        required: false,
        options: ["Vegetarian", "Vegan", "Halal", "None"],
        order: 3
      }
    ]
  },
  {
    id: "template_5",
    title: "Quiz / Assessment",
    description: "Create a simple quiz for educational or training purposes.",
    category: "Education",
    fields: [
      {
        type: "text",
        question: "Student Name",
        required: true,
        options: [],
        order: 0
      },
      {
        type: "radio",
        question: "What is the capital of Pakistan?",
        required: true,
        options: ["Karachi", "Lahore", "Islamabad", "Peshawar"],
        order: 1
      },
      {
        type: "radio",
        question: "HTML stands for?",
        required: true,
        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language"],
        order: 2
      }
    ]
  }
];

  // Get user info from localStorage
  const getUserInfo = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);

        // Extract first name
        let firstName = user.firstName || 'User';

        // Extract last name
        let lastName = user.lastName || '';

        // Get email
        const email = user.email || 'user@example.com';

        // Clean up names
        if (firstName && firstName !== 'User') {
          firstName = firstName.trim().replace(/[^a-zA-Z0-9\s]/g, '');
          if (firstName.length > 0) {
            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
          }
        }

        if (lastName) {
          lastName = lastName.trim().replace(/[^a-zA-Z0-9\s]/g, '');
          if (lastName.length > 0) {
            lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
          }
        }

        return {
          firstName,
          lastName,
          email,
          role: user.role || 'user',
          fullName: lastName ? `${firstName} ${lastName}` : firstName
        };
      } catch (error) {
        return {
          firstName: 'User',
          lastName: '',
          email: 'user@example.com',
          role: 'user',
          fullName: 'User'
        };
      }
    }
    return {
      firstName: 'User',
      lastName: '',
      email: 'user@example.com',
      role: 'user',
      fullName: 'User'
    };
  };

  const userInfo = getUserInfo();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setSnackbar({
      open: true,
      message: 'Logged out successfully',
      severity: 'success'
    });

    setTimeout(() => {
      navigate('/auth');
    }, 1000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger shortcuts when not typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }

      // Ctrl/Cmd + N: Create new form
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/builder');
        setSnackbar({
          open: true,
          message: 'Creating new form...',
          severity: 'info'
        });
      }

      // Ctrl/Cmd + S: Save current form (if in builder context)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setSnackbar({
          open: true,
          message: 'Save shortcut - Use save button in form builder',
          severity: 'info'
        });
      }

      // Ctrl/Cmd + /: Show keyboard shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setSnackbar({
          open: true,
          message: 'Shortcuts: Ctrl+N (New), Ctrl+S (Save), Ctrl+1-5 (Sections), Ctrl+L (Logout)',
          severity: 'info'
        });
      }

      // Ctrl/Cmd + 1-5: Navigate to sections
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const sections = ['dashboard', 'forms', 'responses', 'users', 'templates', 'settings'];
        const sectionIndex = parseInt(e.key) - 1;
        if (sectionIndex < sections.length) {
          setActiveSection(sections[sectionIndex]);
          setSnackbar({
            open: true,
            message: `Navigated to ${sections[sectionIndex]}`,
            severity: 'info'
          });
        }
      }

      // Ctrl/Cmd + L: Logout
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleLogout();
      }

      // Escape: Clear search or close modals
      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
          setSnackbar({
            open: true,
            message: 'Search cleared',
            severity: 'info'
          });
        }
      }

      // /: Focus search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, navigate, handleLogout]);

  // Calculate stats from real forms data
  const formsArray = Array.isArray(forms) ? forms : [];

  const stats = [
    {
      title: 'Create New Form',
      // value: '+',
      icon: <AddIcon />,
      color: '#2A524D',
      // change: 'Click to create',
      trend: 'create',
      isClickable: true,
      onClick: () => navigate('/builder')
    },
    {
      title: 'Total Forms',
      // value: formsArray.length.toString(),
      icon: <AssignmentIcon />,
      color: '#2A524D',
      change: formsArray.length > 0 ? formsArray.length : '0',
      trend: formsArray.length > 0 ? 'up' : 'stable'
    },
    {
      title: 'Total Responses',
      // value: formsArray.reduce((sum, form) => sum + (form?.responses?.length || 0), 0).toString(),
      icon: <PeopleIcon />,
      color: '#2A524D',
      change: formsArray.reduce((sum, form) => sum + (form?.responses?.length || 0), 0) > 0 ? `${formsArray.reduce((sum, form) => sum + (form?.responses?.length || 0), 0)}` : '0',
      trend: formsArray.reduce((sum, form) => sum + (form?.responses?.length || 0), 0) > 0 ? 'up' : 'stable'
    }
  ];

  // Convert forms data to table format with search functionality
  const recentForms = formsArray
    .filter(form =>
      searchQuery === '' ||
      (form?.title && form.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .slice(0, 3) // Show only 3 recent forms
    .map(form => ({
      id: form?._id || form?.id || 'unknown',
      title: form?.title || 'Untitled Form',
      status: form?.isPublic ? 'active' : 'draft',
      responses: form?.responses?.length || 0,
      completion: form?.completion || 0,
      created: new Date(form?.createdAt || new Date().toISOString()).toLocaleDateString(),
      lastModified: new Date(form?.updatedAt || new Date().toISOString()).toLocaleDateString()
    }));

  // All forms for the "All Forms" tab
  const allForms = formsArray
    .filter(form =>
      searchQuery === '' ||
      (form?.title && form.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .map(form => ({
      id: form?._id || form?.id || 'unknown',
      title: form?.title || 'Untitled Form',
      status: form?.isPublic ? 'active' : 'draft',
      responses: form?.responses?.length || 0,
      completion: form?.completion || 0,
      created: new Date(form?.createdAt || new Date().toISOString()).toLocaleDateString(),
      lastModified: new Date(form?.updatedAt || new Date().toISOString()).toLocaleDateString()
    }));

  console.log(recentForms, 'Ahahahahh')
  // Get user info for role-based menu
  console.log('🔍 Dashboard - User Info:', userInfo);
  console.log('🔍 Dashboard - User Role:', userInfo?.role);
  console.log('🔍 Dashboard - Is Admin:', userInfo?.role === 'admin');
  const isAdmin = userInfo?.role === 'admin';

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, section: 'dashboard' },
    { text: 'Forms', icon: <FormIcon />, section: 'forms' },
    // { text: 'Responses', icon: <ResponseIcon />, path: '/responses' },
    ...(isAdmin ? [{ text: 'Users', icon: <PeopleIcon />, section: 'users' }] : []),
    { text: 'Templates', icon: <TemplateIcon />, section: 'templates' },
    // { text: 'Settings', icon: <SettingsIcon />, p  ath: '/settings' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'draft': return 'Draft';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditForm = (formId) => {
    navigate(`/builder/${formId}`);
  };

  const handlePreviewForm = (formId) => {
    window.open(`/submit/${formId}?preview=true`, '_blank');
  };

  const handleDeleteForm = async (formId) => {
    try {
      await formApi.deleteForm(formId);
      setForms(prev => prev.filter(form => form._id !== formId));
      setSnackbar({
        open: true,
        message: 'Form deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete form',
        severity: 'error'
      });
    }
  };

  const handleShareForm = (form) => {
    const shareUrl = `${window.location.origin}/submit/${form._id}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      setSnackbar({
        open: true,
        message: 'Form link copied to clipboard!',
        severity: 'success'
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      setSnackbar({
        open: true,
        message: 'Form link copied to clipboard!',
        severity: 'success'
      });
    });
  };

  const handleDuplicateForm = async (form) => {
    try {
      const duplicatedForm = {
        title: `${form.title} (Copy)`,
        description: form.description,
        fields: form.fields || [],
        isPublic: false // Start as draft
      };

      const response = await formApi.createForm(duplicatedForm);
      if (response.success) {
        setForms(prev => [...prev, response.data]);
        setSnackbar({
          open: true,
          message: 'Form duplicated successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to duplicate form',
        severity: 'error'
      });
    }
  };

  const handleToggleFormStatus = async (form) => {
    try {
      const updatedForm = {
        ...form,
        isPublic: !form.isPublic
      };

      const response = await formApi.updateForm(form._id, updatedForm);
      if (response.success) {
        setForms(prev => prev.map(f => f._id === form._id ? updatedForm : f));
        setSnackbar({
          open: true,
          message: `Form ${updatedForm.isPublic ? 'published' : 'unpublished'} successfully`,
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update form status',
        severity: 'error'
      });
    }
  };

  const handleUseTemplate = (template) => {
    // Navigate to form builder with template data
    navigate('/builder', {
      state: {
        template: {
          title: template.title,
          description: template.description,
          category: template.category,
          fields: template.fields.map(field => ({
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: field.type,
            question: field.question,
            required: field.required || false,
            options: field.options || [],
            placeholder: field.placeholder || '',
            order: field.order || 0
          }))
        }
      }
    });

    setSnackbar({
      open: true,
      message: `Using ${template.title} template`,
      severity: 'success'
    });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const drawerWidth = 280;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: activeSection === 'dashboard' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            transition: 'all var(--transition-duration) var(--transition-easing)',
            '& .MuiListItemIcon-root': {
              color: activeSection === 'dashboard' ? 'var(--text-inverse)' : 'var(--text-secondary)',
              transition: 'color var(--transition-duration) var(--transition-easing)'
            },
            '& .MuiListItemText-primary': {
              color: activeSection === 'dashboard' ? 'var(--text-inverse)' : 'var(--text-secondary)',
              transition: 'color var(--transition-duration) var(--transition-easing)'
            },
            '& .MuiListItem-root.Mui-selected': {
              bgcolor: activeSection === 'dashboard' ? 'var(--accent-hover)' : 'var(--accent-primary)',
              '& .MuiListItemIcon-root': {
                color: 'var(--text-inverse) !important'
              },
              '& .MuiListItemText-primary': {
                color: 'var(--text-inverse) !important'
              }
            },
            '& .MuiListItem-root:hover': {
              bgcolor: activeSection === 'dashboard' ? 'var(--accent-hover)' : 'var(--bg-tertiary)',
              '& .MuiListItemIcon-root': {
                color: activeSection === 'dashboard' ? 'var(--text-inverse)' : 'var(--accent-primary)'
              },
              '& .MuiListItemText-primary': {
                color: activeSection === 'dashboard' ? 'var(--text-inverse)' : 'var(--text-primary)'
              }
            }
          }
        }}
      >
        <Box sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Logo Section */}
          <Box sx={{
            p: 3,
            textAlign: 'center',
            flexShrink: 0,
            bgcolor: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                mx: 'auto',
                boxShadow: 'var(--shadow-md)',
                transition: 'all var(--transition-duration) var(--transition-easing)'
              }}
            >
              <DashboardIcon sx={{ color: 'var(--text-inverse)', fontSize: '1.5rem' }} />
            </Box>
            <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>
              Access Form
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              Form Builder Platform
            </Typography>
          </Box>

          {/* Navigation Menu */}
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            px: 1,
            pt: 1
          }}>
            <List>
              {menuItems.map((item, index) => (
                <ListItem
                  key={item.text}
                  button
                  onClick={() => item.section ? setActiveSection(item.section) : navigate(item.path)}
                  selected={activeSection === (item.section || item.text.toLowerCase())}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    py: 1.5,
                    px: 2,
                    transition: 'all var(--transition-duration) var(--transition-easing)',
                    bgcolor: activeSection === (item.section || item.text.toLowerCase()) ? 'var(--accent-primary)' : 'transparent',
                    boxShadow: activeSection === (item.section || item.text.toLowerCase()) ? '0 4px 20px var(--accent-primary)' : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: activeSection === (item.section || item.text.toLowerCase()) ? 'var(--accent-hover)' : 'var(--bg-tertiary)',
                      boxShadow: activeSection === (item.section || item.text.toLowerCase()) ? '0 6px 25px var(--accent-primary)' : 'none',
                      '& .MuiListItemIcon-root': {
                        color: activeSection === (item.section || item.text.toLowerCase()) ? 'var(--text-inverse)' : 'var(--accent-primary)'
                      },
                      '& .MuiListItemText-primary': {
                        color: activeSection === (item.section || item.text.toLowerCase()) ? 'var(--text-inverse)' : 'var(--text-primary)'
                      }
                    },
                    '&.Mui-selected': {
                      bgcolor: 'var(--accent-primary)',
                      boxShadow: '0 4px 20px var(--accent-primary)',
                      '& .MuiListItemIcon-root': {
                        color: 'var(--text-inverse)'
                      },
                      '& .MuiListItemText-primary': {
                        color: 'var(--text-inverse)'
                      }
                    },
                    '&.Mui-selected:hover': {
                      bgcolor: 'var(--accent-hover)',
                      boxShadow: '0 6px 25px var(--accent-primary)',
                      '& .MuiListItemIcon-root': {
                        color: 'var(--text-inverse)'
                      },
                      '& .MuiListItemText-primary': {
                        color: 'var(--text-inverse)'
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{
                    color: activeSection === item.text.toLowerCase() ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    minWidth: 40,
                    fontSize: '1.2rem',
                    transition: 'color var(--transition-duration) var(--transition-easing)'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      color: activeSection === item.text.toLowerCase() ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      '& .MuiListItemText-primary': {
                        fontWeight: activeSection === item.text.toLowerCase() ? 600 : 500,
                        fontSize: '0.9rem',
                        transition: 'color var(--transition-duration) var(--transition-easing)'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Bottom Section */}
          <Box sx={{
            flexShrink: 0,
            p: 2,
            pt: 1,
            bgcolor: 'var(--bg-tertiary)',
            borderTop: '1px solid var(--border-color)'
          }}>
            <Divider sx={{ bgcolor: 'var(--border-color)', mb: 3 }} />

            {/* User Profile */}
            <Box className="dashboard-user-profile">
              <Avatar className="dashboard-user-avatar">
                {userInfo.firstName.charAt(0).toUpperCase()}
              </Avatar>
              <Box className="dashboard-user-info">
                <Typography variant="body2" className="dashboard-user-name">
                  {userInfo.fullName}
                </Typography>
                <Typography variant="caption" className="dashboard-user-email">
                  {userInfo.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'var(--bg-primary)',
          minHeight: '100vh'
        }}
      >
        {/* Top Bar */}
        <AppBar
          position="static"
          sx={{
            bgcolor: 'var(--bg-secondary)',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-primary)',
            border: 'none'
          }}
        >
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                👋 Hi, {userInfo.firstName}! Welcome back
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Theme Toggle Button */}
              <Button
                onClick={toggleTheme}
                variant="outlined"
                size="small"
                className="dashboard-theme-toggle"
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </Button>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outlined"
                size="small"
                className="dashboard-logout-btn"
                startIcon={<LogoutIcon />}
              >
                Logout
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Dashboard Content */}
        <Container maxWidth="xl" sx={{ mt: 4, px: 3 }}>
          {(activeSection === 'users' ? loadingUsers : loading) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress sx={{ color: '#2A524D' }} />
            </Box>
          ) : (
            <>
              {/* Render different sections based on activeSection */}
              {activeSection === 'dashboard' && (
                <>
                  {/* Stats Cards */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {stats.map((stat, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card
                          sx={{
                            background: stat.isClickable
                              ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)'
                              : 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                            border: stat.isClickable
                              ? '2px solid var(--accent-primary)'
                              : '1px solid var(--border-color)',
                            borderRadius: 3,
                            boxShadow: stat.isClickable
                              ? '0 8px 30px rgba(42, 82, 77, 0.4)'
                              : 'var(--shadow-md)',
                            transition: 'transform 0.2s ease-in-out',
                            cursor: stat.isClickable ? 'pointer' : 'default',
                            '&:hover': stat.isClickable ? {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 12px 40px rgba(42, 82, 77, 0.5)',
                              border: '2px solid var(--accent-hover)'
                            } : {
                              transform: 'translateY(-4px)',
                              boxShadow: 'var(--shadow-xl)',
                              border: '1px solid var(--accent-primary)'
                            }
                          }}
                          onClick={stat.onClick}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: stat.color,
                                  width: 48,
                                  height: 48,
                                  mr: 2,
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                  color: 'var(--text-inverse)'
                                }}
                              >
                                {stat.icon}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: stat.isClickable ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                    fontSize: '0.875rem',
                                    fontWeight: stat.isClickable ? 'bold' : 'normal'
                                  }}
                                >
                                  {stat.title}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    variant="caption"
                                    color={stat.isClickable ? 'var(--text-inverse)' : (stat.trend === 'up' ? '#16A34A' : 'var(--text-secondary)')}
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {stat.change}
                                  </Typography>
                                  {stat.trend === 'up' && !stat.isClickable && (
                                    <TrendingUpIcon sx={{ color: '#4caf50', fontSize: '1rem' }} />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                            <Typography
                              variant="h4"
                              component="div"
                              sx={{
                                fontWeight: 'bold',
                                color: stat.isClickable ? 'var(--text-inverse)' : 'var(--text-primary)',
                                fontSize: stat.isClickable ? '3rem' : '2.125rem'
                              }}
                            >
                              {stat.value}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Recent Forms Table */}
                  <Card
                    sx={{
                      bgcolor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 3,
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <Box sx={{ p: 3, borderBottom: '1px solid var(--border-color)', bgcolor: 'var(--bg-tertiary)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                          Recent Forms {recentForms.length > 0 && `(${recentForms.length})`}
                        </Typography>

                        {/* Search Bar */}
                        <TextField
                          size="small"
                          placeholder="Search forms..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          InputProps={{
                            style: {
                              color: '#ffffff',
                              backgroundColor: 'rgba(42, 82, 77, 0.1)',
                              borderRadius: 1,
                              padding: '4px 12px'
                            }
                          }}
                          sx={{
                            width: 250,
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(42, 82, 77, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(42, 82, 77, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#2A524D',
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: '#ffffff',
                              '&::placeholder': {
                                color: '#a0a0a0',
                              }
                            }
                          }}
                        />
                      </Box>
                    </Box>

                    {recentForms.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" color="#ffffff" sx={{ mb: 2 }}>
                          No record
                        </Typography>
                        <Typography variant="body2" color="#a0a0a0" sx={{ mb: 3 }}>
                          {forms.length === 0 ? 'Create your first form to get started' : 'No forms match your search'}
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={() => navigate('/builder')}
                          sx={{
                            bgcolor: '#2A524D',
                            color: '#ffffff',
                            '&:hover': { bgcolor: '#1e3a32' }
                          }}
                        >
                          Create Form
                        </Button>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#1a1a1a' }}>
                              <TableCell sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid rgba(42, 82, 77, 0.3)' }}>
                                Form Title
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid rgba(42, 82, 77, 0.3)' }}>
                                Status
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid rgba(42, 82, 77, 0.3)' }}>
                                Responses
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid rgba(42, 82, 77, 0.3)' }}>
                                Actions
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid rgba(42, 82, 77, 0.3)' }}>
                                Sharing
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {recentForms.map((form, index) => (
                              <TableRow
                                key={form.id}
                                hover
                                sx={{
                                  '&:hover': { bgcolor: 'rgba(42, 82, 77, 0.05)' },
                                  '&:last-child td, &:last-child th': { border: 0 }
                                }}
                              >
                                <TableCell component="th" scope="row">
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(42, 82, 77, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#2A524D',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      {form.title.charAt(0)}
                                    </Box>
                                    <Box>
                                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#ffffff' }}>
                                        {form.title}
                                      </Typography>
                                      <Typography variant="caption" color="#a0a0a0" sx={{ fontSize: '0.75rem' }}>
                                        Created: {form.created}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={getStatusLabel(form.status)}
                                    color={getStatusColor(form.status)}
                                    size="small"
                                    sx={{
                                      fontWeight: 'medium',
                                      borderRadius: 1,
                                      bgcolor: form.status === 'active' ? 'rgba(76, 175, 80, 0.2)' :
                                        form.status === 'draft' ? 'rgba(255, 193, 7, 0.2)' :
                                          'rgba(158, 158, 158, 0.2)',
                                      color: form.status === 'active' ? '#4caf50' :
                                        form.status === 'draft' ? '#ffc107' :
                                          '#9e9e9e'
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                                      {(form.responses || 0).toString()}
                                    </Typography>
                                    <Typography variant="caption" color="#a0a0a0">
                                      responses
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditForm(form.id)}
                                      sx={{
                                        color: '#a0a0a0',
                                        '&:hover': {
                                          bgcolor: 'rgba(42, 82, 77, 0.1)',
                                          color: '#2A524D'
                                        }
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handlePreviewForm(form.id)}
                                      sx={{
                                        color: '#a0a0a0',
                                        '&:hover': {
                                          bgcolor: 'rgba(42, 82, 77, 0.1)',
                                          color: '#2A524D'
                                        }
                                      }}
                                    >
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteForm(form.id)}
                                      sx={{
                                        color: '#a0a0a0',
                                        '&:hover': {
                                          bgcolor: 'rgba(42, 82, 77, 0.1)',
                                          color: '#f44336'
                                        }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleShareForm(forms.find(f => f._id === form.id))}
                                      sx={{
                                        color: 'var(--text-secondary)',
                                        '&:hover': {
                                          bgcolor: 'var(--accent-primary)',
                                          color: 'var(--text-inverse)'
                                        }
                                      }}
                                      aria-label="Share form"
                                    >
                                      <ShareIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDuplicateForm(forms.find(f => f._id === form.id))}
                                      sx={{
                                        color: 'var(--text-secondary)',
                                        '&:hover': {
                                          bgcolor: 'var(--accent-primary)',
                                          color: 'var(--text-inverse)'
                                        }
                                      }}
                                      aria-label="Duplicate form"
                                    >
                                      <DuplicateIcon fontSize="small" />
                                    </IconButton>
                                    {/* <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleToggleFormStatus(forms.find(f => f._id === form.id))}
                                      sx={{
                                        borderColor: form.status === 'active' ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                                        color: form.status === 'active' ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                                        fontSize: '0.75rem',
                                        py: 0.5,
                                        px: 1,
                                        '&:hover': {
                                          borderColor: form.status === 'active' ? 'var(--accent-hover)' : 'var(--accent-hover)',
                                          bgcolor: form.status === 'active' ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                                          color: 'var(--text-inverse)'
                                        }
                                      }}
                                      aria-label={`Toggle form status`}
                                    >
                                      {form.status === 'active' ? 'Publish' : 'Unpublish'}
                                    </Button> */}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Card>

                  {/* Quick Actions */}
                  <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  </Box>
                </>
              )}

              {activeSection === 'templates' && (
                <>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, fontWeight: 'bold' }}>
                      All Templates
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#a0a0a0', mb: 4 }}>
                      Choose from our professionally designed form templates to get started quickly
                    </Typography>

                    {/* Templates Grid */}
                    <Grid container spacing={3}>
                      {formTemplates.map((template) => (
                        <Grid item xs={12} sm={6} md={4} key={template.id}>
                          <Card
                            sx={{
                              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                              border: '1px solid rgba(42, 82, 77, 0.2)',
                              borderRadius: 3,
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                                border: '1px solid rgba(42, 82, 77, 0.4)'
                              }
                            }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              {/* Header with icon and title */}
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                <Avatar
                                  sx={{
                                    bgcolor: 'rgba(42, 82, 77, 0.2)',
                                    color: '#2A524D',
                                    width: 48,
                                    height: 48,
                                    mr: 2,
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {template.title.charAt(0)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 0.5 }}>
                                    {template.title}
                                  </Typography>
                                  <Typography variant="caption" color="#a0a0a0" sx={{ fontSize: '0.75rem' }}>
                                    {template.category}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Description */}
                              <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 3, lineHeight: 1.4 }}>
                                {template.description}
                              </Typography>

                              {/* Field count */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="caption" color="#a0a0a0" sx={{ fontSize: '0.7rem' }}>
                                  {template.fields.length} fields
                                </Typography>
                                <Typography variant="caption" color="#a0a0a0" sx={{ fontSize: '0.7rem' }}>
                                  {template.fields.filter(f => f.required).length} required
                                </Typography>
                              </Box>

                              {/* Action Buttons */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="#a0a0a0" sx={{ fontSize: '0.7rem' }}>
                                  Click to use template
                                </Typography>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleUseTemplate(template)}
                                  sx={{
                                    bgcolor: '#2A524D',
                                    color: '#ffffff',
                                    '&:hover': { bgcolor: '#1e3a32' }
                                  }}
                                >
                                  Use Template
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </>
              )}

              {activeSection === 'users' && (
                <>
                  <Box>
                    <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, fontWeight: 'bold' }}>
                      All Users
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#a0a0a0', mb: 4 }}>
                      Manage all users and their forms in the system
                    </Typography>

                    {/* Users Table */}
                    <Box sx={{ 
                      background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 3,
                      boxShadow: 'var(--shadow-md)',
                      overflow: 'hidden'
                    }}>
                      <TableContainer>
                        <Table>
                          <TableHead sx={{ 
                            background: 'var(--bg-primary)',
                            '& .MuiTableCell-head': {
                              color: '#ffffff',
                              fontWeight: 'bold',
                              borderBottom: '1px solid var(--border-color)'
                            }
                          }}>
                            <TableRow>
                              <TableCell>User</TableCell>
                              <TableCell>Email</TableCell>
                              <TableCell>Role</TableCell>
                              <TableCell>Forms</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow 
                                key={user._id}
                                sx={{ 
                                  '&:hover': {
                                    background: 'rgba(42, 82, 77, 0.1)'
                                  },
                                  '& .MuiTableCell-body': {
                                    color: '#ffffff',
                                    borderBottom: '1px solid var(--border-color)'
                                  }
                                }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ 
                                      bgcolor: 'rgba(42, 82, 77, 0.2)',
                                      color: '#2A524D',
                                      mr: 2,
                                      width: 32,
                                      height: 32
                                    }}>
                                      {user.firstName?.charAt(0) || user.email?.charAt(0)}
                                    </Avatar>
                                    <Typography>
                                      {user.firstName} {user.lastName}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={user.role} 
                                    size="small"
                                    color={user.role === 'admin' ? 'error' : 'primary'}
                                    sx={{ 
                                      bgcolor: user.role === 'admin' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                                      color: user.role === 'admin' ? '#f44336' : '#2196f3'
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{user.formsCount || 0}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={user.isActive ? 'Active' : 'Inactive'} 
                                    size="small"
                                    color={user.isActive ? 'success' : 'default'}
                                    sx={{ 
                                      bgcolor: user.isActive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                                      color: user.isActive ? '#4caf50' : '#9e9e9e'
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Box>
                </>
              )}

              {activeSection === 'forms' && (
                <Box>
                  <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, fontWeight: 'bold' }}>
                    All Forms
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#a0a0a0', mb: 4 }}>
                    Manage all your forms in one place
                  </Typography>

                  {/* Forms Grid */}
                  <Grid container spacing={3}>
                    {allForms.map((form) => (
                      <Grid item xs={12} sm={6} md={4} key={form.id}>
                        <Card
                          sx={{
                            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 3,
                            boxShadow: 'var(--shadow-md)',
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 'var(--shadow-xl)',
                              border: '1px solid var(--accent-primary)'
                            }
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            {/* Header with icon and title */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: 'rgba(42, 82, 77, 0.2)',
                                  color: '#2A524D',
                                  width: 48,
                                  height: 48,
                                  mr: 2,
                                  fontSize: '1.2rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {form.title.charAt(0)}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 0.5 }}>
                                  {form.title}
                                </Typography>
                                <Typography variant="caption" color="#a0a0a0" sx={{ fontSize: '0.75rem' }}>
                                  Created: {form.created}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Status and Responses */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Chip
                                label={getStatusLabel(form.status)}
                                size="small"
                                sx={{
                                  bgcolor: form.status === 'active' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 193, 7, 0.2)',
                                  color: form.status === 'active' ? '#4caf50' : '#ffc107',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem'
                                }}
                              />
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', lineHeight: 1 }}>
                                  {form.responses}
                                </Typography>
                                <Typography variant="caption" color="#a0a0a0" sx={{ fontSize: '0.7rem' }}>
                                  responses
                                </Typography>
                              </Box>
                            </Box>

                            {/* Description placeholder */}
                            <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 3, lineHeight: 1.4 }}>
                              Form description and details would appear here...
                            </Typography>

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditForm(form.id)}
                                sx={{
                                  color: '#a0a0a0',
                                  bgcolor: 'rgba(42, 82, 77, 0.1)',
                                  '&:hover': {
                                    bgcolor: 'rgba(42, 82, 77, 0.2)',
                                    color: '#2A524D'
                                  }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleShareForm(form)}
                                sx={{
                                  color: '#a0a0a0',
                                  bgcolor: 'rgba(42, 82, 77, 0.1)',
                                  '&:hover': {
                                    bgcolor: 'rgba(42, 82, 77, 0.2)',
                                    color: '#2A524D'
                                  }
                                }}
                              >
                                <ShareIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteForm(form.id)}
                                sx={{
                                  color: '#a0a0a0',
                                  bgcolor: 'rgba(211, 47, 47, 0.1)',
                                  '&:hover': {
                                    bgcolor: 'rgba(211, 47, 47, 0.2)',
                                    color: '#f44336'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {activeSection === 'responses' && (
                <Box>
                  <Typography variant="h4" sx={{ color: '#ffffff', mb: 3, fontWeight: 'bold' }}>
                    Responses Analysis
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#a0a0a0', mb: 4 }}>
                    Comprehensive insights into your form performance and user engagement
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        sx={{
                          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                          border: '1px solid rgba(42, 82, 77, 0.2)',
                          borderRadius: 3,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                          p: 3
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#2A524D', mr: 2 }}>
                            <PeopleIcon />
                          </Avatar>
                          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                            Total Responses
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                          1,247
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#4caf50' }}>
                          ↑ 12% from last month
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        sx={{
                          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                          border: '1px solid rgba(42, 82, 77, 0.2)',
                          borderRadius: 3,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                          p: 3
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#2A524D', mr: 2 }}>
                            <TrendingUpIcon />
                          </Avatar>
                          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                            Completion Rate
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                          87.3%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#4caf50' }}>
                          ↑ 5% improvement
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        sx={{
                          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                          border: '1px solid rgba(42, 82, 77, 0.2)',
                          borderRadius: 3,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                          p: 3
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#2A524D', mr: 2 }}>
                            <AssignmentIcon />
                          </Avatar>
                          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                            Avg. Time
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                          4m 32s
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ff9800' }}>
                          ↓ 18s faster
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card
                        sx={{
                          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                          border: '1px solid rgba(42, 82, 77, 0.2)',
                          borderRadius: 3,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                          p: 3
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#2A524D', mr: 2 }}>
                            <FormIcon />
                          </Avatar>
                          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                            Active Forms
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1 }}>
                          {forms.filter(f => f.isPublic).length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#4caf50' }}>
                          All collecting data
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={8}>
                      <Card
                        sx={{
                          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                          border: '1px solid rgba(42, 82, 77, 0.2)',
                          borderRadius: 3,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                          p: 3
                        }}
                      >
                        <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>
                          Response Trends (Last 30 Days)
                        </Typography>

                        {/* Simple Bar Chart Representation */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 1, mb: 2 }}>
                          {[45, 52, 38, 65, 72, 58, 81, 69, 95, 88, 76, 92, 103, 87, 94, 108, 95, 112, 98, 105, 118, 102, 125, 115, 108, 122, 135, 128, 142, 138].map((height, index) => (
                            <Box
                              key={index}
                              sx={{
                                flex: 1,
                                bgcolor: '#2A524D',
                                height: `${(height / 150) * 100}%`,
                                borderRadius: '4px 4px 0 0',
                                opacity: 0.8,
                                '&:hover': {
                                  opacity: 1,
                                  bgcolor: '#1e3a32'
                                }
                              }}
                              title={`Day ${index + 1}: ${height} responses`}
                            />
                          ))}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Typography variant="caption" sx={{ color: '#a0a0a0' }}>1</Typography>
                          <Typography variant="caption" sx={{ color: '#a0a0a0' }}>15</Typography>
                          <Typography variant="caption" sx={{ color: '#a0a0a0' }}>30</Typography>
                        </Box>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Card
                        sx={{
                          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                          border: '1px solid rgba(42, 82, 77, 0.2)',
                          borderRadius: 3,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                          p: 3
                        }}
                      >
                        <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>
                          Top Performing Forms
                        </Typography>

                        {forms.slice(0, 5).map((form, index) => (
                          <Box key={form._id} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                                {form.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#2A524D', fontWeight: 'bold' }}>
                                {Math.floor(Math.random() * 200) + 50} responses
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.random() * 60 + 40}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'rgba(42, 82, 77, 0.2)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: '#2A524D'
                                }
                              }}
                            />
                          </Box>
                        ))}
                      </Card>
                    </Grid>
                  </Grid>

                  <Card
                    sx={{
                      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                      border: '1px solid rgba(42, 82, 77, 0.2)',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    <Box sx={{ p: 3, borderBottom: '1px solid rgba(42, 82, 77, 0.2)' }}>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                        Recent Responses
                      </Typography>
                    </Box>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#1a1a1a' }}>
                            <TableCell sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid rgba(42, 82, 77, 0.3)' }}>
                              Form Name
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid rgba(42, 82, 77, 0.3)' }}>
                              Respondent
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid rgba(42, 82, 77, 0.3)' }}>
                              Submitted
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid rgba(42, 82, 77, 0.3)' }}>
                              Status
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid rgba(42, 82, 77, 0.3)' }}>
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mockResponses.slice(0, 5).map((response) => (
                            <TableRow
                              key={response._id}
                              hover
                              sx={{
                                '&:hover': { bgcolor: 'rgba(42, 82, 77, 0.05)' },
                                '&:last-child td, &:last-child th': { border: 0 }
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                                  {response.formTitle}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                                  {response.respondentName}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                                  {new Date(response.submittedAt).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={response.status}
                                  size="small"
                                  sx={{
                                    bgcolor: response.status === 'completed' ? '#4caf50' : '#ff9800',
                                    color: '#ffffff',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    sx={{
                                      color: '#a0a0a0',
                                      '&:hover': {
                                        bgcolor: 'rgba(42, 82, 77, 0.1)',
                                        color: '#2A524D'
                                      }
                                    }}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </Box>
              )}

              {activeSection === 'settings' && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h4" sx={{ color: '#ffffff', mb: 2 }}>
                    Settings
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#a0a0a0' }}>
                    Manage your account settings
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
