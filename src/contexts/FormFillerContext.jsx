import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { formApi } from '../services/formApi';

// Initial state structure
const initialState = {
  answers: {}, // Normal fields: { "fld_1": "Ali", "fld_2": "Pakistan" }
  repeatableAnswers: {}, // Repeatable groups: { "grp_1": [ { "subfld_1": "BS" }, { "subfld_1": "MS" } ] }
  visibleFieldIds: [], // Array of visible field IDs from backend evaluator
  loading: false,
  error: null
};

// Action types
const actionTypes = {
  SET_ANSWER: 'SET_ANSWER',
  SET_REPEATABLE_ANSWER: 'SET_REPEATABLE_ANSWER',
  ADD_REPEATABLE_INSTANCE: 'ADD_REPEATABLE_INSTANCE',
  REMOVE_REPEATABLE_INSTANCE: 'REMOVE_REPEATABLE_INSTANCE',
  SET_VISIBILITY: 'SET_VISIBILITY',
  RESET_FORM: 'RESET_FORM',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Helper function to clean up answers when visibility changes
const cleanupHiddenAnswers = (answers, repeatableAnswers, visibleFieldIds) => {
  const cleanedAnswers = { ...answers };
  const cleanedRepeatableAnswers = { ...repeatableAnswers };

  // Remove answers for hidden normal fields
  Object.keys(cleanedAnswers).forEach(fieldId => {
    if (!visibleFieldIds.includes(fieldId)) {
      delete cleanedAnswers[fieldId];
    }
  });

  // Remove answers for hidden repeatable groups
  Object.keys(cleanedRepeatableAnswers).forEach(groupId => {
    if (!visibleFieldIds.includes(groupId)) {
      delete cleanedRepeatableAnswers[groupId];
    }
  });

  return { cleanedAnswers, cleanedRepeatableAnswers };
};

// Reducer function with immutable updates
const formFillerReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_ANSWER:
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.fieldId]: action.payload.value
        }
      };

    case actionTypes.SET_REPEATABLE_ANSWER:
      return {
        ...state,
        repeatableAnswers: {
          ...state.repeatableAnswers,
          [action.payload.groupId]: action.payload.instances
        }
      };

    case actionTypes.ADD_REPEATABLE_INSTANCE:
      const { groupId, newInstance } = action.payload;
      const currentInstances = state.repeatableAnswers[groupId] || [];
      
      return {
        ...state,
        repeatableAnswers: {
          ...state.repeatableAnswers,
          [groupId]: [...currentInstances, newInstance] // ✅ IMMUTABLE: spread syntax
        }
      };

    case actionTypes.REMOVE_REPEATABLE_INSTANCE:
      const { groupId: removeGroupId, instanceIndex } = action.payload;
      const currentRemoveInstances = state.repeatableAnswers[removeGroupId] || [];
      
      return {
        ...state,
        repeatableAnswers: {
          ...state.repeatableAnswers,
          [removeGroupId]: currentRemoveInstances.filter((_, index) => index !== instanceIndex) // ✅ IMMUTABLE: filter
        }
      };

    case actionTypes.SET_VISIBILITY:
      const { visibleFieldIds, cleanupData = true } = action.payload;
      
      if (cleanupData) {
        // Clean up answers for hidden fields
        const { cleanedAnswers, cleanedRepeatableAnswers } = cleanupHiddenAnswers(
          state.answers,
          state.repeatableAnswers,
          visibleFieldIds
        );

        return {
          ...state,
          visibleFieldIds,
          answers: cleanedAnswers,
          repeatableAnswers: cleanedRepeatableAnswers
        };
      }

      return {
        ...state,
        visibleFieldIds
      };

    case actionTypes.RESET_FORM:
      return {
        ...initialState,
        visibleFieldIds: state.visibleFieldIds // Keep initial visibility
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    default:
      return state;
  }
};

// Create context
const FormFillerContext = createContext(null);

// Provider component
export const FormFillerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(formFillerReducer, initialState);

  // Action creators with useCallback for performance
  const actions = {
    setAnswer: useCallback((fieldId, value) => {
      dispatch({
        type: actionTypes.SET_ANSWER,
        payload: { fieldId, value }
      });
    }, []),

    setRepeatableAnswer: useCallback((groupId, instances) => {
      dispatch({
        type: actionTypes.SET_REPEATABLE_ANSWER,
        payload: { groupId, instances }
      });
    }, []),

    addRepeatableInstance: useCallback((groupId, newInstance = {}) => {
      dispatch({
        type: actionTypes.ADD_REPEATABLE_INSTANCE,
        payload: { groupId, newInstance }
      });
    }, []),

    removeRepeatableInstance: useCallback((groupId, instanceIndex) => {
      dispatch({
        type: actionTypes.REMOVE_REPEATABLE_INSTANCE,
        payload: { groupId, instanceIndex }
      });
    }, []),

    setVisibility: useCallback((visibleFieldIds, cleanupData = true) => {
      dispatch({
        type: actionTypes.SET_VISIBILITY,
        payload: { visibleFieldIds, cleanupData }
      });
    }, []),

    resetForm: useCallback(() => {
      dispatch({
        type: actionTypes.RESET_FORM
      });
    }, []),

    setLoading: useCallback((loading) => {
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: loading
      });
    }, []),

    setError: useCallback((error) => {
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: error
      });
    }, [])
  };

  // Function to evaluate visibility using backend API
  const evaluateVisibility = useCallback(async (formId, currentAnswers) => {
    try {
      actions.setLoading(true);
      actions.setError(null);

      const response = await formApi.getFormVisibility(formId, currentAnswers);
      const visibleFieldIds = response.data?.visibleFieldIds || [];
      
      actions.setVisibility(visibleFieldIds);
      
      return visibleFieldIds;
    } catch (error) {
      console.error('Error evaluating visibility:', error);
      actions.setError(error.message || 'Failed to evaluate visibility');
      return []; // Return empty array on error to prevent infinite loops
    } finally {
      actions.setLoading(false);
    }
  }, [actions]);

  const contextValue = {
    ...state,
    actions,
    evaluateVisibility
  };

  return (
    <FormFillerContext.Provider value={contextValue}>
      {children}
    </FormFillerContext.Provider>
  );
};

// Custom hook to use the context
export const useFormFiller = () => {
  const context = useContext(FormFillerContext);
  
  if (!context) {
    throw new Error('useFormFiller must be used within a FormFillerProvider');
  }
  
  return context;
};

// Export for testing
export { formFillerReducer, actionTypes, initialState };
