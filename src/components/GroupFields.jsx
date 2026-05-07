import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import ConditionalLogicEditor from './ConditionalLogic';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

const GroupFieldEditor = ({ field, fieldIndex, onChange, onGroupFieldChange, onAddGroupField, onDeleteGroupField, allFields }) => {
  const [expanded, setExpanded] = useState(false);
  const [conditionalLogicDialogOpen, setConditionalLogicDialogOpen] = useState(false);
  const [newFieldType, setNewFieldType] = useState('short_answer');

  const handleFieldChange = (property, value) => {
    onChange(fieldIndex, property, value);
  };

  const handleAddGroupFieldItem = () => {
    let defaultOptions = [];
    if (newFieldType === 'dropdown' || newFieldType === 'multiple_choice' || newFieldType === 'checkboxes' || newFieldType === 'radio') {
      defaultOptions = ['Option 1', 'Option 2'];
    }
    
    const newGroupField = {
      id: crypto.randomUUID(), // Generate stable frontend ID
      type: newFieldType,
      question: '',
      required: false,
      options: defaultOptions,
      placeholder: '',
      order: (field.groupFields || []).length
    };
    onAddGroupField(fieldIndex, newGroupField);
  };

  const handleGroupFieldPropertyChange = (groupFieldIndex, property, value) => {
    onGroupFieldChange(fieldIndex, groupFieldIndex, property, value);
  };

  const handleDeleteGroupFieldItem = (groupFieldIndex) => {
    onDeleteGroupField(fieldIndex, groupFieldIndex);
  };

  return (
    <Paper 
      sx={{ 
        p: 0, 
        mb: 3, 
        border: field.type === 'repeatable_group' ? '2px dashed #2A524D' : '2px solid #2A524D',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}
    >
      {/* --- HEADER --- */}
      <Box 
        sx={{ 
          bgcolor: expanded ? '#f8f9fa' : 'transparent',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: expanded ? '1px solid #e0e0e0' : 'none'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {/* <DragIcon sx={{ color: '#999', cursor: 'grab' }} /> */}
          
          <TextField
            value={field.question || ''}
            onChange={(e) => handleFieldChange('question', e.target.value)}
            placeholder="Untitled Group"
            variant="standard"
            InputProps={{
              disableUnderline: true,
              style: { fontSize: '18px', fontWeight: 600, color: '#2A524D', px: 0.5 },
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 1 }}>
                  <DescriptionIcon sx={{ color: '#2A524D', fontSize: 22 }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, '& .MuiInputBase-input': { '&:focus': { bgcolor: 'rgba(42, 82, 77, 0.05)', borderRadius: '4px' } } }}
          />

          {field.type === 'repeatable_group' && (
            <Chip label="Repeatable" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 500 }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Settings">
            <IconButton onClick={() => setConditionalLogicDialogOpen(true)} size="small" color="primary">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {expanded && (
        <Box sx={{ p: 3 }}>
          {/* --- GROUP SETTINGS --- */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #eee' }}>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
              Group Configuration
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Min Items"
                  type="number"
                  size="small"
                  value={field.minItems ||1}
                  onChange={(e) => handleFieldChange('minItems', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 0 }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Items"
                  type="number"
                  size="small"
                  value={field.maxItems || 10}
                  onChange={(e) => handleFieldChange('maxItems', parseInt(e.target.value) || 10)}
                  inputProps={{ min:1 }}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.required || false}
                      onChange={(e) => handleFieldChange('required', e.target.checked)}
                      color="success"
                    />
                  }
                  label="Required"
                  sx={{ ml: 0 }}
                />
              </Grid>
            </Grid>

            {/* --- NEW ADD FIELD CONTROLS (Moved to Top) --- */}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#666' }}>
                Add New Field:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150, maxWidth: 200, flex: 1 }}>
                <Select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  autoWidth
                  sx={{ bgcolor: 'white' }}
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
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddGroupFieldItem}
                sx={{
                  bgcolor: '#2A524D',
                  '&:hover': { bgcolor: '#1e3a32' },
                  textTransform: 'none',
                  boxShadow: 'none'
                }}
              >
                Add
              </Button>
            </Box>
          </Box>

          {/* --- FIELDS LIST --- */}
          <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mb: 2, display: 'block' }}>
            Fields Inside Group
          </Typography>
            
          {field.groupFields && field.groupFields.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              {field.groupFields.map((groupField, groupFieldIndex) => (
                <Paper key={groupField.id || groupFieldIndex} sx={{ 
                  border: '1px solid #e0e0e0',
                  borderLeft: '4px solid #2A524D',
                  boxShadow: 'none', 
                  '&:hover': { 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderColor: '#c0c0c0'
                  },
                  transition: 'all 0.2s ease',
                  bgcolor: '#ffffff',
                  borderRadius: 1,
                  overflow: 'hidden' 
                }}>
                  {/* CONTENT BOX (Replacing CardContent) */}
                  <Box sx={{ p: 2.5 }}>
                    
                    {/* --- ROW 1: Question | Type | Delete --- */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      {/* <DragIcon sx={{ color: '#bbb', cursor: 'grab', fontSize: 20 }} /> */}
                      
                      <TextField
                        placeholder="Field Question"
                        value={groupField.question}
                        onChange={(e) => handleGroupFieldPropertyChange(groupFieldIndex, 'question', e.target.value)}
                        sx={{ flex: 1 }}
                        variant="standard"
                        InputProps={{ disableUnderline: true, style: { fontSize: '15px', fontWeight: 500 } }}
                      />
                      
                      <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>Field Type</InputLabel>
                        <Select
                          value={groupField.type || 'short_answer'}
                          onChange={(e) => handleGroupFieldPropertyChange(groupFieldIndex, 'type', e.target.value)}
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
                        </Select>
                      </FormControl>

                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteGroupFieldItem(groupFieldIndex)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* --- ROW 2: Placeholder | Required --- */}
                    <Box sx={{ ml: '34px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <TextField
                        fullWidth
                        placeholder="Placeholder text"
                        value={groupField.placeholder || ''}
                        onChange={(e) => handleGroupFieldPropertyChange(groupFieldIndex, 'placeholder', e.target.value)}
                        size="small"
                        sx={{ 
                          '& .MuiInputBase-root': { bgcolor: '#f8f9fa', borderRadius: '4px' },
                          '& .MuiInput-underline:before': { display: 'none' }
                        }}
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={groupField.required || false}
                            onChange={(e) => handleGroupFieldPropertyChange(groupFieldIndex, 'required', e.target.checked)}
                            size="small"
                            color="success"
                          />
                        }
                        label="Required"
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' }, ml: 0 }}
                      />
                    </Box>
                    
                    {/* --- ROW 3: OPTIONS (If choice field) --- */}
                                        {/* --- ROW 3: OPTIONS (If choice field) --- */}
                    {(groupField.type === 'dropdown' || groupField.type === 'multiple_choice' || groupField.type === 'checkboxes' || groupField.type === 'radio') && (
                      <Box sx={{ mt: 2, ml: '34px', borderTop: '1px dashed #e0e0e0', pt: 2 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
                          Options
                        </Typography>

                        {/* Check if options exist, otherwise show text */}
                        {groupField.options && groupField.options.length > 0 ? (
                          groupField.options.map((option, optionIndex) => (
                            <Box key={optionIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography sx={{ color: '#999', fontSize: '12px', width: '20px' }}>{optionIndex + 1}.</Typography>
                              <TextField
                                fullWidth
                                size="small"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(groupField.options || [])];
                                  newOptions[optionIndex] = e.target.value;
                                  handleGroupFieldPropertyChange(groupFieldIndex, 'options', newOptions);
                                }}
                                placeholder={`Option ${optionIndex + 1}`}
                                variant="standard"
                                InputProps={{ disableUnderline: true, style: { fontSize: '13px' } }}
                                sx={{ bgcolor: '#f8f9fa', px: 1, borderRadius: '4px' }}
                              />
                              <IconButton 
                                onClick={() => {
                                  const newOptions = [...(groupField.options || [])];
                                  newOptions.splice(optionIndex, 1);
                                  handleGroupFieldPropertyChange(groupFieldIndex, 'options', newOptions);
                                }}
                                size="small"
                                color="error"
                                sx={{ ml: 1 }}
                              >
                                <DeleteIcon fontSize="12" />
                              </IconButton>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic', mb: 2 }}>
                            No options added yet
                          </Typography>
                        )}
                        
                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => {
                            const newOptions = [...(groupField.options || [])];
                            newOptions.push(`Option ${newOptions.length + 1}`);
                            handleGroupFieldPropertyChange(groupFieldIndex, 'options', newOptions);
                          }}
                          variant="text"
                          size="small"
                          sx={{ color: '#2A524D', fontWeight: 600, p: 1, mt: 1 }}
                        >
                          Add Option
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 4, 
                border: '2px dashed #e0e0e0', 
                borderRadius: 2,
                bgcolor: '#fafafa',
                color: '#999',
                mb: 3,
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#2A524D', bgcolor: '#f0f7f6' }
              }}
            >
              <Typography variant="body2">No fields added yet</Typography>
            </Box>
          )}
            
          {/* REMOVED: OLD ADD FIELD FOOTER (Green Box) */}
        </Box>
      )}

      {/* Conditional Logic Dialog */}
      <ConditionalLogicEditor
        field={field}
        allFields={allFields || []}
        onChange={(prop, val) => handleFieldChange(prop, val)}
        open={conditionalLogicDialogOpen}
        onClose={() => setConditionalLogicDialogOpen(false)}
      />
    </Paper>
  );
};

export default GroupFieldEditor;