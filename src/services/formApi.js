// API service for form operations

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://monk-form-backend.vercel.app/api';

// Helper function to get auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Form API service
export const formApi = {
  // Create a new form
  createForm: async (formData) => {
    try {
      console.log('Frontend sending formData:', formData);
      console.log('Frontend sending JSON:', JSON.stringify(formData));
      
      // Debug: Check specifically for null IDs in the payload
      if (formData.fields) {
        formData.fields.forEach((field, index) => {
          if (field.id === null) {
            console.error(`ERROR: Found null ID in field ${index}:`, field);
          }
          if (field.groupFields) {
            field.groupFields.forEach((gf, gfIndex) => {
              if (gf.id === null) {
                console.error(`ERROR: Found null ID in groupField ${gfIndex} of field ${index}:`, gf);
              }
            });
          }
        });
      }
      
      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create form');
      }

      return data;
    } catch (error) {
      console.error('Error creating form:', error);
      throw error;
    }
  },

  // Get all forms
  getForms: async (filters = {}) => {
    try {
      // const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/forms`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      console.log(response, 'qqqqqqqqqqqqqqqqq', data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch forms');
      }

      return data;
    } catch (error) {
      console.error('Error fetching forms:', error);
      throw error;
    }
  },

  // Get form by ID
  getFormById: async (formId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching form:', error);
      throw error;
    }
  },

  // Update form
  updateForm: async (formId, formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update form');
      }

      return data;
    } catch (error) {
      console.error('Error updating form:', error);
      throw error;
    }
  },

  // Delete form
  deleteForm: async (formId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete form');
      }

      return data;
    } catch (error) {
      console.error('Error deleting form:', error);
      throw error;
    }
  },

  // Submit form response
  submitFormResponse: async (formId, payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  },

  // Get form responses
  getFormResponses: async (formId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}/responses`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching form responses:', error);
      throw error;
    }
  },

  // Evaluate form visibility dynamically
  getFormVisibility: async (formId, answers) => {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}/evaluateVisibility`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to evaluate form visibility');
      }

      return data;
    } catch (error) {
      console.error('Error evaluating form visibility:', error);
      throw error;
    }
  }
};

// Helper function to convert frontend questions to backend fields
export const convertQuestionsToFields = (questions) => {
  console.log('=== convertQuestionsToFields called ===');
  console.log('convertQuestionsToQuestions input:', questions);
  console.log('Number of questions:', questions?.length);
  
  // Debug: Check for any null IDs and conditionalLogic
  questions.forEach((q, index) => {
    if (q.id === null) {
      console.log(`Found null ID in question ${index}:`, q);
    }
    if (q.conditionalLogic) {
      console.log(`Found conditionalLogic in question ${index}:`, q.conditionalLogic);
    }
    if (q.groupFields) {
      q.groupFields.forEach((gf, gfIndex) => {
        if (gf.id === null) {
          console.log(`Found null ID in groupField ${gfIndex} of question ${index}:`, gf);
        }
      });
    }
  });
  return questions.map((question, index) => {
    if (question.type === 'group' || question.type === 'repeatable_group') {
      console.log('Group field found:', question);
      console.log('groupFields:', question.groupFields);
    }
    // Base field structure
    const baseField = {
      type: question.type,
      question: question.question || '',
      required: question.required || false,
      options: question.options || [],
      placeholder: question.placeholder || '',
      order: index,
      // Attach conditional logic if exists
      ...(question.conditionalLogic && { conditionalLogic: question.conditionalLogic })
    };

    // Add ID only if it exists and is not null (for existing forms)
    // For new forms, send id: null to clearly indicate backend should generate ID
    if (question.id && question.id !== null) {
      baseField.id = question.id;
    } else {
      // Send null for new fields - backend should generate ID
      baseField.id = null;
    }

    // IF IT'S A GROUP OR REPEATABLE FIELD
    if (question.type === 'group' || question.type === 'repeatable_group') {
      baseField.groupFields = question.groupFields && question.groupFields.length > 0 
        ? question.groupFields.map(groupField => {
            // Create group field without ID for new fields, or with ID for existing ones
            const groupFieldObj = {
              type: groupField.type,
              question: groupField.question || '',
              required: groupField.required || false,
              options: groupField.options || [],
              placeholder: groupField.placeholder || '',
              order: groupField.order || 0
            };
            
            // Add ID only if it exists and is not null (for existing forms)
            // For new forms, send id: null to clearly indicate backend should generate ID
            if (groupField.id && groupField.id !== null) {
              groupFieldObj.id = groupField.id;
            } else {
              // Send null for new group fields - backend should generate ID
              groupFieldObj.id = null;
            }
            
            return groupFieldObj;
          })
        // If empty, inject a dummy field with id: null so backend generates ID
        : [{
            id: null,
            type: 'short_answer',
            question: 'Untitled Question',
            required: false,
            options: []
          }];
      
      // Add repeatable specific properties
      baseField.minItems = question.minItems || 1;
      baseField.maxItems = question.maxItems || 10;
      baseField.addButtonText = question.addButtonText || 'Add Item';
      baseField.removeButtonText = question.removeButtonText || 'Remove';
    }

    // 🔧 CRITICAL FIX: Preserve conditionalLogic
    if (question.conditionalLogic) {
      console.log(`🔧 Preserving conditionalLogic for field ${question.id}:`, question.conditionalLogic);
      baseField.conditionalLogic = question.conditionalLogic;
    }

    if (question.type === 'group' || question.type === 'repeatable_group') {
      console.log('Final baseField for group:', baseField);
    }

    return baseField;
  });
};

// Helper function to convert backend fields to frontend questions
export const convertFieldsToQuestions = (fields) => {
  console.log('=== convertFieldsToQuestions called ===');
  console.log('Input fields:', fields);
  
  const result = fields.map((field) => {
    console.log(`Processing field: ${field.id}, conditionalLogic:`, field.conditionalLogic);
    
    return {
      id: field.id,
      type: field.type,
      question: field.question,
      required: field.required,
      options: field.options || [],
      placeholder: field.placeholder || '',
      // Preserve conditionalLogic and other properties
      conditionalLogic: field.conditionalLogic || null,
      groupFields: field.groupFields || [],
      minItems: field.minItems || 1,
      maxItems: field.maxItems || 10,
      addButtonText: field.addButtonText || 'Add Item',
      removeButtonText: field.removeButtonText || 'Remove',
      order: field.order || 0
    };
  });
  
  console.log('Output questions:', result);
  return result;
};
