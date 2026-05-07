import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { formApi, convertQuestionsToFields, convertFieldsToQuestions } from '../services/formApi';
import { useTheme } from '../contexts/ThemeContext';
import Skip from './Skip';
import Announcer from './Announcer';
import GroupFieldEditor from './GroupFields';
import ConditionalLogicEditor from './ConditionalLogic';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  FormControlLabel,
  Checkbox,
  IconButton,
  Paper,
  Grid,
  Radio,
  RadioGroup,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Menu,
  Fade,
  Tooltip,
  Snackbar,
  Alert,
  Switch,
  CircularProgress,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  DragIndicator as DragIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Palette as ThemeIcon,
  Phone as PhoneIcon,
  CalendarToday as DateIcon,
  Title as TitleIcon,
  Subject as ParagraphIcon,
  RadioButtonChecked as MultipleChoiceIcon,
  CheckBox as CheckboxesIcon,
  ArrowDropDown as DropdownIcon,
  CloudUpload as FileUploadIcon,
  Star as RatingIcon,
  RadioButtonUnchecked as RadioIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as DuplicateIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  PlaylistAdd as RepeatableGroupIcon,
  ViewModule as ViewModuleIcon,
  Shuffle as ConditionalLogicIcon,
} from '@mui/icons-material';

const Builder = ({ children }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme(); // Use dashboard's theme state
  const [formTitle, setFormTitle] = useState('Untitled form');
  const [formDescription, setFormDescription] = useState('Form description');
  const [activeTab, setActiveTab] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentFormId, setCurrentFormId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [liveRegion, setLiveRegion] = useState('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdFormId, setCreatedFormId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [responses, setResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [moveMode, setMoveMode] = useState(null); // Track which field is in move mode
  const [announcement, setAnnouncement] = useState(''); // For screen reader announcements
  const [conditionalLogicField, setConditionalLogicField] = useState(null); // Track which field is editing conditional logic
  const [groupFieldDialog, setGroupFieldDialog] = useState({ open: false, questionIndex: null }); // Track group field editor dialog
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, index: null, type: null, title: '' }); // Track delete confirmation dialog
  const [targetSectionIndex, setTargetSectionIndex] = useState(null); // Track which section should receive new fields
  const previewButtonRef = useRef(null); // Ref for focus management

  // Handle template data from navigation state
  useEffect(() => {
    if (location.state?.template) {
      const template = location.state.template;
      
      // Set form title and description from template
      setFormTitle(template.title || 'Untitled form');
      setFormDescription(template.description || 'Form description');
      
      // Convert template fields to questions format
      if (template.fields && Array.isArray(template.fields)) {
        const convertedQuestions = template.fields.map(field => ({
          id: field.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: field.type || 'text',
          question: field.question || '',
          required: field.required || false,
          options: field.options || [],
          placeholder: field.placeholder || '',
          order: field.order || 0
        }));
        
        // Sort by order and set questions
        convertedQuestions.sort((a, b) => a.order - b.order);
        setQuestions(convertedQuestions);
        
        // Show success message
        setSnackbar({
          open: true,
          message: `Template "${template.title}" loaded successfully!`,
          severity: 'success'
        });
      }
    }
  }, [location.state]);

  // Load form data if ID is provided in URL
  useEffect(() => {
    if (id) {
      loadForm(id);
    }
  }, [id]);

  // Fetch responses when switching to responses tab
  useEffect(() => {
    if (activeTab === 'responses' && currentFormId) {
      fetchResponses();
    }
  }, [activeTab, currentFormId]);

  console.log(responses,' responses')

  // Field types organized by categories for the left sidebar
  const fieldCategories = [
    {
      title: 'Basic fields',
      fields: [
        { id: 'short_answer', name: 'Short answer', icon: <TitleIcon />, description: 'Single line text' },
        { id: 'paragraph', name: 'Paragraph', icon: <ParagraphIcon />, description: 'Long text' },
        { id: 'email', name: 'Email', icon: <TitleIcon />, description: 'Email address' },
        { id: 'number', name: 'Number', icon: <TitleIcon />, description: 'Numeric input' },
        { id: 'phone', name: 'Phone', icon: <PhoneIcon />, description: 'Phone number' },
        { id: 'date', name: 'Date', icon: <DateIcon />, description: 'Date picker' },
      ]
    },
    {
      title: 'Choice fields',
      fields: [
        { id: 'dropdown', name: 'Dropdown', icon: <DropdownIcon />, description: 'Select from list' },
        { id: 'checkboxes', name: 'Checkboxes', icon: <CheckboxesIcon />, description: 'Multiple options' },
        { id: 'multiple_choice', name: 'Multiple choice', icon: <MultipleChoiceIcon />, description: 'Single option' },
        { id: 'radio', name: 'Radio buttons', icon: <RadioIcon />, description: 'Single selection' },
        { id: 'rating', name: 'Rating', icon: <RatingIcon />, description: 'Star rating' },
      ]
    },
    {
      title: 'Advanced logic',
      fields: [
        { id: 'section', name: 'Add Section', icon: <ViewModuleIcon />, description: 'Organize fields into sections' },
        { id: 'repeatable_group', name: 'Repeatable Group', icon: <RepeatableGroupIcon />, description: 'Repeatable field group' },
      ]
    }
  ];

  // Helper function to group questions by sections
  const groupQuestionsBySections = (questions) => {
    const sections = [];
    let currentSection = null;
    let currentSectionFields = [];

    questions.forEach((question, index) => {
      if (question.type === 'section') {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            section: currentSection,
            fields: currentSectionFields
          });
        }
        // Start new section
        currentSection = { ...question, index };
        currentSectionFields = [];
      } else {
        // Add field to current section
        if (currentSection) {
          currentSectionFields.push({ ...question, index });
        } else {
          // Field before any section - add to root level
          sections.push({
            section: null,
            fields: [{ ...question, index }]
          });
        }
      }
    });

    // Save last section if exists
    if (currentSection) {
      sections.push({
        section: currentSection,
        fields: currentSectionFields
      });
    }

    return sections;
  };

    const handleAddField = (fieldType) => {
    console.log('=== handleAddField called ===');
    console.log('fieldType:', fieldType);
    
    const newQuestion = {
      id: crypto.randomUUID(), // Generate stable frontend ID
      type: fieldType,
      question: '',
      required: false,
      options: [],
      placeholder: '',
      conditionalLogic: {
        enabled: false,
        conditions: [],
        action: 'show',
        logicalOperator: 'and'
      }
    };

    // Add specific properties for group field types
    if (fieldType === 'group' || fieldType === 'repeatable_group') {
      newQuestion.groupFields = [
        {
          id: crypto.randomUUID(), // Generate stable frontend ID for group field
          type: 'short_answer',
          question: 'Untitled Question',
          required: false,
          options: []
        }
      ];
      if (fieldType === 'repeatable_group') {
        newQuestion.minItems = 1;
        newQuestion.maxItems = 10;
        newQuestion.addButtonText = 'Add Item';
        newQuestion.removeButtonText = 'Remove';
      }
    }
    
    if (fieldType === 'section') {
      newQuestion.question = 'Section Title';
      newQuestion.sectionDescription = '';

      // Check if there are existing fields that need to be organized
      if (questions.length > 0) {
        // Create Section 1 for existing fields
        const section1 = {
          id: crypto.randomUUID(), // Generate stable frontend ID
          type: 'section',
          question: 'Section 1',
          sectionDescription: '',
          conditionalLogic: {
            enabled: false,
            conditions: [],
            action: 'show',
            logicalOperator: 'and'
          }
        };

        // Find where to insert the new section (at the end for now)
        const insertIndex = questions.length;
        
        // Create new questions array with Section 1, existing fields, and new section
        const newQuestions = [
          section1,
          ...questions,
          newQuestion
        ];
        
        setQuestions(newQuestions);
        setAnnouncement(`Created "Section 1" for existing fields and added a new section.`);
        return; // Stop here since we've handled the section creation
      }
    }
    
    console.log('newQuestion after group logic:', newQuestion);
    
    // Determine where to add the field
    if (targetSectionIndex !== null) {
      // Add field to the target section
      setQuestions(prev => {
        const newQuestions = [...prev];
        
        // Find the end of the target section
        let sectionEndIndex = targetSectionIndex;
        for (let i = targetSectionIndex + 1; i < newQuestions.length; i++) {
          if (newQuestions[i].type === 'section') {
            sectionEndIndex = i - 1;
            break;
          }
          sectionEndIndex = i;
        }
        
        // Insert the new field after the last field in the section
        newQuestions.splice(sectionEndIndex + 1, 0, newQuestion);
        console.log('Questions after adding field to section:', newQuestions);
        return newQuestions;
      });
      
      const sectionName = questions[targetSectionIndex]?.question || 'Section';
      setAnnouncement(`New ${fieldType.replace('_', ' ')} field added to "${sectionName}"`);
      setTargetSectionIndex(null); // Reset target section
    } else {
      // Add field to the end (normal behavior)
      setQuestions(prev => {
        const newQuestions = [...prev, newQuestion];
        console.log('Questions after adding field:', newQuestions);
        return newQuestions;
      });
      
      const position = questions.length + 1;
      setAnnouncement(`New ${fieldType.replace('_', ' ')} field added at position ${position}`);
    }
  };

  const handleAddOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push(`Option ${newQuestions[questionIndex].options.length + 1}`);
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleDeleteOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(newQuestions);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

    const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedItem?.type === 'existing') {
      const draggedIndex = draggedItem.index;

      // --- REMOVED VALIDATION ---
      // Humne wo logic hata diya taake user easily drag and drop kar sake
      // Aur section khali ho saky agar user utha kar le jaye.

      // --- PERFORM DROP ---
      const newQuestions = [...questions];
      const [draggedQuestion] = newQuestions.splice(draggedIndex, 1);
      newQuestions.splice(targetIndex, 0, draggedQuestion);
      setQuestions(newQuestions);
    }
    
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedItem({ type: 'existing', index });
    e.dataTransfer.effectAllowed = 'move';
  };

  // Group field handlers
  const handleGroupFieldChange = (fieldIndex, groupFieldIndex, property, value) => {
    const newQuestions = [...questions];
    const groupFields = [...(newQuestions[fieldIndex].groupFields || [])];
    groupFields[groupFieldIndex] = {
      ...groupFields[groupFieldIndex],
      [property]: value
    };
    newQuestions[fieldIndex].groupFields = groupFields;
    setQuestions(newQuestions);
  };

  const handleAddGroupField = (fieldIndex, groupField) => {
    const newQuestions = [...questions];
    const groupFields = [...(newQuestions[fieldIndex].groupFields || [])];
    groupFields.push(groupField);
    newQuestions[fieldIndex].groupFields = groupFields;
    setQuestions(newQuestions);
  };

  const handleDeleteGroupField = (fieldIndex, groupFieldIndex) => {
    const newQuestions = [...questions];
    const groupFields = [...(newQuestions[fieldIndex].groupFields || [])];
    groupFields.splice(groupFieldIndex, 1);
    newQuestions[fieldIndex].groupFields = groupFields;
    setQuestions(newQuestions);
  };

  const handleConditionalLogicClick = (fieldIndex) => {
    setConditionalLogicField(fieldIndex);
  };

  const handleKeyDown = (e, questionIndex) => {
    // Check if the event target is an input field or textarea
    const isInputField = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
    
    // If we're in an input field, don't intercept space for navigation
    if (isInputField) {
      return; // Let the input handle the space normally
    }
    
    switch (e.key) {
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        if (moveMode === questionIndex) {
          // Exit move mode
          setMoveMode(null);
          setAnnouncement(`Move mode disabled for field ${questionIndex + 1}`);
        } else {
          // Enter move mode
          setMoveMode(questionIndex);
          setAnnouncement(`Move mode enabled for field ${questionIndex + 1}. Use arrow keys to move, space to drop.`);
        }
        break;
      case 'ArrowUp':
        if (moveMode === questionIndex) {
          e.preventDefault();
          // Move field up
          if (questionIndex > 0) {
            const newQuestions = [...questions];
            [newQuestions[questionIndex - 1], newQuestions[questionIndex]] = [newQuestions[questionIndex], newQuestions[questionIndex - 1]];
            setQuestions(newQuestions);
            setMoveMode(questionIndex - 1); // Update move mode to new position
            setAnnouncement(`Field moved to position ${questionIndex}`);
          }
        }
        break;
      case 'ArrowDown':
        if (moveMode === questionIndex) {
          e.preventDefault();
          // Move field down
          if (questionIndex < questions.length - 1) {
            const newQuestions = [...questions];
            [newQuestions[questionIndex + 1], newQuestions[questionIndex]] = [newQuestions[questionIndex], newQuestions[questionIndex + 1]];
            setQuestions(newQuestions);
            setMoveMode(questionIndex + 1); // Update move mode to new position
            setAnnouncement(`Field moved to position ${questionIndex + 2}`);
          }
        }
        break;
      case 'Enter':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // Toggle edit mode for question
          const input = document.querySelector(`#question-${questionIndex}-input`);
          if (input) {
            input.focus();
            input.select();
          }
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (e.altKey) {
          e.preventDefault();
          handleDeleteQuestion(questionIndex);
        }
        break;
    }
  };

  // Save form to API
  const handleSaveForm = async () => {
    if (!formTitle.trim()) {
      setSnackbar({
        open: true,
        message: 'Form title is required',
        severity: 'error'
      });
      return;
    }

    // Validate that multiple choice fields have options
    const multipleChoiceFields = questions.filter(q => 
      q.type === 'dropdown' || q.type === 'checkboxes' || q.type === 'multiple_choice'
    );
    
    const fieldsWithoutOptions = multipleChoiceFields.filter(q => 
      !q.options || q.options.length === 0
    );
    
    // Validate repeatable groups with only dummy data
    const repeatableGroupsWithOnlyDummyData = questions.filter(q => 
      (q.type === 'repeatable_group' || q.type === 'group') && 
      q.required && 
      (!q.groupFields || q.groupFields.length === 0 || 
       (q.groupFields.length === 1 && q.groupFields[0].question === 'Untitled Question'))
    );
    
    if (repeatableGroupsWithOnlyDummyData.length > 0) {
      setSnackbar({
        open: true,
        message: 'Required repeatable groups must contain at least one field with content',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      const formData = {
        title: formTitle,
        description: formDescription,
        fields: convertQuestionsToFields(questions)
      };

      console.log(formData, 'Rimshahhah',questions)

      let result;
      if (currentFormId) {
        // Update existing form
        result = await formApi.updateForm(currentFormId, formData);
        setAnnouncement('Form updated successfully');
        setSnackbar({
          open: true,
          message: 'Form updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new form
        result = await formApi.createForm(formData);
        setCurrentFormId(result.id);
        setAnnouncement('Form created successfully');
        setSnackbar({
          open: true,
          message: 'Form created successfully!',
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save form',
        severity: 'error'
      });
      setAnnouncement('Error: Form could not be saved');
    } finally {
      setLoading(false);
    }
  };

  // Load form from API (for editing existing form)
  const loadForm = async (formId) => {
    setLoading(true);
    
    try {
      // Get form from the forms list (since we don't have getFormById anymore)
      const response = await formApi.getForms();
      
      if (response.success) {
        const form = response.data.find(f => f._id === formId);
        
        if (form) {
          setFormTitle(form.title);
          setFormDescription(form.description || '');
          setQuestions(convertFieldsToQuestions(form.fields || []));
          setCurrentFormId(form._id);
        } else {
          throw new Error('Form not found');
        }
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to load form',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close snackbar
  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fetch form responses
  const fetchResponses = async () => {
    if (!currentFormId) return;
    
    setResponsesLoading(true);
    try {
      // Get the form data from the forms list (same as dashboard)
      const response = await formApi.getForms();
      
      if (response.success) {
        const form = response.data.find(f => f._id === currentFormId);
        
        if (form && form.responses) {
          setResponses(form.responses);
        } else {
          setResponses([]);
        }
      } else {
        setResponses([]);
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
      setResponses([]);
    } finally {
      setResponsesLoading(false);
    }
  };

  const updateQuestion = (index, field, value) => {
    console.log('🔍 Builder - updateQuestion called');
    console.log('📋 Index:', index);
    console.log('📋 Field:', field);
    console.log('📋 Value:', value);
    console.log('📋 Current field at index:', questions[index]);
    
    // Normal field update
    setQuestions(prev => {
      const newQuestions = prev.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      );
      
      console.log('📋 Updated questions array:', newQuestions);
      return newQuestions;
    });
  };

  console.log(questions, 'Hahahahahah')

  const deleteQuestion = (index) => {
    setQuestions(prev => prev.filter((q, i) => i !== index));
  };

  const handleDeleteQuestion = (index) => {
    const questionToDelete = questions[index];
    
    if (questionToDelete?.type === 'section') {
      // Show confirmation dialog for section deletion
      setDeleteConfirmDialog({
        open: true,
        index: index,
        type: 'section',
        title: questionToDelete.question
      });
    } else {
      // Regular field deletion
      deleteQuestion(index);
    }
  };

  const confirmDeleteSection = () => {
    const { index } = deleteConfirmDialog;
    const questionToDelete = questions[index];
    
    // Find all fields that belong to this section
    const fieldsToDelete = [];
    let nextSectionIndex = -1;
    
    // Find the next section (if any)
    for (let i = index + 1; i < questions.length; i++) {
      if (questions[i]?.type === 'section') {
        nextSectionIndex = i;
        break;
      }
    }
    
    // Mark this section and all fields until next section for deletion
    if (nextSectionIndex !== -1) {
      // Delete section and fields until next section
      const endIndex = nextSectionIndex;
      for (let i = index; i < endIndex; i++) {
        fieldsToDelete.push(i);
      }
    } else {
      // Delete section and all remaining fields
      for (let i = index; i < questions.length; i++) {
        fieldsToDelete.push(i);
      }
    }
    
    // Remove the section and its fields (in reverse order to maintain indices)
    const newQuestions = [...questions];
    for (let i = fieldsToDelete.length - 1; i >= 0; i--) {
      newQuestions.splice(fieldsToDelete[i], 1);
    }
    setQuestions(newQuestions);
    
    // Show announcement
    setAnnouncement(`Section "${questionToDelete.question}" and its ${fieldsToDelete.length - 1} fields deleted`);
    
    // Close dialog
    setDeleteConfirmDialog({ open: false, index: null, type: null, title: '' });
  };

  const cancelDelete = () => {
    setDeleteConfirmDialog({ open: false, index: null, type: null, title: '' });
  };

  const resetTargetSection = () => {
    setTargetSectionIndex(null);
  };

  const handleAddFieldAfter = (index) => {
    const newQuestion = {
      id: crypto.randomUUID(), // Generate stable frontend ID
      type: 'short_answer',
      question: '',
      required: false,
      options: [],
      placeholder: '',
      conditionalLogic: {
        enabled: false,
        conditions: [],
        action: 'show',
        logicalOperator: 'and'
      }
    };
    
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions.splice(index + 1, 0, newQuestion);
      return newQuestions;
    });
    
    setAnnouncement(`New field added after position ${index + 1}`);
  };

    const handleAddSectionAfter = (index) => {
    let newQuestions = [...questions];
    
    // 1. Check karo ke is field se pehle koi "orphan" fields hain ya nahi
    let startOfBlock = 0;
    let hasSectionBefore = false;
    
    // Peeche ki taraf loop chalaao taake sab se aakhri section dhundho
    for (let i = index - 1; i >= 0; i--) {
      if (newQuestions[i].type === 'section') {
        startOfBlock = i + 1; // Section ke baad se block shuru
        hasSectionBefore = true;
        break;
      }
    }

    // 2. Logic: Wrapper Section banany ki zaroorat hai ya nahi?
    // Agar orphans start se shuru hain (startOfBlock === 0)
    // AUR current field pehla field nahi hai (index > 0)
    // AUR uske pehle koi section nahi hai (!hasSectionBefore)
    // TOH wrapper section ban jayega.
    let insertIndex = index;
    let createdWrapper = false;

    if (startOfBlock === 0 && index > 0 && !hasSectionBefore) {
      createdWrapper = true;
      
      // Wrapper section create karo
      const wrapperSection = {
        id: crypto.randomUUID(), // Generate stable frontend ID
        type: 'section',
        question: 'Untitled Section',
        sectionDescription: '',
        conditionalLogic: {
          enabled: false,
          conditions: [],
          action: 'show',
          logicalOperator: 'and'
        }
      };
      
      // Start mein wrapper insert karo
      newQuestions.splice(0, 0, wrapperSection);
      
      // Kyunki start mein ek item add hua, is liye index +1 shift kar dena hai
      insertIndex = index + 1;
    }
    
    // 3. User requested Section create karo
    const newSection = {
      id: crypto.randomUUID(), // Generate stable frontend ID
      type: 'section',
      question: 'New Section',
      sectionDescription: '',
      conditionalLogic: {
        enabled: false,
        conditions: [],
        action: 'show',
        logicalOperator: 'and'
      }
    };
    
    // Section ko calculated index par insert karo
    newQuestions.splice(insertIndex, 0, newSection);
    
    setQuestions(newQuestions);
    
    // Update announcement message
    if (createdWrapper) {
      setAnnouncement(`Created wrapper for previous fields and added new section`);
    } else {
      setAnnouncement(`Added new section`);
    }
    
    handleMenuClose();
  };

  const duplicateQuestion = (index) => {
    const question = questions[index];
    if (question) {
      const newQuestion = {
        ...question,
        id: crypto.randomUUID(), // Generate new stable frontend ID for duplicate
        question: question.question,
      };
      
      // If it's a group field, generate new IDs for group fields too
      if (newQuestion.groupFields) {
        newQuestion.groupFields = newQuestion.groupFields.map(gf => ({
          ...gf,
          id: crypto.randomUUID() // Generate new stable frontend ID for each group field
        }));
      }
      
      setQuestions(prev => [...prev.slice(0, index + 1), newQuestion, ...prev.slice(index + 1)]);
    }
  };

  const handleMenuClick = (event, index) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuestion(index);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuestion(null);
  };

  const handleQuestionClick = (index) => {
    const question = questions[index];
    
    if (question?.type === 'section') {
      // Move all previous fields into this section
      moveFieldsIntoSection(index);
    }
    
    setSelectedQuestion(index);
  };

  const moveFieldsIntoSection = (sectionIndex) => {
    const newQuestions = [...questions];
    const section = newQuestions[sectionIndex];
    
    // Find all previous fields that are not in any section
    const fieldsToSeparate = [];
    let startOfSection = sectionIndex;
    
    // Find the start of this section (look backwards for previous section)
    for (let i = sectionIndex - 1; i >= 0; i--) {
      if (newQuestions[i]?.type === 'section') {
        startOfSection = i + 1;
        break;
      }
    }
    
    // Collect all regular fields between previous section and this section
    for (let i = startOfSection; i < sectionIndex; i++) {
      if (newQuestions[i]?.type !== 'section') {
        fieldsToSeparate.push(i);
      }
    }
    
    if (fieldsToSeparate.length > 0) {
      // Create a new section for these fields
      const newSection = {
        type: 'section',
        question: 'New Section',
        sectionDescription: '',
        conditionalLogic: {
          enabled: false,
          conditions: [],
          action: 'show',
          logicalOperator: 'and'
        }
      };
      
      // Insert the new section at the position where the first field was
      newQuestions.splice(startOfSection, 0, newSection);
      
      // Move all the fields to after the new section
      const movedFields = [];
      for (let i = fieldsToSeparate.length - 1; i >= 0; i--) {
        const fieldIndex = fieldsToSeparate[i];
        movedFields.unshift(newQuestions[fieldIndex + 1]); // +1 because we inserted new section
        newQuestions.splice(fieldIndex + 1, 1); // Remove from old position
      }
      
      // Add all moved fields after the new section
      newQuestions.splice(startOfSection + 1, 0, ...movedFields);
      
      setQuestions(newQuestions);
      setAnnouncement(`Created new section and moved ${fieldsToSeparate.length} fields into it`);
    }
  };

  const renderQuestionField = (question, index) => {
    switch (question.type) {
      case 'short_answer':
        return (
          <TextField
            fullWidth
            placeholder="Short answer text"
            variant="outlined"
            size="small"
            disabled
            className={isDarkMode ? 'form-field-dark' : ''}
          />
        );
      case 'paragraph':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Long answer text"
            variant="outlined"
            size="small"
            disabled
            className={isDarkMode ? 'form-field-dark' : ''}
          />
        );
      case 'email':
        return (
          <TextField
            fullWidth
            type="email"
            placeholder="Enter your email"
            variant="outlined"
            size="small"
            disabled
            className={isDarkMode ? 'form-field-dark' : ''}
          />
        );
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            placeholder="Enter number"
            variant="outlined"
            size="small"
            disabled
            className={isDarkMode ? 'form-field-dark' : ''}
          />
        );
      case 'phone':
        return (
          <TextField
            fullWidth
            type="tel"
            placeholder="Enter phone number"
            variant="outlined"
            size="small"
            disabled
            className={isDarkMode ? 'form-field-dark' : ''}
          />
        );
      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            variant="outlined"
            size="small"
            disabled
            className={isDarkMode ? 'form-field-dark' : ''}
          />
        );
      case 'dropdown':
        return (
          <Box>
            {/* Options display area */}
            <Box sx={{ mb: 2 }}>
              {question.options?.map((option, optionIndex) => (
                <Box key={optionIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ 
                    color: '#666666', 
                    fontSize: '14px', 
                    minWidth: '30px',
                    textAlign: 'center'
                  }}>
                    {optionIndex + 1}.
                  </Typography>
                  <TextField
                    fullWidth
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optionIndex] = e.target.value;
                      updateQuestion(index, 'options', newOptions);
                      // Auto select this option when typing
                      updateQuestion(index, 'activeOption', e.target.value);
                    }}
                    variant="standard"
                    placeholder="Option text"
                    InputProps={{
                      style: { 
                        fontSize: '14px', 
                        color: '#000000',
                        borderBottom: option === question.activeOption ? '2px solid #2A524D' : '1px solid #e0e0e0',
                        borderRadius: 0,
                        padding: '4px 0',
                        transition: 'border-color 0.3s ease',
                        '&:focus': {
                          borderBottom: '2px solid #2A524D',
                          animation: 'typingBorder 1s ease-in-out infinite',
                        }
                      }
                    }}
                    sx={{ 
                      flex: 1,
                      '& .MuiInput-underline:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:hover:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:after': {
                        borderBottom: 'none',
                      },
                      '& .MuiInputBase-input': {
                        animation: option === question.activeOption ? 'typingBorder 1s ease-in-out infinite' : 'none',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          backgroundColor: '#2A524D',
                          animation: option === question.activeOption ? 'typingBorder 1s ease-in-out infinite' : 'none',
                        }
                      }
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newOptions = question.options?.filter((_, i) => i !== optionIndex);
                      updateQuestion(index, 'options', newOptions);
                    }}
                    sx={{ 
                      color: '#999999',
                      '&:hover': {
                        color: '#ff4444',
                        bgcolor: 'rgba(255, 68, 68, 0.1)',
                      }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </Box>
              ))}
              
              {/* Add option button */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 2,
                cursor: 'pointer',
                color: '#2A524D',
                '&:hover': { color: '#1f3a2a' }
              }}>
                <Typography 
                  onClick={() => {
                    const newOption = `Option ${(question.options?.length || 0) + 1}`;
                    const newOptions = [...(question.options || []), newOption];
                    updateQuestion(index, 'options', newOptions);
                    // Auto select the newly added option
                    updateQuestion(index, 'activeOption', newOption);
                    // Auto focus on the next render
                    setTimeout(() => {
                      const inputElements = document.querySelectorAll('input');
                      if (inputElements.length > 0) {
                        inputElements[inputElements.length - 1].focus();
                        inputElements[inputElements.length - 1].select();
                      }
                    }, 0);
                  }}
                  sx={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AddIcon sx={{ fontSize: '16px' }} />
                  <Typography>Add option</Typography>
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      case 'checkboxes':
        return (
          <Box>
            {/* Options display area */}
            <Box sx={{ mb: 2 }}>
              {question.options?.map((option, optionIndex) => (
                <Box key={optionIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ 
                    color: '#666666', 
                    fontSize: '14px', 
                    minWidth: '30px',
                    textAlign: 'center'
                  }}>
                    {optionIndex + 1}.
                  </Typography>
                  <TextField
                    fullWidth
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optionIndex] = e.target.value;
                      updateQuestion(index, 'options', newOptions);
                      // Auto select this option when typing
                      updateQuestion(index, 'activeOption', e.target.value);
                    }}
                    variant="standard"
                    placeholder="Option text"
                    InputProps={{
                      style: { 
                        fontSize: '14px', 
                        color: '#000000',
                        borderBottom: option === question.activeOption ? '2px solid #2A524D' : '1px solid #e0e0e0',
                        borderRadius: 0,
                        padding: '4px 0',
                        transition: 'border-color 0.3s ease',
                        '&:focus': {
                          borderBottom: '2px solid #2A524D',
                          animation: 'typingBorder 1s ease-in-out infinite',
                        }
                      }
                    }}
                    sx={{ 
                      flex: 1,
                      '& .MuiInput-underline:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:hover:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:after': {
                        borderBottom: 'none',
                      },
                      '& .MuiInputBase-input': {
                        animation: option === question.activeOption ? 'typingBorder 1s ease-in-out infinite' : 'none',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          backgroundColor: '#2A524D',
                          animation: option === question.activeOption ? 'typingBorder 1s ease-in-out infinite' : 'none',
                        }
                      }
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newOptions = question.options?.filter((_, i) => i !== optionIndex);
                      updateQuestion(index, 'options', newOptions);
                    }}
                    sx={{ 
                      color: '#999999',
                      '&:hover': {
                        color: '#ff4444',
                        bgcolor: 'rgba(255, 68, 68, 0.1)',
                      }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </Box>
              ))}
              
              {/* Add option button */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 2,
                cursor: 'pointer',
                color: '#2A524D',
                '&:hover': { color: '#1f3a2a' }
              }}>
                <Typography 
                  onClick={() => {
                    const newOption = `Option ${(question.options?.length || 0) + 1}`;
                    const newOptions = [...(question.options || []), newOption];
                    updateQuestion(index, 'options', newOptions);
                    // Auto select the newly added option
                    updateQuestion(index, 'activeOption', newOption);
                    // Auto focus on the next render
                    setTimeout(() => {
                      const inputElements = document.querySelectorAll('input');
                      if (inputElements.length > 0) {
                        inputElements[inputElements.length - 1].focus();
                        inputElements[inputElements.length - 1].select();
                      }
                    }, 0);
                  }}
                  sx={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AddIcon sx={{ fontSize: '16px' }} />
                  <Typography>Add option</Typography>
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      case 'multiple_choice':
        return (
          <Box>
            {/* Options display area */}
            <Box sx={{ mb: 2 }}>
              {question.options?.map((option, optionIndex) => (
                <Box key={optionIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ 
                    color: '#666666', 
                    fontSize: '14px', 
                    minWidth: '30px',
                    textAlign: 'center'
                  }}>
                    {optionIndex + 1}.
                  </Typography>
                  <TextField
                    fullWidth
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optionIndex] = e.target.value;
                      updateQuestion(index, 'options', newOptions);
                      // Auto select this option when typing
                      updateQuestion(index, 'activeOption', e.target.value);
                    }}
                    variant="standard"
                    placeholder="Option text"
                    InputProps={{
                      style: { 
                        fontSize: '14px', 
                        color: '#000000',
                        borderBottom: option === question.activeOption ? '2px solid #2A524D' : '1px solid #e0e0e0',
                        borderRadius: 0,
                        padding: '4px 0',
                        transition: 'border-color 0.3s ease',
                        '&:focus': {
                          borderBottom: '2px solid #2A524D',
                          animation: 'typingBorder 1s ease-in-out infinite',
                        }
                      }
                    }}
                    sx={{ 
                      flex: 1,
                      '& .MuiInput-underline:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:hover:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:after': {
                        borderBottom: 'none',
                      },
                      '& .MuiInputBase-input': {
                        animation: option === question.activeOption ? 'typingBorder 1s ease-in-out infinite' : 'none',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          backgroundColor: '#2A524D',
                          animation: option === question.activeOption ? 'typingBorder 1s ease-in-out infinite' : 'none',
                        }
                      }
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newOptions = question.options?.filter((_, i) => i !== optionIndex);
                      updateQuestion(index, 'options', newOptions);
                    }}
                    sx={{ 
                      color: '#999999',
                      '&:hover': {
                        color: '#ff4444',
                        bgcolor: 'rgba(255, 68, 68, 0.1)',
                      }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </Box>
              ))}
              
              {/* Add option button */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 2,
                cursor: 'pointer',
                color: '#2A524D',
                '&:hover': { color: '#1f3a2a' }
              }}>
                <Typography 
                  onClick={() => {
                    const newOption = `Option ${(question.options?.length || 0) + 1}`;
                    const newOptions = [...(question.options || []), newOption];
                    updateQuestion(index, 'options', newOptions);
                    // Auto select the newly added option
                    updateQuestion(index, 'activeOption', newOption);
                    // Auto focus on the next render
                    setTimeout(() => {
                      const inputElements = document.querySelectorAll('input');
                      if (inputElements.length > 0) {
                        inputElements[inputElements.length - 1].focus();
                        inputElements[inputElements.length - 1].select();
                      }
                    }, 0);
                  }}
                  sx={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AddIcon sx={{ fontSize: '16px' }} />
                  <Typography>Add option</Typography>
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      case 'file_upload':
        return (
          <Button
            variant="outlined"
            component="label"
            disabled
            fullWidth
            sx={{ borderStyle: 'dashed' }}
          >
            <FileUploadIcon sx={{ mr: 1 }} />
            Upload file
          </Button>
        );
      case 'rating':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <RatingIcon key={star} sx={{ color: '#ffc107', cursor: 'pointer' }} />
            ))}
          </Box>
        );
      case 'radio':
        return (
          <Box>
            {/* Options display area */}
            <Box sx={{ mb: 2 }}>
              {question.options?.map((option, optionIndex) => (
                <Box key={optionIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ 
                    color: '#666666', 
                    fontSize: '14px', 
                    minWidth: '30px',
                    textAlign: 'center'
                  }}>
                    {optionIndex + 1}.
                  </Typography>
                  <TextField
                    fullWidth
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optionIndex] = e.target.value;
                      updateQuestion(index, 'options', newOptions);
                    }}
                    variant="standard"
                    placeholder="Option text"
                    InputProps={{
                      style: { 
                        fontSize: '14px', 
                        color: '#000000',
                        borderBottom: option === question.activeOption ? '2px solid #2A524D' : '1px solid #e0e0e0',
                        borderRadius: 0,
                        padding: '4px 0',
                        transition: 'border-color 0.3s ease',
                        '&:focus': {
                          borderBottom: '2px solid #2A524D',
                          animation: 'typingBorder 1s ease-in-out infinite',
                        }
                      }
                    }}
                    sx={{ 
                      flex: 1,
                      '& .MuiInput-underline:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:hover:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:after': {
                        borderBottom: 'none',
                      },
                      '& .MuiInputBase-input': {
                        animation: option === question.activeOption ? 'typingBorder 1s ease-in-out infinite' : 'none',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          backgroundColor: '#2A524D',
                          animation: option === question.activeOption ? 'typingBorder 1s ease-in-out infinite' : 'none',
                        }
                      }
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newOptions = question.options?.filter((_, i) => i !== optionIndex);
                      updateQuestion(index, 'options', newOptions);
                    }}
                    sx={{ 
                      color: '#999999',
                      '&:hover': {
                        color: '#ff4444',
                        bgcolor: 'rgba(255, 68, 68, 0.1)',
                      }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </Box>
              ))}
              
              {/* Add option button */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 2,
                cursor: 'pointer',
                color: '#2A524D',
                '&:hover': { color: '#1f3a2a' }
              }}>
                <Typography 
                  onClick={() => {
                    const newOption = `Option ${(question.options?.length || 0) + 1}`;
                    const newOptions = [...(question.options || []), newOption];
                    updateQuestion(index, 'options', newOptions);
                    // Auto select newly added option
                    updateQuestion(index, 'activeOption', newOption);
                    // Auto focus on the next render
                    setTimeout(() => {
                      const inputElements = document.querySelectorAll('input');
                      if (inputElements.length > 0) {
                        inputElements[inputElements.length - 1].focus();
                        inputElements[inputElements.length - 1].select();
                      }
                    }, 0);
                  }}
                  sx={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <AddIcon sx={{ fontSize: '16px' }} />
                  <Typography>Add option</Typography>
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      case 'group':
      case 'repeatable_group':
        return (
          <GroupFieldEditor
            field={question}
            fieldIndex={index}
            onChange={updateQuestion}
            onGroupFieldChange={handleGroupFieldChange}
            onAddGroupField={handleAddGroupField}
            onDeleteGroupField={handleDeleteGroupField}
            allFields={questions}
          />
        );
      default:
        return null;
    }
  };

  console.log(questions, 'Ufffffff')

  return (
    <Box sx={{ height: '100vh', display: 'flex', bgcolor: 'var(--bg-primary)' }}>
      {/* Skip to main content */}
      <Skip href="#form-builder-content" />
      
      {/* Screen reader announcements */}
      <Announcer message={announcement} />
      
      {/* Skip to main content for screen readers */}
      <span id="main-content" tabIndex="-1"></span>
      
      {/* Left Sidebar - Field Types (Hidden) */}
      <Paper
        sx={{
          width: 280,
          borderRight: '1px solid var(--border-color)',
          borderRadius: 0,
          display: 'none', // Hidden since field types are now next to each field
          flexDirection: 'column',
          bgcolor: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-lg)'
        }}
        elevation={0}
        role="complementary"
        aria-label="Form field types sidebar"
      >
        <Box onClick={() => navigate('/dashboard')} sx={{ p: 3, borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ArrowBackIcon sx={{ color: 'var(--accent-primary)', fontSize: '1.2rem' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Add Fields
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Click to add to form
          </Typography>
        </Box>
        
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }} role="main" aria-label="Form field types sidebar">
          {targetSectionIndex !== null && (
            <Paper
              sx={{
                p: 2,
                mb: 2,
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                border: '1px solid #1976d2',
                borderRadius: 2
              }}
            >
              <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600, mb: 1 }}>
                🎯 Section Selected
              </Typography>
              <Typography variant="caption" sx={{ color: '#1976d2', display: 'block' }}>
                Click any field below to add it to "{questions[targetSectionIndex]?.question || 'Selected Section'}"
              </Typography>
              <Button
                size="small"
                onClick={resetTargetSection}
                sx={{ 
                  mt: 1, 
                  fontSize: '11px',
                  color: '#1976d2',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' }
                }}
              >
                Cancel
              </Button>
            </Paper>
          )}
          {fieldCategories.map((category, categoryIndex) => (
            <Box key={category.title} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: 'var(--text-secondary)', 
                mb: 2, 
                textTransform: 'uppercase', 
                letterSpacing: '0.8px',
                opacity: 0.7
              }}>
                {category.title}
              </Typography>
              
              {category.fields.map((fieldType) => (
                <Paper
                  key={fieldType.id}
                  onClick={() => handleAddField(fieldType.id)}
                  sx={{
                    p: 1.5,
                    mb: 1.5,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    borderRadius: 2,
                    bgcolor: '#393939',
                    '&:hover': {
                      bgcolor: '#4a4a4a',
                      borderColor: 'var(--accent-primary)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box 
                      className="iconBox"
                      sx={{ 
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: 'var(--accent-primary-alpha)',
                        transition: 'all 0.2s ease-in-out'
                      }}>
                      {fieldType.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-primary)', mb: 0.5 }}>
                        {fieldType.name}
                      </Typography>
                      {/* <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', lineHeight: 1.3 }}>
                        {fieldType.description}
                      </Typography> */}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <Paper
          sx={{
            p: 2,
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}
          elevation={0}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {formTitle}
            </Typography>
            <Chip label="Draft" size="small" color="default" />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Preview">
              <Button
                onClick={() => {
                  if (currentFormId) {
                    window.open(`/submit/${currentFormId}?preview=true`, '_blank');
                    setAnnouncement('Preview opened in new tab');
                  } else {
                    setSnackbar({
                      open: true,
                      message: 'Please save the form first',
                      severity: 'warning'
                    });
                  }
                }}
                ref={previewButtonRef}
                aria-label="Preview form in new tab"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: '#2A524D',
                  color: '#2A524D',
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 1,
                  '&:hover': {
                    borderColor: '#2A524D',
                    bgcolor: 'rgba(42, 82, 77, 0.1)',
                    color: '#2A524D'
                  }
                }}
              >
                <PreviewIcon sx={{ mr: 1, fontSize: '1rem' }} />
                Preview
              </Button>
            </Tooltip>
            <Tooltip title="Save">
              <Button
                onClick={handleSaveForm}
                disabled={loading}
                aria-label="Save form"
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#2A524D',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 1,
                  '&:hover': {
                    bgcolor: '#1e3a32'
                  },
                  '&:disabled': {
                    bgcolor: '#ccc',
                    color: '#666'
                  }
                }}
              >
                <SaveIcon sx={{ mr: 1, fontSize: '1rem' }} />
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </Tooltip>
            {/* <Tooltip title="Settings">
              <IconButton aria-label="Form settings">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Help">
              <IconButton aria-label="Help and documentation">
                <HelpIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Theme">
              <IconButton aria-label="Change theme">
                <ThemeIcon />
              </IconButton>
            </Tooltip> */}
          </Box>
        </Paper>

        {/* Tabs */}
        <Box className="builder-tabs" sx={{ borderBottom: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', bgcolor: 'var(--bg-secondary)' }}>
          <Box sx={{ display: 'flex' }}>
            {['questions', 'responses'].map((tab) => (
              <Button
                key={tab}
                className={`builder-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                sx={{
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  color: activeTab === tab ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  bgcolor: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                  '&:hover': {
                    bgcolor: activeTab === tab ? 'var(--accent-hover)' : 'var(--bg-tertiary)',
                    color: activeTab === tab ? 'var(--text-inverse)' : 'var(--text-primary)'
                  }
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Form Canvas */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3, bgcolor: 'var(--bg-primary)' }} role="main" aria-label="Form builder canvas">
          {activeTab === 'questions' && (
            <Fade in timeout={300}>
              <Box id="form-builder-content" role="region" aria-label="Form questions" sx={{ maxWidth: '800px', mx: 'auto' }}>
                {/* Form Title and Description */}
                <Paper sx={{ p: 3, mb: 3, border: '1px solid var(--border-color)', borderRadius: 2, bgcolor: isDarkMode ? '#393939' : '#ffffff', boxShadow: 'var(--shadow-md)' }}>
                  <TextField
                    fullWidth
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Form title"
                    sx={{ 
                      mb: 2,
                      '& .MuiInput-underline:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:hover:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:after': {
                        borderBottom: 'none',
                      },
                    }}
                    InputProps={{
                      style: { fontSize: '24px', fontWeight: 600, color: isDarkMode ? '#ffffff' : '#000000' },
                    }}
                    InputLabelProps={{
                      style: { color: isDarkMode ? '#ffffff' : '#000000' }
                    }}
                  />
                  <TextField
                    fullWidth
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    variant="standard"
                    placeholder="Form description"
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:hover:before': {
                        borderBottom: 'none',
                      },
                      '& .MuiInput-underline:after': {
                        borderBottom: 'none',
                      },
                    }}
                    InputProps={{
                      style: { fontSize: '16px', color: isDarkMode ? '#ffffff' : '#000000' },
                    }}
                    InputLabelProps={{
                      style: { color: isDarkMode ? '#ffffff' : '#000000' }
                    }}
                  />
                </Paper>

                {/* Questions */}
                {questions.length === 0 ? (
                  <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed var(--border-color)', borderRadius: 2, bgcolor: isDarkMode ? '#393939' : '#ffffff', boxShadow: 'var(--shadow-sm)' }}>
                    <Typography variant="h6" sx={{ mb: 1, color: isDarkMode ? '#ffffff' : '#000000' }}>
                      Start building your form
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#ffffff' : '#000000', mb: 3 }}>
                      Add your first field or section to get started
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddField('short_answer')}
                        sx={{
                          bgcolor: 'var(--accent-primary)',
                          '&:hover': { bgcolor: 'var(--accent-primary-dark)' }
                        }}
                      >
                        Add Field
                      </Button>
                    </Box>
                  </Paper>
                ) : (
                  <Box>
                    {questions.map((question, index) => {
                                            if (question.type === 'section') {
                        // Render section container
                        return (
                          <Box key={index} sx={{ mb: 4 }}>
                            <Paper
                              sx={{
                                p: 3,
                                border: targetSectionIndex === index ? '3px solid #1976d2' : '2px solid var(--accent-primary)',
                                borderRadius: 3,
                                bgcolor: targetSectionIndex === index ? 'rgba(25, 118, 210, 0.08)' : 'var(--accent-primary-alpha)',
                                position: 'relative',
                                boxShadow: targetSectionIndex === index ? '0 4px 12px rgba(25, 118, 210, 0.3)' : 'var(--shadow-sm)',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ViewModuleIcon sx={{ color: 'var(--accent-primary)', fontSize: 28 }} />
                                <Box sx={{ flex: 1 }}>
                                  <TextField
                                    fullWidth
                                    value={question.question}
                                    onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                    placeholder="Section Title"
                                    variant="standard"
                                    InputProps={{
                                      style: { fontSize: '18px', fontWeight: 600, color: isDarkMode ? '#ffffff' : '#000000' },
                                    }}
                                    sx={{ 
                                      '& .MuiInput-underline:before': { borderBottom: 'none' },
                                      '& .MuiInput-underline:hover:before': { borderBottom: 'none' },
                                      '& .MuiInput-underline:after': { borderBottom: 'none' },
                                    }}
                                  />
                                  {targetSectionIndex === index && (
                                    <Typography variant="caption" sx={{ 
                                      color: '#1976d2', 
                                      fontSize: '11px', 
                                      fontWeight: 600,
                                      mt: 1,
                                      display: 'block',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px'
                                    }}>
                                      🎯 Ready to add fields here
                                    </Typography>
                                  )}
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteQuestion(index)}
                                  sx={{ color: 'var(--text-secondary)' }}
                                  aria-label={`Delete section ${index + 1}`}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Paper>

                            {/* NEW LOGIC: Empty Section Drop Zone */}
                                                        {/* NEW LOGIC: Empty Section Drop Zone */}
                            {(() => {
                              // Check karo ke section ke baad koi field hai ya nahi
                              const nextItem = questions[index + 1];
                              
                              // Agar next item nahi hai (End of form) ya next item section hai (Empty section)
                              if (!nextItem || nextItem.type === 'section') {
                                return (
                                  <Box
                                    onDragOver={(e) => handleDragOver(e, index + 1)}
                                    onDrop={(e) => handleDrop(e, index + 1)}
                                    sx={{
                                      mt: 2,
                                      minHeight: '80px',
                                      border: dragOverIndex === index + 1 ? '2px dashed #1976d2' : '2px dashed #e0e0e0',
                                      borderRadius: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: dragOverIndex === index + 1 ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                                      transition: 'all 0.2s ease',
                                      cursor: 'copy',
                                      color: dragOverIndex === index + 1 ? '#1976d2' : '#999',
                                      fontSize: '14px',
                                      flexDirection: 'column',
                                      gap: 1
                                    }}
                                  >
                                    {dragOverIndex === index + 1 ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {/* ArrowDownIcon hata diya taake error na aye */}
                                        <Typography sx={{ fontWeight: 600 }}>Drop field here</Typography>
                                      </Box>
                                    ) : (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AddIcon fontSize="small" />
                                        <Typography variant="body2">Drop fields here to add to section</Typography>
                                      </Box>
                                    )}
                                  </Box>
                                );
                              }
                              return null;
                            })()}
                          </Box>
                        );
                      } else {
                        // Render regular field with indentation if it's under a section
                        // Find the most recent section before this field
                        let currentSectionIndex = -1;
                        for (let i = index - 1; i >= 0; i--) {
                          if (questions[i]?.type === 'section') {
                            currentSectionIndex = i;
                            break;
                          }
                        }
                        const isInSection = currentSectionIndex !== -1;
                        return (
                          <Box
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            tabIndex={0}
                            aria-label={`Question ${index + 1}: ${question.question || 'Untitled question'}. ${moveMode === index ? 'Move mode enabled. Use arrow keys to move, space to drop.' : 'Press space to enable move mode.'}`}
                            role="button"
                            sx={{
                              mb: 2,
                              ml: isInSection ? 4 : 0,
                              pl: isInSection ? 2 : 0,
                              borderLeft: isInSection ? '2px solid var(--accent-primary-alpha)' : 'none',
                              cursor: moveMode === index ? 'move' : 'default',
                              border: moveMode === index 
                                ? '3px solid #1976d2' 
                                : dragOverIndex === index 
                                  ? '2px dashed #2A524D' 
                                  : '1px solid #e0e0e0',
                              borderRadius: 2,
                              bgcolor: moveMode === index ? 'rgba(25, 118, 210, 0.08)' : '#ffffff',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                transform: moveMode === index ? 'none' : 'translateY(-2px)'
                              },
                              '&:focus': {
                                outline: moveMode === index 
                                  ? '3px solid #1976d2' 
                                  : '2px solid #2A524D',
                                outlineOffset: '2px'
                              }
                            }}
                          >
                            <Paper
                              sx={{
                                p: 3,
                                border: '1px solid var(--border-color)',
                                borderRadius: 2,
                                bgcolor: 'var(--bg-secondary)',
                                boxShadow: 'var(--shadow-sm)',
                                '&:hover': {
                                  boxShadow: 'var(--shadow-md)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <DragIcon 
                                  sx={{ color: 'var(--text-secondary)', cursor: 'grab', mt: 1 }} 
                                  aria-label={`Drag handle for question ${index + 1}: ${question.question || 'Untitled question'}`}
                                  tabIndex={-1}
                                />
                                
                                <Box sx={{ flex: 1 }}>
                                  {isInSection && (
                                    <Typography variant="caption" sx={{ 
                                      color: 'var(--accent-primary)', 
                                      fontSize: '11px', 
                                      fontWeight: 600,
                                      mb: 1,
                                      display: 'block',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px'
                                    }}>
                                      Section: {questions[currentSectionIndex]?.question || 'Untitled Section'}
                                    </Typography>
                                  )}
                                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                                  <TextField
                                    fullWidth
                                    value={question.question}
                                    onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                    placeholder="Question"
                                    variant="standard"
                                    InputProps={{
                                      style: { fontSize: '16px', fontWeight: 500, color: isDarkMode ? '#ffffff' : '#000000' },
                                    }}
                                    sx={{ 
                                      flex: 1,
                                      '& .MuiInput-underline:before': {
                                        borderBottom: 'none',
                                      },
                                      '& .MuiInput-underline:hover:before': {
                                        borderBottom: 'none',
                                      },
                                      '& .MuiInput-underline:after': {
                                        borderBottom: 'none',
                                      },
                                    }}
                                    InputLabelProps={{
                                      style: { color: isDarkMode ? '#ffffff' : '#000000' }
                                    }}
                                  />
                                  <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Field Type</InputLabel>
                                    <Select
                                      value={question.type}
                                      onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                                      label="Field Type"
                                    >
                                      <MenuItem value="short_answer">Short Answer</MenuItem>
                                      <MenuItem value="paragraph">Paragraph</MenuItem>
                                      <MenuItem value="email">Email</MenuItem>
                                      <MenuItem value="number">Number</MenuItem>
                                      <MenuItem value="phone">Phone</MenuItem>
                                      <MenuItem value="date">Date</MenuItem>
                                      <MenuItem value="dropdown">Dropdown</MenuItem>
                                      <MenuItem value="checkboxes">Checkboxes</MenuItem>
                                      <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                                      <MenuItem value="radio">Radio</MenuItem>
                                                                            <MenuItem value="repeatable_group">Repeatable Group</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Box>
                                  
                                  {renderQuestionField(question, index)}
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={question.required}
                                          onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                                          size="small"
                                          sx={{
                                            color: '#2A524D',
                                            '&.Mui-checked': {
                                              color: '#2A524D',
                                            }
                                          }}
                                        />
                                      }
                                      label={<Typography sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>Required</Typography>}
                                      sx={{ 
                                        color: '#000000',
                                        '& .MuiFormControlLabel-label': {
                                          fontSize: '14px'
                                        }
                                      }}
                                    />
                                  </Box>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {/* 🔧 RESTRICTION: Only show Conditional Logic for choice-based fields */}
                                  {(['dropdown', 'multiple_choice', 'radio', 'checkboxes'].includes(question.type)) && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleConditionalLogicClick(index)}
                                      sx={{ color: 'var(--text-secondary)' }}
                                      aria-label={`Conditional logic for question ${index + 1}: ${question.question || 'Untitled question'}`}
                                    >
                                      <ConditionalLogicIcon sx={{ fontSize: '20px' }} />
                                    </IconButton>
                                  )}
                                  
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleMenuClick(e, index)}
                                    sx={{ color: 'var(--text-secondary)' }}
                                    aria-label={`More options for question ${index + 1}: ${question.question || 'Untitled question'}`}
                                  >
                                    <MoreVertIcon sx={{ color: 'var(--text-secondary)' }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Paper>
                          </Box>
                        );
                      }
                    })}
                  </Box>
                )}

                {/* Drop zone for new questions */}
                {/* {questions.length > 0 && (
                  <Box
                    onDragOver={(e) => handleDragOver(e, questions.length)}
                    onDrop={(e) => handleDrop(e, questions.length)}
                    sx={{
                      p: 2,
                      border: dragOverIndex === questions.length ? '2px dashed #1976d2' : '2px dashed #e0e0e0',
                      borderRadius: 1,
                      textAlign: 'center',
                      bgcolor: dragOverIndex === questions.length ? '#f5f5f5' : 'transparent',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Click elements from the left sidebar to add more fields
                    </Typography>
                  </Box>
                )} */}
              </Box>
            </Fade>
          )}

          {activeTab === 'responses' && (
            <Fade in timeout={300}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Responses
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {responses.length} {responses.length === 1 ? 'response' : 'responses'}
                  </Typography>
                </Box>
                
                {responsesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading responses...</Typography>
                  </Box>
                ) : responses.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ mb: 4 }}>
                      <Box sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        bgcolor: '#f5f5f5', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mx: 'auto',
                        className: isDarkMode ? 'responses-dark empty-state-icon' : ''
                      }}>
                        <Typography variant="h4" sx={{ color: '#999' }}>📋</Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No responses yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Share your form to start collecting responses
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ minHeight: '600px', p: 3, overflowY: 'auto' }}>
                    {questions.map((question, questionIndex) => (
                      <Paper
                        key={questionIndex}
                        sx={{
                          mb: 2,
                          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                          border: '1px solid rgba(42, 82, 77, 0.2)',
                          borderRadius: 3,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                            border: '1px solid rgba(42, 82, 77, 0.4)'
                          }
                        }}
                      >
                        {/* Question Header */}
                        <Box sx={{ 
                          bgcolor: isDarkMode ? '#3B3B3B' : '#f8f9fa', 
                          px: 3, 
                          py: 2, 
                          borderBottom: '1px solid #e0e0e0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          className: isDarkMode ? 'responses-dark responses-header' : ''
                        }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: '#333',
                              fontSize: '18px'
                            }}
                          >
                            {question.question}
                            {question.required && <span style={{ color: '#d32f2f' }}> *</span>}
                          </Typography>
                          
                          {/* Response Count */}
                          <Chip 
                            label={`${responses.filter(r => 
                              r.responses?.find(resp => resp.fieldId === question.id && resp.value)
                            ).length} responses`}
                            size="small"
                            sx={{
                              bgcolor: '#1976d2',
                              color: '#ffffff',
                              fontWeight: 'medium',
                              fontSize: '12px'
                            }}
                          />
                        </Box>
                        
                        {/* All Responses for this Question */}
                        <Box sx={{ p: 3 }}>
                          {responses.map((response, responseIndex) => {
                            const fieldResponse = response.responses?.find(
                              r => r.fieldId === question.id
                            );
                            
                            return (
                              <Box 
                                key={responseIndex} 
                                sx={{ 
                                  mb: 2,
                                  p: 2,
                                  bgcolor: isDarkMode ? '#3B3B3B' : '#f8f9fa',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  className: isDarkMode ? 'responses-dark response-item' : ''
                                }}
                              >
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: fieldResponse?.value ? '#333' : '#999',
                                    fontSize: '14px',
                                    flex: 1
                                  }}
                                >
                                  {fieldResponse?.value ? (
                                    Array.isArray(fieldResponse.value) 
                                      ? fieldResponse.value.join(', ') 
                                      : fieldResponse.value
                                  ) : (
                                    <span style={{ fontStyle: 'italic' }}>No response</span>
                                  )}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: '#666',
                                    ml: 2,
                                    minWidth: '120px',
                                    textAlign: 'right'
                                  }}
                                >
                                  {new Date(response.submittedAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Paper>
                    ))}
                    
                    {/* Summary Stats */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0', className: isDarkMode ? 'responses-dark summary-stats' : '' }}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Showing {responses.length} {responses.length === 1 ? 'response' : 'responses'} • 
                        {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Fade>
          )}

          {activeTab === 'settings' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Form settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Settings panel coming soon...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Question Menu */}
            {/* Question Menu */}
            {/* Question Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { duplicateQuestion(selectedQuestion); handleMenuClose(); }}>
          <DuplicateIcon sx={{ mr: 1, fontSize: 20 }} />
          Duplicate
        </MenuItem>
        {questions[selectedQuestion]?.type !== 'section' && (
          <MenuItem onClick={() => { handleAddFieldAfter(selectedQuestion); handleMenuClose(); }}>
            <AddIcon sx={{ mr: 1, fontSize: 20 }} />
            Add Field
          </MenuItem>
        )}
        
        {/* UPDATED LOGIC: Simple Previous Check */}
        {(() => {
          // 1. Agar user khud Section Header par click kar raha hai, to hide karo
          if (questions[selectedQuestion]?.type === 'section') return null;

          // 2. Agar selected item ke pehla (immediate previous) item Section hai, to hide karo
          // (Kyunki wo section ka pehla field hai)
          if (selectedQuestion > 0 && questions[selectedQuestion - 1].type === 'section') {
            return null;
          }

          // 3. Baki sab cases mein Button Show karo
          // (A) Index 0 par ho (kuch nahi pehle)
          // (B) Orphan ho (pehle normal field ho)
          // (C) Section ke andar kisi beech mein ho (pehle normal field ho)
          return (
            <MenuItem onClick={() => { handleAddSectionAfter(selectedQuestion); handleMenuClose(); }}>
              <ViewModuleIcon sx={{ mr: 1, fontSize: 20 }} />
              Add Section
            </MenuItem>
          );
        })()}

        <MenuItem onClick={() => { handleDeleteQuestion(selectedQuestion); handleMenuClose(); }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Success Dialog */}
      <Dialog 
        open={successDialogOpen} 
        onClose={() => setSuccessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0a0a0a',
            border: '1px solid rgba(42, 82, 77, 0.3)',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          color: '#ffffff',
          borderBottom: '1px solid rgba(42, 82, 77, 0.2)',
          pb: 2
        }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            bgcolor: '#4CAF50', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <CheckCircleIcon sx={{ color: '#ffffff', fontSize: 24 }} />
          </Box>
          <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
            Form Created Successfully!
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ color: '#a0a0a0', mb: 3 }}>
            Your form is ready to use. Share the response link with users to collect their responses.
          </Typography>
          
          <Box sx={{ 
            bgcolor: 'rgba(0, 0, 0, 0.3)', 
            border: '1px solid rgba(42, 82, 77, 0.2)',
            borderRadius: 2,
            p: 2,
            mb: 2
          }}>
            <Typography variant="caption" sx={{ color: '#a0a0a0', mb: 1, display: 'block' }}>
              Response Link:
            </Typography>
            <TextField
              fullWidth
              value={`${window.location.origin}/submit/${createdFormId}`}
              variant="standard"
              InputProps={{
                readOnly: true,
                sx: {
                  color: '#ffffff',
                  '&::before': { borderBottom: 'none' },
                  '&::after': { borderBottom: 'none' }
                }
              }}
              sx={{
                '& .MuiInput-root': { color: '#ffffff' }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/submit/${createdFormId}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              sx={{
                borderColor: '#2A524D',
                color: '#2A524D',
                '&:hover': {
                  borderColor: '#2A524D',
                  bgcolor: 'rgba(42, 82, 77, 0.1)'
                }
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              onClick={() => {
                window.open(`${window.location.origin}/submit/${createdFormId}`, '_blank');
              }}
              sx={{
                borderColor: '#2A524D',
                color: '#2A524D',
                '&:hover': {
                  borderColor: '#2A524D',
                  bgcolor: 'rgba(42, 82, 77, 0.1)'
                }
              }}
            >
              Open Form
            </Button>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(42, 82, 77, 0.2)' }}>
          <Button
            onClick={() => setSuccessDialogOpen(false)}
            variant="contained"
            sx={{
              bgcolor: '#2A524D',
              color: '#ffffff',
              '&:hover': {
                bgcolor: 'rgba(42, 82, 77, 0.8)'
              }
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmDialog.open} 
        onClose={cancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          color: isDarkMode ? '#ffffff' : '#000000'
        }}>
          <DeleteIcon sx={{ color: '#d32f2f', fontSize: 24 }} />
          Confirm Delete
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ color: isDarkMode ? '#ffffff' : '#000000', mb: 2 }}>
            Are you sure you want to delete this section?
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
            Section: <strong>"{deleteConfirmDialog.title}"</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            This will remove the section and all fields that belong to it.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(211, 47, 47, 0.2)' }}>
          <Button
            onClick={cancelDelete}
            variant="outlined"
            sx={{
              borderColor: '#666',
              color: '#666',
              '&:hover': {
                borderColor: '#000',
                color: '#000'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteSection}
            variant="contained"
            sx={{
              bgcolor: '#d32f2f',
              color: '#ffffff',
              '&:hover': {
                bgcolor: 'rgba(211, 47, 47, 0.8)'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conditional Logic Dialog */}
      {conditionalLogicField !== null && (
        <ConditionalLogicEditor
          field={questions[conditionalLogicField]}
          allFields={questions}
          onChange={(fieldId, property, value) => {
            console.log('🔍 Builder - ConditionalLogic onChange called');
            console.log('📋 conditionalLogicField index:', conditionalLogicField);
            console.log('📋 Field ID from editor:', fieldId);
            console.log('📋 Property:', property);
            console.log('📋 Value:', value);
            console.log('📋 Field at conditionalLogicField:', questions[conditionalLogicField]);
            
            // 🔧 CRITICAL FIX: Use fieldId from editor instead of stale index
            // Find the current field by ID to avoid closure issues
            const currentFieldIndex = questions.findIndex(q => q.id === fieldId);
            console.log('🔧 Found field index by ID:', currentFieldIndex);
            
            if (currentFieldIndex !== -1) {
              updateQuestion(currentFieldIndex, property, value);
            } else {
              console.error('❌ Field not found for ID:', fieldId);
            }
          }}
          open={conditionalLogicField !== null}
          onClose={() => setConditionalLogicField(null)}
        />
      )}

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

export default Builder;
