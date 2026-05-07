import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Grid,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const ConditionalLogicEditor = ({ 
  field, 
  allFields, 
  onChange, 
  open, 
  onClose 
}) => {
  // Use existing logic or default
  const [localLogic, setLocalLogic] = useState(() => {
    // Deep merge with default values to handle incomplete saved data
    const savedLogic = field.conditionalLogic || {};
    return {
      enabled: savedLogic.enabled || false,
      conditions: Array.isArray(savedLogic.conditions) ? savedLogic.conditions : [],
      action: savedLogic.action || 'show',
      logicalOperator: savedLogic.logicalOperator || 'and',
      jumpToFieldId: savedLogic.jumpToFieldId || '',
      endFormMessage: savedLogic.endFormMessage || ''
    };
  });

  const [validationErrors, setValidationErrors] = useState([]);

  // Sync localLogic with prop changes (e.g., when loading data or switching fields)
  useEffect(() => {
    const savedLogic = field.conditionalLogic || {};
    setLocalLogic({
      enabled: savedLogic.enabled || false,
      conditions: Array.isArray(savedLogic.conditions) ? savedLogic.conditions : [],
      action: savedLogic.action || 'show',
      logicalOperator: savedLogic.logicalOperator || 'and',
      jumpToFieldId: savedLogic.jumpToFieldId || '',
      endFormMessage: savedLogic.endFormMessage || ''
    });
    // Clear validation errors when switching fields
    setValidationErrors([]);
  }, [field.id, field.conditionalLogic]);

  // 1. FIXED: Optimized Handler (Uses index directly)
  const handleConditionChange = (index, property, value) => {
    const newConditions = [...localLogic.conditions];
    newConditions[index] = {
      ...newConditions[index],
      [property]: value
    };
    setLocalLogic(prev => ({
      ...prev,
      conditions: newConditions
    }));
    // Clear validation errors when user makes changes
    setValidationErrors([]);
  };

  console.log(field, 'RImshhshh')

  const handleSave = () => {
    console.log('🔍 ConditionalLogicEditor - handleSave called');
    console.log('📋 Field being edited:', field);
    console.log('📋 Field ID:', field.id || field.fieldId);
    console.log('📋 Local Logic being saved:', localLogic);
    
    // Validation: Only validate if conditional logic is enabled
    if (localLogic.enabled) {
      const validationErrors = [];

      // Validate conditions
      if (localLogic.conditions.length === 0) {
        validationErrors.push('Please add at least one condition');
      } else {
        // Validate each condition
        localLogic.conditions.forEach((condition, index) => {
          if (!condition.fieldId || condition.fieldId.trim() === '') {
            validationErrors.push(`Condition ${index + 1}: Please select a field for the condition`);
          } else if (!isFieldIdValid(condition.fieldId, getFieldsForCondition())) {
            validationErrors.push(`Condition ${index + 1}: Selected field is no longer available. Please choose a valid field.`);
          }
          if (!condition.operator) {
            validationErrors.push(`Condition ${index + 1}: Please select an operator`);
          }
        });
      }

      // Validate action
      if (localLogic.action === 'jump_to') {
        if (!localLogic.jumpToFieldId || localLogic.jumpToFieldId.trim() === '') {
          validationErrors.push('Please select a section to jump to');
        } else if (!isFieldIdValid(localLogic.jumpToFieldId, getSectionsForJump())) {
          validationErrors.push('Selected section is no longer available. Please choose a valid section.');
        }
      }

      // If validation errors exist, show alert and prevent save
      if (validationErrors.length > 0) {
        // Store validation errors in state for display
        setValidationErrors(validationErrors);
        return; // Do not call onChange or onClose
      }
    }

    // Clear any validation errors before save
    setValidationErrors([]);

    // If validation passes, save and close
    console.log('🔍 ConditionalLogicEditor - Saving logic');
    console.log('📋 Field ID for update:', field.id || field.fieldId);
    console.log('📋 Property being updated: conditionalLogic');
    console.log('📋 Value being saved:', localLogic);
    
    onChange(field.id || field.fieldId, 'conditionalLogic', localLogic);
    onClose();
  };

  // 2. FIXED: Removed 'logicalOperator' from single condition object
  const handleAddCondition = () => {
    const newCondition = {
      fieldId: '',
      operator: 'equals',
      value: ''
      // Note: logicalOperator is removed from here, it belongs to the main group, not the row
    };
    setLocalLogic(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const handleDeleteCondition = (index) => {
    const newConditions = localLogic.conditions.filter((_, idx) => idx !== index);
    setLocalLogic(prev => ({
      ...prev,
      conditions: newConditions
    }));
  };

  const getFieldsForCondition = () => {
    console.log('🔍 getFieldsForCondition called');
    console.log('📋 Current field being edited:', field);
    console.log('📋 Current field ID:', field.id || field.fieldId);
    console.log('📋 Current field type:', field.type);
    console.log('📋 All available fields:', allFields.map(f => ({ id: f.id, type: f.type, question: f.question })));
    
    // 🔧 FIXED: Allow Self-Reference for Choice-Based Fields
    // Rule: Show ONLY choice-based fields (multiple_choice, dropdown, checkboxes)
    // Rule: EXCLUDE all Sections (type === 'section')
    // Rule: EXCLUDE groups and repeatable groups
    // Rule: ALLOW current field if it's choice-based (self-reference support)
    // Rule: EXCLUDE non-choice fields (short_answer, paragraph, date, time, file_upload, rating)
    const filteredFields = allFields.filter(f => {
      const isCurrentField = f.id === (field.id || field.fieldId);
      const isSection = f.type === 'section';
      const isGroup = f.type === 'group';
      const isRepeatableGroup = f.type === 'repeatable_group';
      const isChoiceBased = f.type === 'multiple_choice' || f.type === 'dropdown' || f.type === 'checkboxes';
      
      // 🔧 CRITICAL FIX: Allow current field if it's choice-based (self-reference)
      const shouldInclude = !isSection && !isGroup && !isRepeatableGroup && isChoiceBased;
      
      console.log(`🔍 Field ${f.id}:`, {
        type: f.type,
        question: f.question,
        isCurrentField,
        isSection,
        isGroup,
        isRepeatableGroup,
        isChoiceBased,
        shouldInclude
      });
      
      return shouldInclude;
    });
    
    console.log('📋 Final filtered fields:', filteredFields.map(f => ({ id: f.id, type: f.type, question: f.question })));
    return filteredFields;
  };

  const getSectionsForJump = () => {
    // Google Forms Style: Actions jump to PAGES (navigation)
    // Rule: Show ONLY Sections (page-like navigation)
    // Rule: EXCLUDE all standard input Fields
    // Rule: EXCLUDE current section where user is editing (prevent jumping to same place)
    return allFields.filter(f => 
      f.id !== (field.id || field.fieldId) && 
      f.type === 'section'  // Only show sections
    );
  };

  // Helper function to get display label for fields/sections
  const getFieldDisplayLabel = (f) => {
    if (f.question && f.question.trim() !== '') {
      return f.question;
    }
    
    // Fallback for empty questions - show field type for identification
    const fieldType = f.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return f.type === 'section' ? `Untitled Section` : `Untitled ${fieldType}`;
  };

  // Helper function to check if field ID exists in available options
  const isFieldIdValid = (fieldId, availableFields) => {
    return availableFields.some(f => f.id === fieldId);
  };

  // Helper function to get field info by ID
  const getFieldById = (fieldId) => {
    return allFields.find(f => f.id === fieldId);
  };

  // UX Validation: Check if there are enough fields for branching logic
  const hasEnoughFieldsForBranching = () => {
    // Need at least 2 fields total for branching logic to make sense
    return allFields.length >= 2;
  };

  
  const getOperatorOptions = (fieldType) => {
    const commonOperators = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not equals' },
      { value: 'is_empty', label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' }
    ];

    const textOperators = [
      ...commonOperators,
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does not contain' }
    ];

    const numberOperators = [
      ...commonOperators,
      { value: 'greater_than', label: 'Greater than' },
      { value: 'less_than', label: 'Less than' }
    ];

    switch (fieldType) {
      case 'email':
      case 'short_answer':
      case 'paragraph':
      case 'phone':
        return textOperators;
      case 'number':
      case 'rating':
        return numberOperators;
      case 'dropdown':
      case 'multiple_choice':
      case 'radio':
        return commonOperators;
      case 'checkboxes':
        return [
          ...commonOperators,
          { value: 'contains', label: 'Contains' },
          { value: 'not_contains', label: 'Does not contain' }
        ];
      default:
        return commonOperators;
    }
  };

  const renderConditionValue = (condition, sourceField) => {
    if (!sourceField) return null;

    switch (sourceField.type) {
      case 'dropdown':
      case 'multiple_choice':
      case 'radio':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>Value</InputLabel>
            <Select
              value={condition.value || ''}
              onChange={(e) => handleConditionChange(localLogic.conditions.indexOf(condition), 'value', e.target.value)}
              label="Value"
            >
              {(sourceField.options || []).map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'checkboxes':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>Value</InputLabel>
            <Select
              value={condition.value || ''}
              onChange={(e) => handleConditionChange(localLogic.conditions.indexOf(condition), 'value', e.target.value)}
              label="Value"
            >
              {(sourceField.options || []).map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'number':
      case 'rating':
        return (
          <TextField
            fullWidth
            type="number"
            size="small"
            label="Value"
            value={condition.value || ''}
            onChange={(e) => handleConditionChange(localLogic.conditions.indexOf(condition), 'value', e.target.value)}
          />
        );
      
      default:
        return (
          <TextField
            fullWidth
            size="small"
            label="Value"
            value={condition.value || ''}
            onChange={(e) => handleConditionChange(localLogic.conditions.indexOf(condition), 'value', e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Conditional Logic</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={localLogic.enabled}
              onChange={(e) => {
                setLocalLogic(prev => ({ ...prev, enabled: e.target.checked }));
                // Clear validation errors when toggling
                setValidationErrors([]);
              }}
              disabled={!hasEnoughFieldsForBranching()}
            />
          }
          label="Enable conditional logic"
        />

        {!hasEnoughFieldsForBranching() && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
               You need at least 2 fields in your form to set up conditional logic. 
              Add Dropdown, Multiple Choice, or Checkbox questions first, then set up conditions that check their answers and jump to sections.
            </Typography>
          </Alert>
        )}

        {localLogic.enabled && hasEnoughFieldsForBranching() && (
          <Box sx={{ mt: 3 }}>
            {/* Conditions Section */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Conditions
            </Typography>
            
            {localLogic.conditions.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                {getFieldsForCondition().length === 0 ? (
                  <Typography variant="body2">
                    <strong>No choice fields available for conditions:</strong> Add Dropdown, Multiple Choice, or Checkbox questions first, then you can set up branching logic based on their answers.
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    No conditions added yet. Add a condition to get started.
                  </Typography>
                )}
              </Alert>
            ) : (
              localLogic.conditions.map((condition, index) => {
                // 3. FIXED: Used 'index' directly instead of 'indexOf'
                const sourceField = allFields.find(f => f.id === condition.fieldId);
                const operatorOptions = sourceField ? getOperatorOptions(sourceField.type) : [];
                console.log(condition, 'Hahahahahahahahh')
                return (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Field</InputLabel>
                            <Select
                              value={condition.fieldId || ''}
                              onChange={(e) => handleConditionChange(index, 'fieldId', e.target.value)}
                              label="Field"
                            >
                              {(() => {
                                const availableFields = getFieldsForCondition();
                                const currentFieldId = condition.fieldId;
                                const isCurrentValid = isFieldIdValid(currentFieldId, availableFields);
                                
                                return availableFields.length === 0 && !isCurrentValid ? (
                                  <MenuItem disabled value="">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                                        Branching only works with Dropdown, Multiple Choice, or Checkbox questions.
                                      </Typography>
                                    </Box>
                                  </MenuItem>
                                ) : (
                                  [
                                    // Show invalid field warning if current field ID is not available
                                    !isCurrentValid && currentFieldId && (
                                      <MenuItem key="invalid" disabled value={currentFieldId}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Typography variant="body2" sx={{ color: '#ff9800' }}>
                                            ⚠️
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: '#ff9800', fontStyle: 'italic' }}>
                                            [Invalid Field - ID: {currentFieldId}]
                                          </Typography>
                                        </Box>
                                      </MenuItem>
                                    ),
                                    // Show available fields
                                    ...availableFields.map(f => (
                                      <MenuItem key={f.id} value={f.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Typography variant="body2" sx={{ color: '#666' }}>
                                            📝
                                          </Typography>
                                          <Typography variant="body2">
                                            {getFieldDisplayLabel(f)}
                                          </Typography>
                                        </Box>
                                      </MenuItem>
                                    ))
                                  ]
                                );
                              })()}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Operator</InputLabel>
                            <Select
                              // FIXED: Passed 'index' here
                              value={condition.operator || 'equals'}
                              onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                              label="Operator"
                            >
                              {operatorOptions.map(op => (
                                <MenuItem key={op.value} value={op.value}>
                                  {op.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          {renderConditionValue(condition, sourceField)}
                        </Grid>
                        
                        <Grid item xs={12} sm={2}>
                          <IconButton
                            // FIXED: Passed 'index' here
                            onClick={() => handleDeleteCondition(index)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                );
              })
            )}
            
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddCondition}
              variant="outlined"
              disabled={getFieldsForCondition().length === 0}
              sx={{ mt: 1 }}
            >
              Add Condition
            </Button>

            {localLogic.conditions.length > 1 && (
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Logical Operator</InputLabel>
                  <Select
                    value={localLogic.logicalOperator}
                    onChange={(e) => setLocalLogic(prev => ({ ...prev, logicalOperator: e.target.value }))}
                    label="Logical Operator"
                  >
                    <MenuItem value="and">AND (All conditions must be true)</MenuItem>
                    <MenuItem value="or">OR (Any condition can be true)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Action Section */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Action
            </Typography>
            
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={localLogic.action}
                onChange={(e) => setLocalLogic(prev => ({ ...prev, action: e.target.value }))}
                label="Action"
              >
                <MenuItem value="show">Show this field</MenuItem>
                <MenuItem value="hide">Hide this field</MenuItem>
                <MenuItem value="jump_to">Jump to section</MenuItem>
                <MenuItem value="end_form">End form</MenuItem>
              </Select>
            </FormControl>

            {localLogic.action === 'jump_to' && (
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Jump to section</InputLabel>
                <Select
                  value={localLogic.jumpToFieldId}
                  onChange={(e) => setLocalLogic(prev => ({ ...prev, jumpToFieldId: e.target.value }))}
                  label="Jump to section"
                >
                  {(() => {
                    const availableSections = getSectionsForJump();
                    const currentJumpToId = localLogic.jumpToFieldId;
                    const isCurrentValid = isFieldIdValid(currentJumpToId, availableSections);
                    
                    return availableSections.length === 0 && !isCurrentValid ? (
                      <MenuItem disabled value="">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                            No sections available to jump to
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>
                            (Create sections first)
                          </Typography>
                        </Box>
                      </MenuItem>
                    ) : (
                      [
                        // Show invalid section warning if current jumpTo ID is not available
                        !isCurrentValid && currentJumpToId && (
                          <MenuItem key="invalid" disabled value={currentJumpToId}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ color: '#ff9800' }}>
                                ⚠️
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#ff9800', fontStyle: 'italic' }}>
                                [Invalid Section - ID: {currentJumpToId}]
                              </Typography>
                            </Box>
                          </MenuItem>
                        ),
                        // Show available sections
                        ...availableSections.map(f => (
                          <MenuItem key={f.id} value={f.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666' }}>
                                📁
                              </Typography>
                              <Typography variant="body2">
                                {getFieldDisplayLabel(f)}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))
                      ]
                    );
                  })()}
                </Select>
              </FormControl>
            )}

            {localLogic.action === 'end_form' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="End form message"
                value={localLogic.endFormMessage}
                onChange={(e) => setLocalLogic(prev => ({ ...prev, endFormMessage: e.target.value }))}
                placeholder="Message to show when form ends"
                sx={{ mb: 2 }}
              />
            )}
          </Box>
        )}
      </DialogContent>
      
      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Please fix the following errors:</strong>
          </Typography>
          {validationErrors.map((error, index) => (
            <Typography key={index} variant="body2" sx={{ mt: 0.5 }}>
              • {error}
            </Typography>
          ))}
        </Alert>
      )}
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!localLogic.enabled}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConditionalLogicEditor;