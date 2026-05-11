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
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const ConditionalLogicEditor = ({ 
  field, 
  allFields, 
  onChange, 
  open, 
  onClose 
}) => {
  const [localLogic, setLocalLogic] = useState(() => {
    const savedLogic = field.conditionalLogic || {};
    return {
      enabled: savedLogic.enabled || false,
      conditions: Array.isArray(savedLogic.conditions) ? savedLogic.conditions : [],
      action: savedLogic.action || 'jump_to',
      logicalOperator: savedLogic.logicalOperator || 'and',
      jumpToFieldId: savedLogic.jumpToFieldId || '',
      endFormMessage: savedLogic.endFormMessage || ''
    };
  });

  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    const savedLogic = field.conditionalLogic || {};
    setLocalLogic({
      enabled: savedLogic.enabled || false,
      conditions: Array.isArray(savedLogic.conditions) ? savedLogic.conditions : [],
      action: savedLogic.action || 'jump_to',
      logicalOperator: savedLogic.logicalOperator || 'and',
      jumpToFieldId: savedLogic.jumpToFieldId || '',
      endFormMessage: savedLogic.endFormMessage || ''
    });
    setValidationErrors([]);
  }, [field.id, field.conditionalLogic]);

  const handleConditionChange = (index, property, value) => {
    const newConditions = [...localLogic.conditions];
    newConditions[index] = { ...newConditions[index], [property]: value };
    
    if (property === 'fieldId') {
      newConditions[index].value = ''; // Reset value when field changes
    }

    setLocalLogic(prev => ({ ...prev, conditions: newConditions }));
    setValidationErrors([]);
  };

  const handleSave = () => {
    if (localLogic.enabled) {
      const validationErrors = [];

      if (localLogic.conditions.length === 0) {
        validationErrors.push('Please add at least one condition');
      } else {
        localLogic.conditions.forEach((condition, index) => {
          if (!condition.fieldId) validationErrors.push(`Condition ${index + 1}: Please select a field`);
          if (!condition.operator) validationErrors.push(`Condition ${index + 1}: Please select an operator`);
          
          // Value is mandatory for Multiple Choice fields
          if (!condition.value) {
            validationErrors.push(`Condition ${index + 1}: Please select an option`);
          }
        });
      }

      if (localLogic.action === 'jump_to') {
        if (!localLogic.jumpToFieldId) validationErrors.push('Please select a section to jump to');
      }

      if (validationErrors.length > 0) {
        setValidationErrors(validationErrors);
        return;
      }
    }

    setValidationErrors([]);
    onChange(field.id || field.fieldId, 'conditionalLogic', localLogic);
    onClose();
  };

  const handleAddCondition = () => {
    setLocalLogic(prev => ({
      ...prev,
      conditions: [...prev.conditions, { fieldId: '', operator: 'equals', value: '' }]
    }));
  };

  const handleDeleteCondition = (index) => {
    setLocalLogic(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, idx) => idx !== index)
    }));
  };

  const isFieldIdValid = (fieldId, availableFields) => {
    return availableFields.some(f => f.id === fieldId);
  };

  // 🔧 STRICT CHOICE FIELDS ONLY
  const getFieldsForCondition = () => {
    return allFields.filter(f => {
      const isSection = f.type === 'section';
      const isGroup = f.type === 'group' || f.type === 'repeatable_group';
      // STRICT: Only allow Multiple Choice types
      const isChoiceBased = ['multiple_choice', 'dropdown', 'checkboxes', 'radio'].includes(f.type);
      return !isSection && !isGroup && isChoiceBased;
    });
  };

  const getSectionsForJump = () => {
    // 1. Determine the Parent Section ID (The section containing the current field)
    let parentSectionId = null;

    const currentFieldId = field.id || field.fieldId;
    const currentIndex = allFields.findIndex(f => f.id === currentFieldId);

    if (currentIndex !== -1) {
      // Agar current field khud hi ek section hai
      if (field.type === 'section') {
        parentSectionId = field.id;
      } else {
        // Agar field kisi section ke andar hai, to peeche check karein
        // Loop backwards from the current field to find the nearest section
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (allFields[i].type === 'section') {
            parentSectionId = allFields[i].id;
            break; // Stop at the nearest section
          }
        }
      }
    }

    // 2. Filter sections
    return allFields.filter(f => {
      // Sirf sections show karein
      if (f.type !== 'section') return false;

      // 🔧 CRITICAL FIX: Self Section (Parent Section) ko hide karein
      if (f.id === parentSectionId) return false;

      return true;
    });
  };

  const getFieldDisplayLabel = (f) => {
    return f.question || f.type || 'Untitled';
  };

  // 🔧 OPERATORS FOR CHOICE FIELDS ONLY
  const getOperatorOptions = (fieldType) => {
    // Since we only allow Choice fields, these operators are standard
    return [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not equals' }
    ];
  };

  // 🔧 RENDER DROPDOWN VALUE ONLY
  const renderConditionValue = (condition, sourceField) => {
    if (!sourceField) return null;

    // Since all source fields are now Choice fields, we always render a Select
    return (
      <FormControl fullWidth size="small">
        <InputLabel>Select Option</InputLabel>
        <Select
          value={condition.value || ''}
          onChange={(e) => handleConditionChange(localLogic.conditions.indexOf(condition), 'value', e.target.value)}
          label="Select Option"
        >
          {(sourceField.options || []).map((option, idx) => (
            <MenuItem key={idx} value={option}>{option}</MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  const hasEnoughFieldsForBranching = () => {
    // Need at least 1 choice field to set up logic
    return getFieldsForCondition().length >= 1;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Conditional Logic</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <FormControlLabel
          control={
            <Switch
              checked={localLogic.enabled}
              onChange={(e) => setLocalLogic(prev => ({ ...prev, enabled: e.target.checked }))}
              disabled={!hasEnoughFieldsForBranching()}
            />
          }
          label="Enable conditional logic"
        />

        {!hasEnoughFieldsForBranching() && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              You need at least one <strong>Multiple Choice, Dropdown, Radio, or Checkbox</strong> field to set up conditional logic.
            </Typography>
          </Alert>
        )}

        {localLogic.enabled && hasEnoughFieldsForBranching() && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Conditions</Typography>
            
            {localLogic.conditions.map((condition, index) => {
              const sourceField = allFields.find(f => f.id === condition.fieldId);
              // Since fields are strict, operators will be standard choice operators
              const operators = getOperatorOptions(); 
              
              return (
                <Box key={index} sx={{ mb: 2, border: '1px solid #eee', p: 2, borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>If Field</InputLabel>
                        <Select
                          value={condition.fieldId}
                          onChange={(e) => handleConditionChange(index, 'fieldId', e.target.value)}
                          label="If Field"
                        >
                          {getFieldsForCondition().map(f => (
                            <MenuItem key={f.id} value={f.id}>
                              {getFieldDisplayLabel(f)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={condition.operator}
                          onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                          label="Operator"
                        >
                          {operators.map(op => (
                            <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={6} sm={4}>
                      {renderConditionValue(condition, sourceField)}
                    </Grid>
                    
                    <Grid item xs={12} sm={1}>
                      <IconButton onClick={() => handleDeleteCondition(index)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              );
            })}

            <Button 
              onClick={handleAddCondition} 
              startIcon={<AddIcon />} 
              size="small"
              disabled={getFieldsForCondition().length === 0}
            >
              Add Condition
            </Button>

            {localLogic.conditions.length > 1 && (
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Match</InputLabel>
                  <Select
                    value={localLogic.logicalOperator}
                    onChange={(e) => setLocalLogic(prev => ({ ...prev, logicalOperator: e.target.value }))}
                  >
                    <MenuItem value="and">All conditions</MenuItem>
                    <MenuItem value="or">Any condition</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Then</Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                value={localLogic.action}
                onChange={(e) => setLocalLogic(prev => ({ ...prev, action: e.target.value }))}
              >
                <MenuItem value="jump_to">Jump to section</MenuItem>
                <MenuItem value="end_form">End form</MenuItem>
              </Select>
            </FormControl>

            {localLogic.action === 'jump_to' && (
              <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                <InputLabel>Go to section</InputLabel>
                <Select
                  value={localLogic.jumpToFieldId}
                  onChange={(e) => setLocalLogic(prev => ({ ...prev, jumpToFieldId: e.target.value }))}
                >
                  {getSectionsForJump().map(f => (
                    <MenuItem key={f.id} value={f.id}>
                      {getFieldDisplayLabel(f)}
                    </MenuItem>
                  ))}
                  {getSectionsForJump().length === 0 && (
                    <MenuItem disabled>No sections available (must be after current section)</MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            {localLogic.action === 'end_form' && (
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                sx={{ mt: 2 }}
                label="Message (Optional)"
                placeholder="Thank you for your response."
                value={localLogic.endFormMessage}
                onChange={(e) => setLocalLogic(prev => ({ ...prev, endFormMessage: e.target.value }))}
              />
            )}
          </Box>
        )}
      </DialogContent>
      
      {validationErrors.length > 0 && (
        <Box sx={{ px: 3, pb: 1 }}>
          <Alert severity="error">
            {validationErrors.map((err, i) => <div key={i}>• {err}</div>)}
          </Alert>
        </Box>
      )}

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConditionalLogicEditor;