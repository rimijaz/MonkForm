# FutureGenius Accessible Form Builder

## 🎯 Overview
A fully accessible form builder application designed following WCAG 2.1 AA guidelines and Google Forms UX patterns.

## 🚀 Features

### Core Functionality
- **Login System**: Secure authentication with accessible forms
- **Dashboard**: Form management with statistics and quick actions
- **Form Editor**: Drag-and-drop field creation with real-time preview
- **Form Preview**: Test forms before publishing
- **Response View**: Comprehensive analytics and data export

### Accessibility Features

#### 🎨 Visual Accessibility
- **WCAG AA Color Contrast**: All text meets 4.5:1 contrast ratio
- **High Contrast Mode**: Toggle for users with low vision
- **Focus Indicators**: Clear 2px outlines on interactive elements
- **Responsive Design**: Works on all screen sizes
- **Text Scaling**: Supports up to 200% zoom

#### ⌨️ Keyboard Navigation
- **Tab Order**: Logical navigation following visual layout
- **Skip Links**: Jump to main content, bypass navigation
- **Keyboard Shortcuts**: 
  - `Tab`/`Shift+Tab`: Navigate elements
  - `Enter`/`Space`: Activate buttons/links
  - `Arrow Keys`: Navigate radio buttons, dropdowns
  - `Escape`: Close modals/dropdowns
- **Drag & Drop**: Keyboard-accessible field reordering

#### 🎧 Screen Reader Support
- **Semantic HTML5**: Proper use of `<main>`, `<nav>`, `<section>`, `<article>`
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Live Regions**: Dynamic content announcements
- **Form Validation**: Clear error messages with `aria-invalid`
- **Progress Indicators**: Multi-step form progress

#### 🧠 Cognitive Accessibility
- **Clear Error Messages**: Specific, actionable feedback
- **Consistent Navigation**: Predictable layout across pages
- **Help Text**: Contextual instructions
- **Visual Hierarchy**: Clear typography and spacing
- **Predictable Interactions**: Standard UI patterns

## 🛠️ Technologies Used

### Frontend Stack
- **React 19**: Modern React with hooks
- **Material UI v7**: Accessible component library
- **React Router v6**: Client-side routing
- **Vite**: Fast development server

### Accessibility Libraries
- **@axe-core/react**: Automated accessibility testing
- **Semantic HTML5**: Native accessibility
- **ARIA Attributes**: Enhanced screen reader support

## 🎯 Page-by-Page Accessibility

### 1. Login Page
- ✅ Semantic form structure with `<label>` elements
- ✅ `aria-label` and `aria-describedby` for inputs
- ✅ Error announcements with `role="alert"`
- ✅ Focus management on form submission
- ✅ Password visibility toggle

### 2. Dashboard
- ✅ Skip navigation link
- ✅ Main navigation with `role="navigation"`
- ✅ Form cards with `role="article"`
- ✅ Statistics in `aria-live="region"`
- ✅ Keyboard shortcuts (`Ctrl+N` for new form)

### 3. Form Editor
- ✅ Drag-and-drop with `aria-grabbed`/`aria-dropeffect`
- ✅ Field type selection with clear icons
- ✅ Real-time validation feedback
- ✅ High contrast mode toggle
- ✅ Screen reader announcements for actions

### 4. Preview Page
- ✅ Form structure with `<fieldset>`/`<legend>`
- ✅ Required field indicators (visual + screen reader)
- ✅ Radio button groups with `role="radiogroup"`
- ✅ Error handling with `aria-live="assertive"`
- ✅ Progress indicators

### 5. Response View
- ✅ Data tables with proper headers
- ✅ Sortable columns with `aria-sort`
- ✅ Filter controls with `aria-label`
- ✅ Export options with clear file types
- ✅ Pagination with `aria-label`

## 🧪 Testing Checklist

### Manual Testing
- [ ] Navigate entire app with keyboard only
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Check color contrast with browser tools
- [ ] Test high contrast mode
- [ ] Verify text scaling to 200%
- [ ] Test with mobile devices

### Automated Testing
- [ ] Run axe-core accessibility audit
- [ ] Check HTML5 semantic structure
- [ ] Validate ARIA attributes
- [ ] Test keyboard navigation patterns

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Setup
Create `.env` file:
```
VITE_API_URL=http://localhost:5000
```

### Accessibility Guidelines
1. Test all changes with keyboard navigation
2. Run axe-core audit before committing
3. Include ARIA labels for new interactive elements
4. Maintain semantic HTML structure
5. Test with screen readers

### Code Standards
- Use semantic HTML5 elements
- Include proper ARIA attributes
- Test keyboard navigation
- Validate color contrast
- Test with assistive technologies

### Resources
- [Material UI Accessibility](https://mui.com/material-ui/accessibility/)
- [React ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core Documentation](https://www.deque.com/axe/)
