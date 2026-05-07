import React from 'react';
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
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

const GroupFieldRenderer = ({ field, value, onChange, error }) => {
  const handleGroupFieldChange = (groupFieldId, newValue) => {
    onChange(field.id, {
      ...value,
      [groupFieldId]: newValue
    });
  };

  const renderGroupField = (groupField) => {
    const groupFieldValue = value?.[groupField.id] || '';
    const groupFieldError = error?.[groupField.id] || '';

    switch (groupField.type) {
      case 'short_answer':
      case 'text':
        return (
          <TextField
            fullWidth
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleGroupFieldChange(groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'paragraph':
      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleGroupFieldChange(groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'email':
        return (
          <TextField
            fullWidth
            type="email"
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleGroupFieldChange(groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleGroupFieldChange(groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'phone':
        return (
          <TextField
            fullWidth
            type="tel"
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleGroupFieldChange(groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleGroupFieldChange(groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        );

      case 'dropdown':
        return (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel required={groupField.required}>{groupField.question}</InputLabel>
            <Select
              value={groupFieldValue}
              onChange={(e) => handleGroupFieldChange(groupField.id, e.target.value)}
              label={groupField.question}
              error={!!groupFieldError}
            >
              {(groupField.options || []).map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiple_choice':
      case 'radio':
        return (
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <Typography component="legend" required={groupField.required}>
              {groupField.question}
            </Typography>
            <RadioGroup
              value={groupFieldValue}
              onChange={(e) => handleGroupFieldChange(groupField.id, e.target.value)}
            >
              {(groupField.options || []).map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'checkboxes':
        return (
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <Typography component="legend" required={groupField.required}>
              {groupField.question}
            </Typography>
            <FormGroup>
              {(groupField.options || []).map((option, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={Array.isArray(groupFieldValue) ? groupFieldValue.includes(option) : false}
                      onChange={(e) => {
                        const currentValues = Array.isArray(groupFieldValue) ? groupFieldValue : [];
                        if (e.target.checked) {
                          handleGroupFieldChange(groupField.id, [...currentValues, option]);
                        } else {
                          handleGroupFieldChange(groupField.id, currentValues.filter(v => v !== option));
                        }
                      }}
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
          </FormControl>
        );

      default:
        return (
          <TextField
            fullWidth
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleGroupFieldChange(groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, border: '2px solid #1976d2' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
        {field.question}
        {field.required && <span style={{ color: '#d32f2f' }}> *</span>}
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      {field.groupFields?.map((groupField, index) => (
        <Box key={groupField.id || index}>
          {renderGroupField(groupField)}
        </Box>
      ))}
    </Paper>
  );
};

const RepeatableGroupFieldRenderer = ({ field, value, onChange, onAddInstance, onRemoveInstance, error }) => {
  const items = Array.isArray(value) ? value : [{}];

  const handleAddItem = () => {
    if (items.length < (field.maxItems || 10)) {
      // Use the dedicated add instance handler for proper state management
      onAddInstance(field.id);
    }
  };

  const handleRemoveItem = (index) => {
    if (items.length > (field.minItems || 1)) {
      // Use the dedicated remove instance handler for proper state management
      onRemoveInstance(field.id, index);
    }
  };

  const handleItemChange = (itemIndex, groupFieldId, newValue) => {
    const newItems = [...items]; // ✅ IMMUTABLE: Create new array
    newItems[itemIndex] = {
      ...newItems[itemIndex], // ✅ IMMUTABLE: Create new object
      [groupFieldId]: newValue
    };
    onChange(field.id, newItems); // ✅ IMMUTABLE: Pass new array
  };

  const renderGroupField = (groupField, itemIndex, itemValue) => {
    const groupFieldValue = itemValue?.[groupField.id] || '';
    const groupFieldError = error?.[itemIndex]?.[groupField.id] || '';

    switch (groupField.type) {
      case 'short_answer':
      case 'text':
        return (
          <TextField
            fullWidth
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleItemChange(itemIndex, groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'paragraph':
      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleItemChange(itemIndex, groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'email':
        return (
          <TextField
            fullWidth
            type="email"
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleItemChange(itemIndex, groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleItemChange(itemIndex, groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'dropdown':
        return (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel required={groupField.required}>{groupField.question}</InputLabel>
            <Select
              value={groupFieldValue}
              onChange={(e) => handleItemChange(itemIndex, groupField.id, e.target.value)}
              label={groupField.question}
              error={!!groupFieldError}
            >
              {(groupField.options || []).map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiple_choice':
      case 'radio':
        return (
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <Typography component="legend" required={groupField.required}>
              {groupField.question}
            </Typography>
            <RadioGroup
              value={groupFieldValue}
              onChange={(e) => handleItemChange(itemIndex, groupField.id, e.target.value)}
            >
              {(groupField.options || []).map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      default:
        return (
          <TextField
            fullWidth
            label={groupField.question}
            value={groupFieldValue}
            onChange={(e) => handleItemChange(itemIndex, groupField.id, e.target.value)}
            error={!!groupFieldError}
            helperText={groupFieldError}
            required={groupField.required}
            placeholder={groupField.placeholder}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, border: '2px solid #1976d2' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          {field.question}
          {field.required && <span style={{ color: '#d32f2f' }}> *</span>}
        </Typography>
        
        {items.length < (field.maxItems || 10) && (
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            variant="outlined"
            size="small"
          >
            {field.addButtonText || 'Add Item'}
          </Button>
        )}
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {items.map((item, itemIndex) => (
        <Box key={itemIndex} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Item {itemIndex + 1}
            </Typography>
            
            {items.length > (field.minItems || 1) && (
              <IconButton
                onClick={() => handleRemoveItem(itemIndex)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
          
          {field.groupFields?.map((groupField) => (
            <Box key={groupField.id}>
              {renderGroupField(groupField, itemIndex, item)}
            </Box>
          ))}
          
          {itemIndex < items.length - 1 && <Divider sx={{ my: 2 }} />}
        </Box>
      ))}
    </Paper>
  );
};

export { GroupFieldRenderer, RepeatableGroupFieldRenderer };
