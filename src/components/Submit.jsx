import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Container,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { formApi } from '../services/formApi';
import { useTheme } from '../contexts/ThemeContext';
import { FormFillerProvider, useFormFiller } from '../contexts/FormFillerContext';
import { GroupFieldRenderer, RepeatableGroupFieldRenderer } from './FormGroupFields';

// Inner component that uses the FormFillerContext
const SubmitContent = ({ isPreview = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlPreviewMode = searchParams.get('preview') === 'true';
  const finalPreviewMode = isPreview || urlPreviewMode;
  
  // Use FormFillerContext instead of basic useState
  const { 
    answers, 
    repeatableAnswers, 
    visibleFieldIds, 
    loading: contextLoading, 
    error,
    actions,
    evaluateVisibility 
  } = useFormFiller();

  // Store previous answers to prevent unnecessary calculations
  const previousAnswersRef = useRef({});
  
  // 🔧 FIXED: Flag to control when branching logic should execute
  const isNextActionRef = useRef(false);
  
  // 🔧 NEW: Track navigation history for intelligent back button
  const previousSectionHistory = useRef([]);

  // Local visibility calculation engine
  const calculateVisibility = useCallback((fields, currentAnswers, isNextAction = false) => {
    console.log('🧮 Calculating visibility locally:', { fields, currentAnswers, isNextAction });
    
    const visibleFieldIds = [];
    let shouldJumpToSection = false;
    let targetSectionId = null;
    
    // First pass: Check all conditional logic
    fields.forEach((field, index) => {
      if (field.conditionalLogic && field.conditionalLogic.enabled) {
        const { conditions, action, jumpToFieldId } = field.conditionalLogic;
        
        // Evaluate all conditions for this field
        let allConditionsMet = true;
        
        if (conditions && conditions.length > 0) {
          // Check if ALL conditions are met (AND logic)
          allConditionsMet = conditions.every(condition => {
            if (!condition.fieldId) return false;
            
            const conditionValue = currentAnswers[condition.fieldId];
            const { operator, value } = condition;
            
            // Basic condition evaluation
            switch (operator) {
              case 'equals':
                return conditionValue === value;
              case 'not_equals':
                return conditionValue !== value;
              case 'is_empty':
                return !conditionValue || conditionValue === '';
              case 'is_not_empty':
                return conditionValue && conditionValue !== '';
              default:
                return false;
            }
          });
        }
        
        // If conditions are met, handle the action
        if (allConditionsMet) {
          console.log(`✅ Field "${field.question}" conditions met, action: ${action}`);
          
          switch (action) {
            case 'show':
              visibleFieldIds.push(field.id);
              break;
              
            case 'hide':
              // Don't add to visibleFieldIds (field remains hidden)
              break;
              
            case 'jump_to':
              if (jumpToFieldId) {
                shouldJumpToSection = true;
                targetSectionId = jumpToFieldId;
                console.log(`🎯 Jump to section: ${jumpToFieldId}`);
              }
              visibleFieldIds.push(field.id);
              break;
              
            case 'end_form':
              visibleFieldIds.push(field.id);
              // Form ends here - no need to process further
              break;
              
            default:
              visibleFieldIds.push(field.id);
              break;
          }
        } else {
          // If conditions not met, show field by default
          visibleFieldIds.push(field.id);
        }
      } else {
        // No conditional logic, show field by default
        visibleFieldIds.push(field.id);
      }
    });
    
    // Second pass: Handle jump to section logic (only on Next button click)
    if (shouldJumpToSection && targetSectionId && isNextAction) {
      console.log('🎯 Processing jump to section logic (Next button action)...');
      
      // Find the target section index
      const targetSectionIndex = fields.findIndex(f => f.id === targetSectionId);
      
      if (targetSectionIndex !== -1) {
        // Hide all fields that come BEFORE the target section
        for (let i = 0; i < targetSectionIndex; i++) {
          const fieldBeforeTarget = fields[i];
          if (fieldBeforeTarget && !visibleFieldIds.includes(fieldBeforeTarget.id)) {
            // This field was already hidden, don't add it
            continue;
          }
          
          // Remove from visible if it was added earlier
          const indexToRemove = visibleFieldIds.indexOf(fieldBeforeTarget.id);
          if (indexToRemove > -1) {
            visibleFieldIds.splice(indexToRemove, 1);
          }
        }
        
        // Show the target section and all fields after it
        for (let i = targetSectionIndex; i < fields.length; i++) {
          const fieldFromTarget = fields[i];
          if (!visibleFieldIds.includes(fieldFromTarget.id)) {
            visibleFieldIds.push(fieldFromTarget.id);
          }
        }
      }
    }
    
    console.log('👁️ Final visible fields:', visibleFieldIds);
    return visibleFieldIds;
  }, []);
  
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [responsesDialogOpen, setResponsesDialogOpen] = useState(false);
  const [responses, setResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const { isDarkMode } = useTheme();

  // Combine answers and repeatable answers for form data
  const formData = { ...answers, ...repeatableAnswers };

  // Helper function to group fields into sections
  const groupFieldsIntoSections = (fields) => {
    if (!fields || fields.length === 0) return [];
    
    const sections = [];
    let currentSection = null;
    let currentSectionFields = [];
    
    fields.forEach((field, index) => {
      if (field.type === 'section') {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            sectionId: currentSection.id,
            section: currentSection,
            fields: currentSectionFields
          });
        }
        
        // Start new section
        currentSection = field;
        currentSectionFields = [];
      } else {
        // Add field to current section
        currentSectionFields.push(field);
      }
    });
    
    // Add the last section
    if (currentSection) {
      sections.push({
        sectionId: currentSection.id,
        section: currentSection,
        fields: currentSectionFields
      });
    } else {
      // No sections found, treat whole form as one page
      sections.push({
        sectionId: null,
        section: null,
        fields: fields
      });
    }
    
    return sections;
  };

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await formApi.getFormById(id);
      setForm(response?.data);
      
      // Initialize form data using FormFillerContext
      const initialAnswers = {};
      const initialRepeatableAnswers = {};
      
      response?.data?.fields?.forEach(field => {
        if (field.type === 'group') {
          initialAnswers[field.id] = {};
          field.groupFields?.forEach(groupField => {
            initialAnswers[field.id][groupField.id] = '';
          });
        } else if (field.type === 'repeatable_group') {
          initialRepeatableAnswers[field.id] = [{}];
          field.groupFields?.forEach(groupField => {
            initialRepeatableAnswers[field.id][0][groupField.id] = '';
          });
        } else {
          initialAnswers[field.id] = '';
        }
      });
      
      // Set initial data in context
      Object.keys(initialAnswers).forEach(fieldId => {
        actions.setAnswer(fieldId, initialAnswers[fieldId]);
      });
      
      Object.keys(initialRepeatableAnswers).forEach(groupId => {
        actions.setRepeatableAnswer(groupId, initialRepeatableAnswers[groupId]);
      });
      
      // Initialize visibility
      const allFieldIds = response?.data?.fields?.map(f => f.id) || [];
      actions.setVisibility(allFieldIds, false); // Don't cleanup on initial load
      
    } catch (error) {
      console.error('Error fetching form:', error);
      // Use mock data when API fails
      const mockFormData = {
        title: 'Sample Form',
        description: 'This is a sample form for testing',
        fields: []
      };
      setForm(mockFormData);
      const initialAnswers = {};
      const initialRepeatableAnswers = {};
      
      mockFormData.fields?.forEach(field => {
        if (field.type === 'group') {
          initialAnswers[field.id] = {};
          field.groupFields?.forEach(groupField => {
            initialAnswers[field.id][groupField.id] = '';
          });
        } else if (field.type === 'repeatable_group') {
          initialRepeatableAnswers[field.id] = [{}];
          field.groupFields?.forEach(groupField => {
            initialRepeatableAnswers[field.id][0][groupField.id] = '';
          });
        } else {
          initialAnswers[field.id] = '';
        }
      });
      
      // Set initial data in context
      Object.keys(initialAnswers).forEach(fieldId => {
        actions.setAnswer(fieldId, initialAnswers[fieldId]);
      });
      
      Object.keys(initialRepeatableAnswers).forEach(groupId => {
        actions.setRepeatableAnswer(groupId, initialRepeatableAnswers[groupId]);
      });
      
      const allFieldIds = mockFormData.fields?.map(f => f.id) || [];
      actions.setVisibility(allFieldIds, false);
    }
  };

  const fetchResponses = async () => {
    setResponsesLoading(true);
    try {
      const data = await formApi.getFormResponses(id);
      setResponses(data.data || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
      setResponses([]);
    } finally {
      setResponsesLoading(false);
    }
  };

  const handleFieldChange = (fieldId, value) => {
    // Use FormFillerContext action for normal fields
    actions.setAnswer(fieldId, value);

    // Clear error for this field when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  // Handle repeatable group changes
  const handleRepeatableGroupChange = (groupId, instances) => {
    actions.setRepeatableAnswer(groupId, instances);
  };

  // Handle adding repeatable instance
  const handleAddRepeatableInstance = (groupId) => {
    actions.addRepeatableInstance(groupId, {});
  };

  // Handle removing repeatable instance
  const handleRemoveRepeatableInstance = (groupId, instanceIndex) => {
    actions.removeRepeatableInstance(groupId, instanceIndex);
  };

  // Get current sections
  const sections = form ? groupFieldsIntoSections(form.fields) : [];
  const currentSection = sections[currentSectionIndex];
  const totalSections = sections.length;

  // Validate current section
  const validateCurrentSection = () => {
    if (!currentSection) return true;
    
    const newErrors = {};
    let isValid = true;

    currentSection.fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.question} is required`;
        isValid = false;
      }

      // Email validation
      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Please enter a valid email address';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Helper function to find section index by field ID
  const findSectionIndexByFieldId = (fieldId) => {
    return sections.findIndex(section => section.sectionId === fieldId);
  };

  // Helper function to find field by ID in form fields
  const findFieldById = (fieldId) => {
    return form.fields.find(f => f.id === fieldId);
  };

  // Helper function to evaluate a single condition
  const evaluateCondition = (condition, fieldType, formData) => {
    if (!condition.fieldId) return false;
    
    const conditionValue = formData[condition.fieldId];
    const { operator, value } = condition;
    
    // Handle different field types and operators
    switch (operator) {
      case 'equals':
        return conditionValue === value;
      case 'not_equals':
        return conditionValue !== value;
      case 'contains':
        return conditionValue && conditionValue.toString().toLowerCase().includes(value.toString().toLowerCase());
      case 'not_contains':
        return !conditionValue || !conditionValue.toString().toLowerCase().includes(value.toString().toLowerCase());
      case 'greater_than':
        const num1 = parseFloat(conditionValue);
        const num2 = parseFloat(value);
        return !isNaN(num1) && !isNaN(num2) && num1 > num2;
      case 'less_than':
        const num3 = parseFloat(conditionValue);
        const num4 = parseFloat(value);
        return !isNaN(num3) && !isNaN(num4) && num3 < num4;
      case 'is_empty':
        return !conditionValue || conditionValue === '' || (Array.isArray(conditionValue) && conditionValue.length === 0);
      case 'is_not_empty':
        return conditionValue && conditionValue !== '' && (!Array.isArray(conditionValue) || conditionValue.length > 0);
      default:
        return false;
    }
  };

  // Helper function to evaluate multiple conditions with logical operators
  const evaluateConditions = (conditions) => {
    if (!conditions || conditions.length === 0) return false;
    
    const logicalOperator = conditions[0]?.logicalOperator || 'and';
    
    if (logicalOperator === 'or') {
      // OR logic: ANY condition must be true
      return conditions.some(condition => {
        const field = findFieldById(condition.fieldId);
        const fieldType = field?.type || 'text';
        return evaluateCondition(condition, fieldType, formData);
      });
    } else {
      // AND logic: ALL conditions must be true (default)
      return conditions.every(condition => {
        const field = findFieldById(condition.fieldId);
        const fieldType = field?.type || 'text';
        return evaluateCondition(condition, fieldType, formData);
      });
    }
  };

  // Handle Next button with branching logic
  const handleNext = () => {
    if (!validateCurrentSection()) return;

    // 🔧 FIXED: Set flag to indicate this is a Next button action
    isNextActionRef.current = true;

    console.log('🔍 ===== STARTING BRANCHING LOGIC DEBUG =====');
    console.log('📊 INPUT DATA:');
    console.log('  Current Section Index:', currentSectionIndex);
    console.log('  Total Sections:', totalSections);
    console.log('  Current Section Fields:', currentSection.fields);
    console.log('  Form Data:', formData);

    // Get the list of fields for the currentSectionIndex
    const currentSectionFields = currentSection.fields;
    console.log('🔄 ITERATING THROUGH FIELDS:');
    console.log('  Number of fields to check:', currentSectionFields.length);

    // Loop through these fields
    for (let fieldIndex = 0; fieldIndex < currentSectionFields.length; fieldIndex++) {
      const field = currentSectionFields[fieldIndex];
      console.log(`\n🔍 FIELD ${fieldIndex + 1}/${currentSectionFields.length}:`);
      console.log('  Field ID:', field.id);
      console.log('  Field Question:', field.question);
      console.log('  Field Type:', field.type);
      console.log('  Has Conditional Logic:', !!field.conditionalLogic);
      
      // Check if the field has conditionalLogic.enabled === true
      if (field.conditionalLogic && field.conditionalLogic.enabled) {
        console.log('\n🎯 ===== FOUND FIELD WITH CONDITIONAL LOGIC =====');
        console.log('  Field:', field.question);
        console.log('  Field ID:', field.id);
        console.log('  Full Logic Object:', JSON.stringify(field.conditionalLogic, null, 2));
        
        const { conditions, action, jumpToFieldId } = field.conditionalLogic;
        
        console.log('\n📋 LOGIC EVALUATION:');
        console.log('  Number of Conditions:', conditions?.length || 0);
        console.log('  Action Type:', action);
        console.log('  Jump To Field ID:', jumpToFieldId || 'NOT SET');
        
        // Debug: Check each condition
        console.log('\n🔍 CONDITION DETAILS:');
        conditions.forEach((condition, index) => {
          const conditionField = findFieldById(condition.fieldId);
          console.log(`  Condition ${index + 1}:`);
          console.log('    Target Field ID:', condition.fieldId);
          console.log('    Target Field Name:', conditionField?.question || 'FIELD NOT FOUND');
          console.log('    Target Field Type:', conditionField?.type || 'UNKNOWN');
          console.log('    Operator:', condition.operator);
          console.log('    Expected Value:', condition.value);
          console.log('    Current Value:', formData[condition.fieldId]);
          console.log('    Is Value Available:', formData[condition.fieldId] !== undefined);
        });
        
        // Evaluate Conditions
        console.log('\n🧮 EVALUATING CONDITIONS...');
        const logicResult = evaluateConditions(conditions);
        
        console.log('\n📊 LOGIC EVALUATION RESULT:');
        console.log('  Result:', logicResult ? '✅ TRUE' : '❌ FALSE');
        console.log('  Action:', action);
        
        // If Logic Result is TRUE
        if (logicResult) {
          console.log('\n✅ CONDITIONS MET - CHECKING ACTION...');
          
          // Check if action === 'jump_to'
          if (action === 'jump_to' && jumpToFieldId) {
            console.log('\n🎯 ===== JUMP LOGIC ACTIVATED =====');
            console.log('🔥 CRITICAL - Jump To Field ID:', jumpToFieldId);
            
            console.log('\n📋 ENTIRE SECTIONS ARRAY STRUCTURE:');
            sections.forEach((section, index) => {
              console.log(`  Section ${index}:`);
              console.log('    Section ID:', section.sectionId);
              console.log('    Section Question:', section.section?.question || 'NO QUESTION');
              console.log('    Section Type:', section.section?.type || 'NO TYPE');
              console.log('    Number of Fields:', section.fields?.length || 0);
              console.log('    Field IDs:', section.fields?.map(f => f.id) || []);
            });
            
            console.log('\n🔍 FINDING TARGET SECTION...');
            console.log('  Looking for Section ID:', jumpToFieldId);
            
            // Find the target section
            const targetSectionIndex = findSectionIndexByFieldId(jumpToFieldId);
            
            console.log('\n🎯 FINDSECTIONINDEXBYFIELDID RESULT:');
            console.log('  Target Section Index:', targetSectionIndex);
            
            if (targetSectionIndex !== -1) {
              console.log('\n🚀 ===== JUMP SUCCESSFUL =====');
              console.log('  Jumping to section index:', targetSectionIndex);
              console.log('  From section:', currentSectionIndex);
              console.log('  To section:', targetSectionIndex);
              console.log('  Target Section Question:', sections[targetSectionIndex]?.section?.question);
              
              // 🔧 NEW: Add current section to history before jumping
              previousSectionHistory.current.push(currentSectionIndex);
              
              // Set currentSectionIndex to that found index
              setCurrentSectionIndex(targetSectionIndex);
              console.log('✅ Navigation completed - RETURNING');
              console.log('📚 History updated:', previousSectionHistory.current);
              return; // RETURN immediately (Stop the loop)
            } else {
              console.log('\n🚨 ===== TARGET SECTION NOT FOUND =====');
              console.log('⚠️ WARNING: Target section not found for field ID:', jumpToFieldId);
              console.log('🔍 AVAILABLE SECTION IDS:');
              sections.forEach((section, index) => {
                console.log(`  ${index}: ${section.sectionId} (${section.section?.question})`);
              });
              console.log('🔍 POSSIBLE ISSUES:');
              console.log('  1. jumpToFieldId might be a FIELD ID instead of SECTION ID');
              console.log('  2. Section ID mismatch or section not found');
              console.log('  3. findSectionIndexByFieldId logic issue');
            }
          } else {
            console.log('\n❌ ACTION IS NOT JUMP_TO OR jumpToFieldId IS EMPTY');
            console.log('  Action:', action);
            console.log('  JumpToFieldId:', jumpToFieldId);
          }
        } else {
          console.log('\n❌ CONDITIONS NOT MET - CONTINUING TO NEXT FIELD');
        }
      } else {
        console.log('  ❌ No conditional logic or logic not enabled');
      }
    }

    // If no jump logic is triggered, default to setCurrentSectionIndex(prev => prev + 1)
    console.log('\n➡️ ===== NO BRANCHING TRIGGERED - DEFAULT NAVIGATION =====');
    console.log('  Current Section:', currentSectionIndex);
    console.log('  Total Sections:', totalSections);
    
    if (currentSectionIndex < totalSections - 1) {
      const nextIndex = currentSectionIndex + 1;
      console.log('  Moving to next section:', nextIndex);
      console.log('  Next Section Question:', sections[nextIndex]?.section?.question);
      
      // 🔧 NEW: Add current section to history before moving next
      previousSectionHistory.current.push(currentSectionIndex);
      console.log('📚 History updated (Next):', previousSectionHistory.current);
      
      setCurrentSectionIndex(nextIndex);
    } else {
      console.log('  🏁 Already at last section - cannot move forward');
    }
    
    console.log('🔍 ===== ENDING BRANCHING LOGIC DEBUG =====\n');
    
    // 🔧 FIXED: Trigger visibility calculation with Next action flag
    updateVisibility(true); // true = this is a Next button action
    
    // Reset flag after processing
    setTimeout(() => {
      isNextActionRef.current = false;
    }, 100);
  };

  // 🔧 NEW: Intelligent Previous button - goes back to where user came from
  const handlePrevious = () => {
    if (previousSectionHistory.current.length > 0) {
      // Get the last section user came from
      const previousSectionIndex = previousSectionHistory.current.pop();
      console.log('🔙 Going back to previous section:', previousSectionIndex);
      setCurrentSectionIndex(previousSectionIndex);
    }
  };

  // Local visibility calculation (no API calls)
  const updateVisibility = useCallback((isNextAction = false) => {
    const currentAnswers = { ...answers, ...repeatableAnswers };
    const previousAnswers = previousAnswersRef.current;
    
    // Check if answers actually changed
    const answersChanged = JSON.stringify(currentAnswers) !== JSON.stringify(previousAnswers);
    
    if (answersChanged && form && form.fields) {
      console.log('🔄 Answers changed, calculating visibility locally:', { currentAnswers, isNextAction });
      
      // Calculate visibility using local logic engine
      const visibleFieldIds = calculateVisibility(form.fields, currentAnswers, isNextAction);
      
      // Update context with new visibility
      actions.setVisibility(visibleFieldIds);
      
      // Update previous answers
      previousAnswersRef.current = currentAnswers;
    } else {
      console.log('⏭️ Answers unchanged, skipping visibility calculation');
    }
  }, [answers, repeatableAnswers, form, actions.setVisibility]);

  // 🔧 FIXED: Only update visibility on form data changes, not answer changes
  // Answer changes should NOT trigger branching logic - only Next button should
  useEffect(() => {
    // Initialize visibility on form load only
    if (form && form.fields) {
      // 🔧 CRITICAL: Clear any stale data on form load
      console.log('🧹 ===== CLEARING STALE DATA =====');
      console.log('🧹 Clearing answers for fields that no longer exist...');
      
      // Clear answers for fields that no longer exist in form
      const currentFieldIds = new Set(form.fields.map(f => f.id));
      
      // Clean regular answers
      Object.keys(answers).forEach(fieldId => {
        if (!currentFieldIds.has(fieldId)) {
          console.log(`🗑️ Removing stale answer for field: ${fieldId}`);
          setAnswers(prev => {
            const newAnswers = { ...prev };
            delete newAnswers[fieldId];
            return newAnswers;
          });
        }
      });
      
      // Clean repeatable answers
      Object.keys(repeatableAnswers).forEach(fieldId => {
        if (!currentFieldIds.has(fieldId)) {
          console.log(`🗑️ Removing stale repeatable answer for field: ${fieldId}`);
          setRepeatableAnswers(prev => {
            const newAnswers = { ...prev };
            delete newAnswers[fieldId];
            return newAnswers;
          });
        }
      });
      
      console.log('✅ Stale data cleanup completed');
      console.log('🧹 ===== END CLEARING STALE DATA =====\n');
      console.log('🚀 ===== FORM DATA INTEGRITY DEBUG =====');
      console.log('📋 Form ID:', id);
      console.log('📋 Form Title:', form.title);
      console.log('📋 Total Fields:', form.fields.length);
      console.log('📋 Form Fields:', form.fields.map(f => ({ 
        id: f.id, 
        question: f.question, 
        type: f.type,
        required: f.required,
        hasConditionalLogic: !!f.conditionalLogic?.enabled 
      })));
      console.log('📊 Current Answers:', answers);
      console.log('📊 Current Repeatable Answers:', repeatableAnswers);
      console.log('👁️ Current Visible Field IDs:', visibleFieldIds);
      console.log('🔍 ===== END FORM DATA INTEGRITY DEBUG =====\n');
      
      console.log('🚀 Initializing visibility on form load');
      updateVisibility(false); // false = not a Next action
    }
  }, [form, updateVisibility]);

  const validateForm = () => {
    const newErrors = {};

    if (!form || !form.fields) return true;

    // 🔧 FIXED: Only validate fields that are currently visible
    console.log('🔍 Validating form - checking visible fields only');
    console.log('📋 Visible Field IDs:', visibleFieldIds);
    console.log('📋 All Form Fields:', form.fields.map(f => ({ id: f.id, required: f.required, visible: visibleFieldIds.includes(f.id) })));

    form.fields.forEach(field => {
      // 🔧 CRITICAL: Only validate if field is visible
      if (!visibleFieldIds.includes(field.id)) {
        console.log(`⏭️ Skipping validation for hidden field: ${field.question} (${field.id})`);
        return; // Skip validation for hidden fields
      }

      console.log(`✅ Validating visible field: ${field.question} (${field.id})`);

      // Required field validation (only for visible fields)
      if (field.required && !formData[field.id]) {
        console.log(`❌ Required field validation failed: ${field.question}`);
        newErrors[field.id] = `${field.label || field.question} is required`;
      }

      // Email validation (only for visible fields)
      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          console.log(`❌ Email validation failed: ${field.question}`);
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }
    });

    console.log('📊 Validation Results:', { 
      totalErrors: Object.keys(newErrors).length,
      errors: newErrors 
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Find email field for respondentEmail
      const emailField = form.fields.find(field => field.type === 'email');
      const respondentEmail = emailField ? formData[emailField.id] : '';

      // Combine answers and repeatable answers for submission
      const submissionAnswers = [];
      
      // Add normal field answers
      Object.keys(answers).forEach(fieldId => {
        if (visibleFieldIds.includes(fieldId)) { // Only submit visible fields
          submissionAnswers.push({
            fieldId,
            value: answers[fieldId]
          });
        }
      });
      
      // Add repeatable group answers
      Object.keys(repeatableAnswers).forEach(groupId => {
        if (visibleFieldIds.includes(groupId)) { // Only submit visible groups
          submissionAnswers.push({
            fieldId: groupId,
            value: repeatableAnswers[groupId]
          });
        }
      });

      const payload = {
        formId: id,
        respondentEmail: respondentEmail,
        answers: submissionAnswers
      };

      // 🔧 DEBUG: Frontend visibility tracking before submission
      console.log('🔍 ===== FRONTEND SUBMISSION DEBUG =====');
      console.log('📋 Current visibleFieldIds:', visibleFieldIds);
      console.log('📊 Answers being submitted:', answers);
      console.log('📋 Submission Answers (filtered by visibility):', submissionAnswers);
      console.log('📊 Form Data:', formData);
      console.log('🎯 Final Payload:', payload);
      
      // 🔧 CRITICAL: Check for stale/unknown field IDs
      console.log('🔍 ===== STALE DATA DETECTION =====');
      console.log('📋 Submitted Field IDs:', submissionAnswers.map(a => a.fieldId));
      console.log('📋 Form Field IDs:', form.fields.map(f => f.id));
      
      const unknownFieldIds = submissionAnswers
        .map(a => a.fieldId)
        .filter(fieldId => !form.fields.some(f => f.id === fieldId));
      
      if (unknownFieldIds.length > 0) {
        console.log('🚨 STALE DATA DETECTED - Unknown field IDs:', unknownFieldIds);
        console.log('⚠️ This suggests old/deleted fields are still in answers state');
      } else {
        console.log('✅ No unknown field IDs detected - data is fresh');
      }
      console.log('🔍 ===== END STALE DATA DETECTION =====\n');
      
      console.log('🔍 ===== END FRONTEND SUBMISSION DEBUG =====\n');

      await formApi.submitFormResponse(id, payload);

      setSubmitSuccess(true);
      // Reset form after successful submission
      const resetData = {};
      form.fields.forEach(field => {
        if (field.type === 'group') {
          resetData[field.id] = {};
          field.groupFields?.forEach(groupField => {
            resetData[field.id][groupField.id] = '';
          });
        } else if (field.type === 'repeatable_group') {
          resetData[field.id] = [{}];
          field.groupFields?.forEach(groupField => {
            resetData[field.id][0][groupField.id] = '';
          });
        } else {
          resetData[field.id] = '';
        }
      });
      // Reset form state in context
      actions.resetForm();
      Object.keys(resetData).forEach(fieldId => {
        actions.setAnswer(fieldId, resetData[fieldId]);
      });

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to submit form. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    // Skip hidden fields based on visibility
    if (!visibleFieldIds.includes(field.id)) {
      return null;
    }

    const fieldValue = formData[field.id] || '';
    const fieldError = errors[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'short_answer':
        return (
          <TextField
            fullWidth
            label={field.question}
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            error={!!fieldError}
            helperText={fieldError}
            required={field.required}
            placeholder={field.placeholder}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(42, 82, 77, 0.05)',
                borderRadius: 2,
                '&:hover': {
                },
                '&.Mui-focused': {
                  bgcolor: 'rgba(42, 82, 77, 0.1)'
                }
              },
              '& .MuiOutlinedInput-input': {
                color: '#ffffff',
                '&::placeholder': {
                  color: '#a0a0a0'
                }
              },
              '& .MuiInputLabel-root': {
                color: '#000000',
                '&.Mui-focused': {
                  color: '#2A524D'
                }
              },
              '& .MuiFormLabel-root': {
                color: '#000000'
              }
            }}
          />
        );

      case 'email':
        return (
          <TextField
            fullWidth
            type="email"
            label={field.question}
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            error={!!fieldError}
            helperText={fieldError}
            required={field.required}
            placeholder={field.placeholder}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(42, 82, 77, 0.05)',
                borderRadius: 2,
                '&:hover': {
                },
                '&.Mui-focused': {
                  bgcolor: 'rgba(42, 82, 77, 0.1)'
                }
              },
              '& .MuiOutlinedInput-input': {
                color: '#ffffff',
                '&::placeholder': {
                  color: '#a0a0a0'
                }
              },
              '& .MuiInputLabel-root': {
                color: '#000000',
                '&.Mui-focused': {
                  color: '#2A524D'
                }
              },
              '& .MuiFormLabel-root': {
                color: '#000000'
              }
            }}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={field.question}
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            error={!!fieldError}
            helperText={fieldError}
            required={field.required}
            placeholder={field.placeholder}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(42, 82, 77, 0.05)',
                borderRadius: 2,
                '&:hover': {
                },
                '&.Mui-focused': {
                  bgcolor: 'rgba(42, 82, 77, 0.1)'
                }
              },
              '& .MuiOutlinedInput-input': {
                color: '#ffffff',
                '&::placeholder': {
                  color: '#a0a0a0'
                }
              },
              '& .MuiInputLabel-root': {
                color: '#000000',
                '&.Mui-focused': {
                  color: '#2A524D'
                }
              },
              '& .MuiFormLabel-root': {
                color: '#000000'
              }
            }}
          />
        );

      case 'dropdown':
        return (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              sx={{
                color: '#a0a0a0',
                '&.Mui-focused': {
                  color: '#2A524D'
                },
                '&.Mui-error': {
                  color: '#ff6b6b'
                }
              }}
            >
              {field.question} {field.required && <span style={{ color: '#ff6b6b' }}> *</span>}
            </InputLabel>
            <Select
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              error={!!fieldError}
              sx={{
                bgcolor: '#ffffff',
                borderRadius: 2,
                minHeight: '56px',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)'
                },
                '&.Mui-focused': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)'
                },
                '& .MuiSelect-select': {
                  color: '#000000',
                  padding: '16px 14px',
                  minHeight: '56px',
                  fontSize: '16px',
                  '&:focus': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                  }
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid rgba(0, 0, 0, 0.2)'
                },
                '& .MuiSvgIcon-root': {
                  color: '#000000'
                },
                '& .MuiMenu-paper': {
                  bgcolor: '#ffffff',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  color: '#000000'
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    color: '#000000'
                  }
                }
              }}
            >
              {field.options && Array.isArray(field.options) && field.options.map((option, index) => (
                <MenuItem
                  key={index}
                  value={option}
                  sx={{
                    color: '#000000',
                    '&:hover': {
                      bgcolor: 'rgba(42, 82, 77, 0.1)',
                      color: '#2A524D'
                    },
                    '&.Mui-selected': {
                      bgcolor: 'rgba(42, 82, 77, 0.2)',
                      color: '#2A524D',
                      '&:hover': {
                        bgcolor: 'rgba(42, 82, 77, 0.3)'
                      }
                    }
                  }}
                >
                  {option}
                </MenuItem>
              ))}
            </Select>
            {fieldError && (
              <Typography variant="caption" sx={{ color: '#ff6b6b', mt: 1 }}>
                {fieldError}
              </Typography>
            )}
          </FormControl>
        );

      case 'multiple_choice':
        return (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel
              sx={{
                color: '#a0a0a0',
                '&.Mui-focused': {
                  color: '#2A524D'
                },
                '&.Mui-error': {
                  color: '#ff6b6b'
                }
              }}
            >
              {field.question} {field.required && <span style={{ color: '#ff6b6b' }}> *</span>}
            </InputLabel>
            <Select
              multiple
              value={Array.isArray(fieldValue) ? fieldValue : []}
              onChange={(e) => {
                const value = e.target.value;
                handleFieldChange(field.id, typeof value === 'string' ? value.split(',') : value);
              }}
              error={!!fieldError}
              sx={{
                bgcolor: '#ffffff',
                borderRadius: 2,
                minHeight: '56px',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)'
                },
                '&.Mui-focused': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)'
                },
                '& .MuiSelect-select': {
                  color: '#000000',
                  padding: '16px 14px',
                  minHeight: '56px',
                  fontSize: '16px',
                  '&:focus': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                  }
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: '1px solid rgba(0, 0, 0, 0.2)'
                },
                '& .MuiSvgIcon-root': {
                  color: '#000000'
                },
                '& .MuiMenu-paper': {
                  bgcolor: '#ffffff',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                  color: '#000000'
                }
              }}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <Typography sx={{ color: '#a0a0a0' }}>Select options...</Typography>;
                }
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        sx={{
                          bgcolor: 'rgba(42, 82, 77, 0.2)',
                          color: '#ffffff',
                          border: '1px solid rgba(42, 82, 77, 0.4)',
                          '& .MuiChip-deleteIcon': {
                            color: '#ffffff',
                            '&:hover': {
                              color: '#ff6b6b'
                            }
                          }
                        }}
                      />
                    ))}
                  </Box>
                );
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    color: '#000000'
                  }
                }
              }}
            >
              {field.options && Array.isArray(field.options) && field.options.map((option, index) => (
                <MenuItem
                  key={index}
                  value={option}
                  sx={{
                    color: '#000000',
                    '&:hover': {
                      bgcolor: 'rgba(42, 82, 77, 0.1)',
                      color: '#2A524D'
                    },
                    '&.Mui-selected': {
                      bgcolor: 'rgba(42, 82, 77, 0.2)',
                      color: '#2A524D',
                      '&:hover': {
                        bgcolor: 'rgba(42, 82, 77, 0.3)'
                      }
                    }
                  }}
                >
                  <Checkbox
                    checked={Array.isArray(fieldValue) && fieldValue.includes(option)}
                    sx={{
                      color: '#2A524D',
                      '&.Mui-checked': {
                        color: '#2A524D'
                      },
                      mr: 1
                    }}
                  />
                  {option}
                </MenuItem>
              ))}
            </Select>
            {fieldError && (
              <Typography variant="caption" sx={{ color: '#ff6b6b', mt: 1 }}>
                {fieldError}
              </Typography>
            )}
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <Typography component="legend" sx={{
              color: '#ffffff',
              mb: 2,
              fontWeight: 'medium'
            }}>
              {field.question} {field.required && <span style={{ color: '#ff6b6b' }}> *</span>}
            </Typography>
            <RadioGroup
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              sx={{ color: '#ffffff' }}
            >
              {field.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio sx={{ color: '#2A524D' }} />}
                  label={<Typography sx={{ color: '#ffffff' }}>{option}</Typography>}
                  sx={{
                    color: '#000000',
                    '&:hover': {
                      bgcolor: 'rgba(42, 82, 77, 0.1)'
                    }
                  }}
                />
              ))}
            </RadioGroup>
            {fieldError && (
              <Typography variant="caption" sx={{ color: '#ff6b6b', mt: 1 }}>
                {fieldError}
              </Typography>
            )}
          </FormControl>
        );

      case 'checkbox':
      case 'checkboxes':
        return (
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <Typography component="legend" sx={{
              color: '#ffffff',
              mb: 2,
              fontWeight: 'medium'
            }}>
              {field.question} {field.required && <span style={{ color: '#ff6b6b' }}> *</span>}
            </Typography>
            <FormGroup>
              {field.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={Array.isArray(fieldValue) && fieldValue.includes(option)}
                      onChange={(e) => {
                        const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
                        if (e.target.checked) {
                          handleFieldChange(field.id, [...currentValues, option]);
                        } else {
                          handleFieldChange(field.id, currentValues.filter(val => val !== option));
                        }
                      }}
                      sx={{
                        color: '#2A524D',
                        '&.Mui-checked': {
                          color: '#2A524D'
                        }
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#ffffff' }}>{option}</Typography>}
                  sx={{
                    color: '#000000',
                    '&:hover': {
                      bgcolor: 'rgba(42, 82, 77, 0.1)'
                    }
                  }}
                />
              ))}
            </FormGroup>
            {fieldError && (
              <Typography variant="caption" sx={{ color: '#ff6b6b', mt: 1 }}>
                {fieldError}
              </Typography>
            )}
          </FormControl>
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={field.question}
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            error={!!fieldError}
            helperText={fieldError}
            required={field.required}
            placeholder={field.placeholder}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(42, 82, 77, 0.05)',
                borderRadius: 2,
                '&:hover': {
                },
                '&.Mui-focused': {
                  bgcolor: 'rgba(42, 82, 77, 0.1)'
                }
              },
              '& .MuiOutlinedInput-input': {
                color: '#ffffff',
                '&::placeholder': {
                  color: '#a0a0a0'
                }
              },
              '& .MuiInputLabel-root': {
                color: '#000000',
                '&.Mui-focused': {
                  color: '#2A524D'
                }
              },
              '& .MuiFormLabel-root': {
                color: '#000000'
              }
            }}
          />
        );

      case 'group':
        return (
          <GroupFieldRenderer
            field={field}
            value={fieldValue}
            onChange={handleFieldChange}
            error={fieldError}
          />
        );

      case 'repeatable_group':
        return (
          <RepeatableGroupFieldRenderer
            field={field}
            value={repeatableAnswers[field.id] || [{}]}
            onChange={handleRepeatableGroupChange}
            onAddInstance={handleAddRepeatableInstance}
            onRemoveInstance={handleRemoveRepeatableInstance}
            error={fieldError}
          />
        );

      default:
        return null;
    }
  };

  if (contextLoading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#0a0a0a',
        color: '#ffffff'
      }}>
        <CircularProgress sx={{ color: '#2A524D' }} />
        <Typography sx={{ ml: 2 }}>Loading form...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      // bgcolor: '#0a0a0a',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      {/* Header Section */}
      <Box sx={{
        // bgcolor: '#0a0a0a',
        borderBottom: '1px solid rgba(42, 82, 77, 0.2)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
      }}>
        <Container maxWidth="md">
          <Box className="form-submit-header">
            <Box className="form-submit-header-content">
              {finalPreviewMode &&
                <IconButton
                  onClick={() => navigate('/dashboard')}
                  className="form-submit-back-btn"
                >
                  <ArrowBackIcon />
                </IconButton>
              }
              <Typography variant="h5" className={`form-submit-title dark-mode`}>
                Access Form
              </Typography>
            </Box>
          </Box>
            {/* <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
              Access Form
            </Typography> */}
        </Container>
      </Box>

      <Container maxWidth="md" className="form-submit-container">
        {/* Preview Mode Banner */}
        {finalPreviewMode && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              bgcolor: 'rgba(255, 152, 0, 0.1)',
              color: '#000000',
              border: '1px solid rgba(255, 152, 0, 0.3)'
            }}
          >
            Preview Mode - Responses will not be saved
          </Alert>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              bgcolor: 'rgba(42, 82, 77, 0.1)',
              color: '#000000',
              border: '1px solid rgba(42, 82, 77, 0.3)'
            }}
          >
            Form submitted successfully! Thank you for your response.
          </Alert>
        )}

        {/* Error Message */}
        {errors.submit && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              bgcolor: 'rgba(255, 107, 107, 0.1)',
              color: '#000000',
              border: '1px solid rgba(255, 107, 107, 0.3)'
            }}
          >
            {errors.submit}
          </Alert>
        )}

        {/* Form Content */}
        {form && (
          <Paper sx={{
            bgcolor: '#0a0a0a',
            border: '1px solid rgba(42, 82, 77, 0.2)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            p: 4
          }}>
            {/* Form Description */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 'bold' }}>
                {form.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 3 }}>
                {form.description}
              </Typography>
              <Divider sx={{ bgcolor: 'rgba(42, 82, 77, 0.2)' }} />
            </Box>

            {/* Form Fields - Current Section Only */}
            <Box component="form" onSubmit={handleSubmit} role="form" aria-label="Form submission">
              {/* Progress Indicator */}
              {totalSections > 1 && (
                <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#666',
                      textAlign: 'center',
                      mb: 2
                    }}
                  >
                    Section {currentSectionIndex + 1} of {totalSections}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: 1,
                    mb: 3
                  }}>
                    {sections.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: index === currentSectionIndex ? '#2A524D' : 'rgba(42, 82, 77, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Section Header */}
              {currentSection?.section && (
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: '#2A524D',
                      fontWeight: 'bold',
                      mb: 2
                    }}
                  >
                    {currentSection.section.question}
                  </Typography>
                  <Divider sx={{ bgcolor: 'rgba(42, 82, 77, 0.2)' }} />
                </Box>
              )}

              {/* Current Section Fields */}
              {currentSection?.fields?.map((field) => (
                <Box key={field.id} sx={{ mb: 3 }} role="group" aria-label={`${field.type} field: ${field.question}`}>
                  {renderField(field)}
                </Box>
              ))}

              {/* Navigation Buttons - Intelligent Previous + Next/Submit */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, gap: 2 }}>
                {/* Previous Button (if has history) */}
                {previousSectionHistory.current.length > 0 && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handlePrevious}
                    sx={{
                      borderColor: '#2A524D',
                      color: '#2A524D',
                      px: 4,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#1e4037',
                        bgcolor: 'rgba(42, 82, 77, 0.05)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Previous
                  </Button>
                )}

                {/* Spacer */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Next Button (if not last section) */}
                {currentSectionIndex < totalSections - 1 && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleNext}
                    sx={{
                      bgcolor: '#2A524D',
                      color: '#ffffff',
                      px: 6,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: '#1e4037',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Next
                  </Button>
                )}

                {/* Submit Button (if last section) */}
                {currentSectionIndex === totalSections - 1 && (
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting || finalPreviewMode}
                    onClick={finalPreviewMode ? (e) => {
                      e.preventDefault();
                      setSnackbar({ open: true, message: 'This is a preview mode', severity: 'warning' });
                    } : undefined}
                    startIcon={submitting ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : <SendIcon />}
                    sx={{
                      bgcolor: finalPreviewMode ? 'rgba(42, 82, 77, 0.5)' : '#2A524D',
                      color: '#ffffff',
                      px: 6,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      borderRadius: 2,
                      opacity: finalPreviewMode ? 0.5 : 1,
                      cursor: finalPreviewMode ? 'not-allowed' : 'pointer',
                      '&:hover': {
                        bgcolor: finalPreviewMode ? 'rgba(42, 82, 77, 0.5)' : '#1e4037',
                        transform: finalPreviewMode ? 'none' : 'translateY(-2px)'
                      },
                      '&:disabled': {
                        bgcolor: 'rgba(42, 82, 77, 0.3)',
                      }
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Form'}
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Container>

      {/* Responses Dialog */}
      <Dialog
        open={responsesDialogOpen}
        onClose={() => setResponsesDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0a0a0a',
            border: '1px solid rgba(42, 82, 77, 0.2)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', borderBottom: '1px solid rgba(42, 82, 77, 0.2)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
              Form Responses Analysis 
            </Typography>
            <IconButton onClick={() => setResponsesDialogOpen(false)} sx={{ color: '#a0a0a0' }}>
              <ArrowBackIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0a0a0a', color: '#ffffff' }}>
          {responsesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#2A524D' }} />
              <Typography sx={{ ml: 2, color: '#ffffff' }}>Loading responses...</Typography>
            </Box>
          ) : responses.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>No responses yet</Typography>
              <Typography variant="body2" sx={{ color: '#a0a0a0', mt: 2 }}>
                Be the first to respond to this form!
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Summary Stats */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 3, fontWeight: 'bold' }}>
                  Response Summary 
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'rgba(42, 82, 77, 0.1)', p: 2, borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <AssessmentIcon sx={{ color: '#2A524D', fontSize: 32 }} />
                          <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                            {responses.length}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                          Total Responses
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'rgba(42, 82, 77, 0.1)', p: 2, borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <BarChartIcon sx={{ color: '#2A524D', fontSize: 32 }} />
                          <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                            {form?.fields?.length || 0}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                          Total Questions
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Responses List */}
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 3, fontWeight: 'bold' }}>
                Individual Responses 
              </Typography>
              <List sx={{ bgcolor: 'rgba(42, 82, 77, 0.05)', borderRadius: 2, maxHeight: 400, overflow: 'auto' }}>
                {responses.map((response) => (
                  <ListItem key={response.id} sx={{
                    bgcolor: 'rgba(42, 82, 77, 0.05)',
                    mb: 1,
                    borderRadius: 2,
                    border: '1px solid rgba(42, 82, 77, 0.2)',
                    '&:hover': { bgcolor: 'rgba(42, 82, 77, 0.1)' }
                  }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#2A524D' }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 'medium' }}>
                          {response.respondentName}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                            {response.respondentEmail}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#a0a0a0' }}>
                            {response.submitted}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={response.status}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(42, 82, 77, 0.2)',
                        color: '#2A524D',
                        border: '1px solid #2A524D'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Main Submit component with FormFillerProvider wrapper
const Submit = ({ isPreview = false }) => (
  <FormFillerProvider>
    <SubmitContent isPreview={isPreview} />
  </FormFillerProvider>
);

export default Submit;
