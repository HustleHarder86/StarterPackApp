// components/PropertyAnalysisForm.jsx
const PropertyAnalysisForm = ({ onSubmit, loading, analysisLimit }) => {
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    stateProvince: '',
    country: '',
    postalCode: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.street) newErrors.street = 'Street address is required';
    if (!formData.city) newErrors.city = 'City is required';
    // ... more validation
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  // ... rest of component
};
